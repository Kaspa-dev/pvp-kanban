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
    public const string SessionUpdatedEventName = "SessionUpdated";
    public const string VotingUpdatedEventName = "VotingUpdated";
    public const string SessionDeletedEventName = "SessionDeleted";

    private readonly IPlanningPokerSessionService _service = service;
    private readonly AppDbContext _context = context;

    public static string GetGroupNameForSession(int sessionId) => $"planning-poker-session:{sessionId}";

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

            string groupName = GetGroupNameForSession(result.Session.SessionId);
            if (ConnectedParticipants.TryGetValue(Context.ConnectionId, out ConnectedPlanningPokerParticipant? previousParticipant) &&
                previousParticipant.SessionId != result.Session.SessionId)
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    GetGroupNameForSession(previousParticipant.SessionId),
                    Context.ConnectionAborted);
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            ConnectedParticipants[Context.ConnectionId] = new ConnectedPlanningPokerParticipant(
                result.Session.SessionId,
                joinToken.Trim().ToLowerInvariant(),
                result.ParticipantToken,
                TryGetCurrentUserId());
            await Clients.Group(groupName).SendAsync(SessionUpdatedEventName, result.Session, Context.ConnectionAborted);

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

            string groupName = GetGroupNameForSession(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(VotingUpdatedEventName, session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(SessionUpdatedEventName, session, Context.ConnectionAborted);

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

            string groupName = GetGroupNameForSession(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(VotingUpdatedEventName, session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(SessionUpdatedEventName, session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task<PlanningPokerSessionDto> SelectRecommendation(
        string joinToken,
        int storyPoints,
        string? participantToken = null)
    {
        try
        {
            PlanningPokerSessionDto session = await _service.SelectRecommendationAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                storyPoints,
                Context.ConnectionAborted);

            string groupName = GetGroupNameForSession(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(SessionUpdatedEventName, session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task<PlanningPokerSessionDto> AdvanceToNextTask(
        string joinToken,
        string? participantToken = null)
    {
        try
        {
            PlanningPokerSessionDto session = await _service.AdvanceToNextTaskAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                Context.ConnectionAborted);

            string groupName = GetGroupNameForSession(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(VotingUpdatedEventName, session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(SessionUpdatedEventName, session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task<PlanningPokerSessionDto> ActivateBacklogTask(
        string joinToken,
        int taskId,
        string? participantToken = null)
    {
        try
        {
            PlanningPokerSessionDto session = await _service.ActivateBacklogTaskAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                taskId,
                Context.ConnectionAborted);

            string groupName = GetGroupNameForSession(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(VotingUpdatedEventName, session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync(SessionUpdatedEventName, session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task DeleteSession(string joinToken, string? participantToken = null)
    {
        try
        {
            PlanningPokerDeletedSessionResult result = await _service.DeleteSessionAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                Context.ConnectionAborted);
            string groupName = GetGroupNameForSession(result.SessionId);
            await Clients.Group(groupName).SendAsync(
                SessionDeletedEventName,
                new PlanningPokerSessionDeletedDto
                {
                    BoardId = result.BoardId,
                    Message = "This planning poker session was deleted by the host.",
                },
                Context.ConnectionAborted);
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
                    await Clients.Group(GetGroupNameForSession(participant.SessionId))
                        .SendAsync(SessionUpdatedEventName, session, CancellationToken.None);
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
        Dictionary<int, int> revealedVoteLookup = activeTask is not null &&
            activeTask.RoundState.Equals("revealed", StringComparison.OrdinalIgnoreCase)
                ? activeTask.Votes.ToDictionary(vote => vote.ParticipantId, vote => vote.CardValue)
                : new Dictionary<int, int>();

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
                    RevealedCardValue = revealedVoteLookup.TryGetValue(item.Id, out int cardValue)
                        ? cardValue
                        : null,
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
            VoteSummary = sessionTask.Votes
                .GroupBy(vote => vote.CardValue)
                .OrderBy(group => group.Key)
                .Select(group => new PlanningPokerVoteSummaryDto
                {
                    CardValue = group.Key,
                    Count = group.Count(),
                })
                .ToList(),
        };
    }
}
