using System.Collections.Concurrent;
using System.Security.Claims;
using BE.Data;
using BE.DTOs;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace BE.Hubs;

public class PlanningPokerHub(IPlanningPokerSessionService service, AppDbContext context) : Hub
{
    private static readonly ConcurrentDictionary<string, ConnectedPlanningPokerParticipant> ConnectedParticipants = new();

    private readonly IPlanningPokerSessionService _service = service;
    private readonly AppDbContext _context = context;

    public async Task<PlanningPokerHubJoinResponse> JoinSession(
        string joinToken,
        string? participantToken = null,
        string? displayName = null)
    {
        try
        {
            PlanningPokerJoinResult result = await _service.JoinSessionAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                displayName,
                Context.ConnectionAborted);
            int participantId = await _context.Set<Models.PlanningPokerParticipant>()
                .AsNoTracking()
                .Where(item =>
                    item.SessionId == result.Session.SessionId &&
                    item.ParticipantToken == result.ParticipantToken)
                .Select(item => item.Id)
                .SingleAsync(Context.ConnectionAborted);

            string groupName = GetGroupName(result.Session.SessionId);
            if (ConnectedParticipants.TryGetValue(Context.ConnectionId, out ConnectedPlanningPokerParticipant? previousParticipant) &&
                previousParticipant.SessionId != result.Session.SessionId)
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    GetGroupName(previousParticipant.SessionId),
                    Context.ConnectionAborted);
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            ConnectedParticipants[Context.ConnectionId] = new ConnectedPlanningPokerParticipant(
                result.Session.SessionId,
                joinToken.Trim().ToLowerInvariant(),
                result.ParticipantToken,
                TryGetCurrentUserId());
            await Clients.Group(groupName).SendAsync("SessionUpdated", result.Session, Context.ConnectionAborted);

            return new PlanningPokerHubJoinResponse
            {
                Session = result.Session,
                ParticipantToken = result.ParticipantToken,
                ParticipantId = participantId,
            };
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task<PlanningPokerSessionDto> SubmitVote(
        string joinToken,
        int cardValue,
        string? participantToken = null)
    {
        try
        {
            PlanningPokerSessionDto session = await _service.SubmitVoteAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                cardValue,
                Context.ConnectionAborted);

            string groupName = GetGroupName(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("VotingUpdated", session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("SessionUpdated", session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task<PlanningPokerSessionDto> RevealVotes(string joinToken, string? participantToken = null)
    {
        try
        {
            PlanningPokerSessionDto session = await _service.RevealVotesAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                Context.ConnectionAborted);

            string groupName = GetGroupName(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("VotingUpdated", session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("SessionUpdated", session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    private int? TryGetCurrentUserId()
    {
        string? value =
            Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
            Context.User?.FindFirstValue(ClaimTypes.Sid) ??
            Context.User?.FindFirstValue("sub");

        return int.TryParse(value, out int userId) ? userId : null;
    }

    private static string GetGroupName(int sessionId) => $"planning-poker-session:{sessionId}";

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectedParticipants.TryRemove(Context.ConnectionId, out ConnectedPlanningPokerParticipant? participant))
        {
            try
            {
                PlanningPokerSessionDto? session = await LoadSessionSnapshotByJoinTokenAsync(
                    participant.JoinToken,
                    CancellationToken.None);

                if (session is not null)
                {
                    await Clients.Group(GetGroupName(participant.SessionId))
                        .SendAsync("SessionUpdated", session, CancellationToken.None);
                }
            }
            catch (PlanningPokerException)
            {
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public sealed class PlanningPokerHubJoinResponse
    {
        public PlanningPokerSessionDto Session { get; set; } = new();
        public string ParticipantToken { get; set; } = string.Empty;
        public int ParticipantId { get; set; }
    }

    private sealed record ConnectedPlanningPokerParticipant(
        int SessionId,
        string JoinToken,
        string ParticipantToken,
        int? UserId);

    private async System.Threading.Tasks.Task<PlanningPokerSessionDto?> LoadSessionSnapshotByJoinTokenAsync(
        string joinToken,
        CancellationToken cancellationToken)
    {
        string token = joinToken.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        BE.Models.PlanningPokerSession? session = await _context.PlanningPokerSessions
            .Include(item => item.ActiveSessionTask)
            .ThenInclude(task => task!.Task)
            .Include(item => item.ActiveSessionTask)
            .ThenInclude(task => task!.Votes)
            .Include(item => item.Tasks)
            .ThenInclude(task => task.Task)
            .Include(item => item.Tasks)
            .ThenInclude(task => task.Votes)
            .Include(item => item.Participants)
            .AsSplitQuery()
            .FirstOrDefaultAsync(item => item.JoinToken == token && item.Status == "active", cancellationToken);

        return session is null ? null : ToSessionDto(session);
    }

    private static PlanningPokerSessionDto ToSessionDto(BE.Models.PlanningPokerSession session)
    {
        BE.Models.PlanningPokerSessionTask? activeTask = session.ActiveSessionTask
            ?? session.Tasks
                .OrderBy(task => task.Position)
                .FirstOrDefault(task => task.RoundState.Equals("voting", StringComparison.OrdinalIgnoreCase))
            ?? session.Tasks.OrderBy(task => task.Position).FirstOrDefault();

        HashSet<int> votedParticipantIds = activeTask?.Votes
            .Select(vote => vote.ParticipantId)
            .ToHashSet() ?? new HashSet<int>();

        return new PlanningPokerSessionDto
        {
            SessionId = session.Id,
            BoardId = session.BoardId,
            JoinToken = session.JoinToken,
            JoinUrl = $"/planning-poker/{session.JoinToken}",
            Status = session.Status,
            ActiveTask = activeTask is null ? new PlanningPokerSessionTaskDto() : ToSessionTaskDto(activeTask),
            Queue = session.Tasks
                .OrderBy(task => task.Position)
                .Where(task => activeTask is null || task.Id != activeTask.Id)
                .Select(ToSessionTaskDto)
                .ToList(),
            Participants = session.Participants
                .OrderByDescending(item => item.IsHost)
                .ThenBy(item => item.DisplayName)
                .Select(item => new PlanningPokerParticipantDto
                {
                    ParticipantId = item.Id,
                    DisplayName = item.DisplayName,
                    IsHost = item.IsHost,
                    IsGuest = item.IsGuest,
                    HasVoted = votedParticipantIds.Contains(item.Id),
                })
                .ToList(),
            IsRevealed = activeTask is not null &&
                activeTask.RoundState.Equals("revealed", StringComparison.OrdinalIgnoreCase),
        };
    }

    private static PlanningPokerSessionTaskDto ToSessionTaskDto(BE.Models.PlanningPokerSessionTask sessionTask)
    {
        return new PlanningPokerSessionTaskDto
        {
            SessionTaskId = sessionTask.Id,
            TaskId = sessionTask.TaskId,
            Title = sessionTask.Task.Title,
            Description = sessionTask.Task.Description,
            Position = sessionTask.Position,
            RoundState = sessionTask.RoundState,
            RecommendedStoryPoints = sessionTask.RecommendedStoryPoints,
            AppliedStoryPoints = sessionTask.Task.StoryPoints,
        };
    }
}
