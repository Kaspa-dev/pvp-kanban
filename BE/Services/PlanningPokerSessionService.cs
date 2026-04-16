using BE.Data;
using BE.DTOs;
using BE.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace BE.Services;

using BoardTaskStatus = BE.Models.TaskStatus;
using TaskEntity = BE.Models.Task;

public class PlanningPokerSessionService : IPlanningPokerSessionService
{
    private const string BacklogStatusTitle = "backlog";
    private const string ActiveSessionStatus = "active";
    private const string VotingRoundState = "voting";
    private const string PendingRoundState = "pending";
    private const string RevealedRoundState = "revealed";

    private readonly AppDbContext _context;

    public PlanningPokerSessionService(AppDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> CreateSessionAsync(int boardId, int hostUserId, CancellationToken cancellationToken)
    {
        Board board = await GetBoardWithMembershipsAsync(boardId, hostUserId, cancellationToken);
        if (await _context.PlanningPokerSessions.AnyAsync(session => session.BoardId == boardId && session.Status == ActiveSessionStatus, cancellationToken))
        {
            throw new InvalidOperationException("There is already an active planning poker session for this board.");
        }

        var backlogTasks = await _context.Tasks
            .Include(task => task.Status)
            .Where(task =>
                task.BoardId == boardId &&
                task.StoryPoints == null &&
                task.Status.Title == BacklogStatusTitle)
            .OrderByDescending(task => task.IsQueued)
            .ThenByDescending(task => task.Id)
            .ToListAsync(cancellationToken);

        if (backlogTasks.Count == 0)
        {
            throw new InvalidOperationException("There are no unestimated backlog tasks for planning poker.");
        }

        DateTime now = DateTime.UtcNow;
        var session = new PlanningPokerSession
        {
            BoardId = boardId,
            HostUserId = hostUserId,
            JoinToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant(),
            Status = ActiveSessionStatus,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        session.Tasks = backlogTasks.Select((task, index) => new PlanningPokerSessionTask
        {
            TaskId = task.Id,
            Position = index,
            RoundState = index == 0 ? VotingRoundState : PendingRoundState,
        }).ToList();
        session.ActiveSessionTask = session.Tasks.First();
        session.Participants.Add(new PlanningPokerParticipant
        {
            UserId = hostUserId,
            ParticipantToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant(),
            DisplayName = BuildDisplayName(board.Memberships.Single(membership => membership.UserId == hostUserId).User),
            IsHost = true,
            IsGuest = false,
            LastSeenAtUtc = now,
        });

        _context.PlanningPokerSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);

        return await LoadSessionDtoByIdAsync(session.Id, cancellationToken);
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> GetBoardSessionAsync(int boardId, int userId, CancellationToken cancellationToken)
    {
        Board board = await GetBoardWithMembershipsAsync(boardId, userId, cancellationToken);
        PlanningPokerSession session = await GetActiveSessionForBoardAsync(boardId, cancellationToken);

        await EnsureBoardMemberParticipantAsync(session, board, userId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await LoadSessionDtoByIdAsync(session.Id, cancellationToken);
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> GetSessionByTokenAsync(string joinToken, CancellationToken cancellationToken)
    {
        string token = joinToken.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("Join token is required.");
        }

        PlanningPokerSession session = await LoadSessionForDtoQuery()
            .FirstOrDefaultAsync(candidate => candidate.JoinToken == token, cancellationToken)
            ?? throw new InvalidOperationException("Planning poker session was not found.");

        return ToSessionDto(session);
    }

    public async System.Threading.Tasks.Task<BoardTaskDto> ApplyRecommendationAsync(int boardId, int sessionTaskId, int userId, CancellationToken cancellationToken)
    {
        Board board = await GetBoardWithMembershipsAsync(boardId, userId, cancellationToken);
        PlanningPokerSessionTask sessionTask = await _context.PlanningPokerSessionTasks
            .Include(item => item.Task)
            .Include(item => item.Session)
            .FirstAsync(item => item.Id == sessionTaskId, cancellationToken);

        if (sessionTask.Session.BoardId != boardId ||
            sessionTask.Session.Status != ActiveSessionStatus ||
            sessionTask.Session.ActiveSessionTaskId != sessionTask.Id)
        {
            throw new InvalidOperationException("There is no recommendation to apply.");
        }

        if (sessionTask.RecommendedStoryPoints is null)
        {
            throw new InvalidOperationException("There is no recommendation to apply.");
        }

        sessionTask.Task.StoryPoints = sessionTask.RecommendedStoryPoints;
        sessionTask.Session.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await LoadBoardTaskDtoAsync(board, sessionTask.TaskId, cancellationToken);
    }

    private async System.Threading.Tasks.Task<Board> GetBoardWithMembershipsAsync(int boardId, int userId, CancellationToken cancellationToken)
    {
        Board? board = await _context.Boards
            .Include(board => board.Memberships)
            .ThenInclude(membership => membership.User)
            .FirstOrDefaultAsync(board => board.Id == boardId, cancellationToken);

        if (board is null)
        {
            throw new InvalidOperationException("Board was not found.");
        }

        if (!board.Memberships.Any(membership => membership.UserId == userId))
        {
            throw new InvalidOperationException("You do not have access to this board.");
        }

        return board;
    }

    private async System.Threading.Tasks.Task<PlanningPokerSession> GetActiveSessionForBoardAsync(int boardId, CancellationToken cancellationToken)
    {
        return await LoadSessionForDtoQuery()
            .Where(session => session.BoardId == boardId && session.Status == ActiveSessionStatus)
            .OrderByDescending(session => session.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("No active planning poker session exists for this board.");
    }

    private async System.Threading.Tasks.Task EnsureBoardMemberParticipantAsync(
        PlanningPokerSession session,
        Board board,
        int userId,
        CancellationToken cancellationToken)
    {
        PlanningPokerParticipant? participant = session.Participants.FirstOrDefault(item => item.UserId == userId);
        if (participant is not null)
        {
            participant.LastSeenAtUtc = DateTime.UtcNow;
            return;
        }

        User user = board.Memberships.Single(membership => membership.UserId == userId).User;
        session.Participants.Add(new PlanningPokerParticipant
        {
            SessionId = session.Id,
            UserId = userId,
            ParticipantToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant(),
            DisplayName = BuildDisplayName(user),
            IsHost = userId == session.HostUserId,
            IsGuest = false,
            LastSeenAtUtc = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async System.Threading.Tasks.Task<BoardTaskDto> LoadBoardTaskDtoAsync(Board board, int taskId, CancellationToken cancellationToken)
    {
        TaskEntity task = await _context.Tasks
            .Where(item => item.Id == taskId && item.BoardId == board.Id)
            .Include(item => item.Status)
            .Include(item => item.Assignee)
            .Include(item => item.LabeledTasks)
            .SingleAsync(cancellationToken);

        Dictionary<int, BoardMemberDto> memberLookup = board.Memberships.ToDictionary(
            membership => membership.UserId,
            ToBoardMemberDto);

        return ToTaskDto(task, memberLookup);
    }

    private async System.Threading.Tasks.Task<PlanningPokerSessionDto> LoadSessionDtoByIdAsync(int sessionId, CancellationToken cancellationToken)
    {
        PlanningPokerSession session = await LoadSessionForDtoQuery()
            .FirstAsync(item => item.Id == sessionId, cancellationToken);

        return ToSessionDto(session);
    }

    private IQueryable<PlanningPokerSession> LoadSessionForDtoQuery()
    {
        return _context.PlanningPokerSessions
            .Include(session => session.ActiveSessionTask)
            .ThenInclude(task => task!.Task)
            .Include(session => session.ActiveSessionTask)
            .ThenInclude(task => task!.Votes)
            .Include(session => session.Tasks)
            .ThenInclude(task => task.Task)
            .Include(session => session.Tasks)
            .ThenInclude(task => task.Votes)
            .Include(session => session.Participants)
            .AsSplitQuery();
    }

    private static PlanningPokerSessionDto ToSessionDto(PlanningPokerSession session)
    {
        PlanningPokerSessionTask? activeTask = session.ActiveSessionTask
            ?? session.Tasks
                .OrderBy(task => task.Position)
                .FirstOrDefault(task => task.RoundState.Equals(VotingRoundState, StringComparison.OrdinalIgnoreCase))
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
                .OrderByDescending(participant => participant.IsHost)
                .ThenBy(participant => participant.DisplayName)
                .Select(participant => new PlanningPokerParticipantDto
                {
                    ParticipantId = participant.Id,
                    DisplayName = participant.DisplayName,
                    IsHost = participant.IsHost,
                    IsGuest = participant.IsGuest,
                    HasVoted = votedParticipantIds.Contains(participant.Id),
                })
                .ToList(),
            IsRevealed = activeTask is not null && activeTask.RoundState.Equals(RevealedRoundState, StringComparison.OrdinalIgnoreCase),
        };
    }

    private static PlanningPokerSessionTaskDto ToSessionTaskDto(PlanningPokerSessionTask sessionTask)
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

    private static BoardMemberDto ToBoardMemberDto(BoardMembership membership)
    {
        return new BoardMemberDto
        {
            UserId = membership.UserId,
            Username = membership.User.Username,
            DisplayName = BuildDisplayName(membership.User),
            Email = membership.User.Email,
            Color = membership.Color,
            Role = membership.Role.ToString().ToLowerInvariant(),
        };
    }

    private static BoardTaskDto ToTaskDto(TaskEntity task, IReadOnlyDictionary<int, BoardMemberDto> memberLookup)
    {
        return new BoardTaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            StatusKey = task.Status.Title,
            IsQueued = task.IsQueued,
            LabelIds = task.LabeledTasks
                .Select(labeledTask => labeledTask.LabelId)
                .OrderBy(id => id)
                .ToList(),
            AssigneeUserId = task.AssigneeId,
            Assignee = task.AssigneeId.HasValue && memberLookup.TryGetValue(task.AssigneeId.Value, out BoardMemberDto? member)
                ? member
                : null,
            ReporterUserId = task.ReporterId,
            StoryPoints = task.StoryPoints,
            DueDate = task.DueDate?.ToString("yyyy-MM-dd"),
            Priority = task.Priority?.ToString().ToLowerInvariant(),
            TaskType = task.Type?.ToString().ToLowerInvariant(),
        };
    }

    private static string BuildDisplayName(User user)
    {
        string displayName = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(displayName) ? user.Username : displayName;
    }
}
