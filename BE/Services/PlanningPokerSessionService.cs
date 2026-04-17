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
    private const int MaxGuestDisplayNameLength = 80;

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
            throw new PlanningPokerValidationException("There is already an active planning poker session for this board.");
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
            throw new PlanningPokerValidationException("There are no unestimated backlog tasks for planning poker.");
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

        session.ActiveSessionTaskId = session.Tasks
            .OrderBy(task => task.Position)
            .Select(task => (int?)task.Id)
            .FirstOrDefault();
        await _context.SaveChangesAsync(cancellationToken);

        return await LoadSessionDtoByIdAsync(session.Id, hostUserId, null, cancellationToken);
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> GetBoardSessionAsync(int boardId, int userId, CancellationToken cancellationToken)
    {
        Board board = await GetBoardWithMembershipsAsync(boardId, userId, cancellationToken);
        PlanningPokerSession session = await GetActiveSessionForBoardAsync(boardId, cancellationToken);

        await EnsureBoardMemberParticipantAsync(session, board, userId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await LoadSessionDtoByIdAsync(session.Id, userId, null, cancellationToken);
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> GetSessionByTokenAsync(
        string joinToken,
        int? userId,
        string? participantToken,
        CancellationToken cancellationToken)
    {
        string normalizedParticipantToken = participantToken?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!userId.HasValue && string.IsNullOrWhiteSpace(normalizedParticipantToken))
        {
            throw new PlanningPokerValidationException("A user id or participant token is required to access a planning poker session.");
        }

        PlanningPokerSession session = await GetSessionByJoinTokenAsync(joinToken, cancellationToken);

        await ResolveParticipantAsync(
            session,
            userId,
            participantToken,
            guestDisplayName: null,
            allowGuestCreation: false,
            cancellationToken);

        return ToSessionDto(session, GetCurrentParticipant(session, userId, normalizedParticipantToken));
    }

    public async System.Threading.Tasks.Task<PlanningPokerJoinResult> JoinSessionAsync(
        string joinToken,
        int? userId,
        string? participantToken,
        string? guestDisplayName,
        CancellationToken cancellationToken)
    {
        PlanningPokerSession session = await GetSessionByJoinTokenAsync(joinToken, cancellationToken);
        PlanningPokerParticipant participant = await ResolveParticipantAsync(
            session,
            userId,
            participantToken,
            guestDisplayName,
            allowGuestCreation: true,
            cancellationToken);

        return new PlanningPokerJoinResult(ToSessionDto(session, participant), participant.ParticipantToken);
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> SubmitVoteAsync(
        string joinToken,
        int? userId,
        string? participantToken,
        int cardValue,
        CancellationToken cancellationToken)
    {
        if (cardValue < 0)
        {
            throw new PlanningPokerValidationException("Vote value must be zero or greater.");
        }

        PlanningPokerSession session = await GetSessionByJoinTokenAsync(joinToken, cancellationToken);
        PlanningPokerParticipant participant = await ResolveParticipantAsync(
            session,
            userId,
            participantToken,
            guestDisplayName: null,
            allowGuestCreation: false,
            cancellationToken);
        PlanningPokerSessionTask activeTask = GetActiveVotingTask(session);
        EnsureTaskIsStillEligibleForVoting(activeTask);

        PlanningPokerVote? existingVote = activeTask.Votes.FirstOrDefault(vote => vote.ParticipantId == participant.Id);
        if (existingVote is null)
        {
            activeTask.Votes.Add(new PlanningPokerVote
            {
                ParticipantId = participant.Id,
                CardValue = cardValue,
                SubmittedAtUtc = DateTime.UtcNow,
            });
        }
        else
        {
            existingVote.CardValue = cardValue;
            existingVote.SubmittedAtUtc = DateTime.UtcNow;
        }

        session.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return ToSessionDto(session, participant);
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> RevealVotesAsync(
        string joinToken,
        int? userId,
        string? participantToken,
        CancellationToken cancellationToken)
    {
        PlanningPokerSession session = await GetSessionByJoinTokenAsync(joinToken, cancellationToken);
        PlanningPokerParticipant participant = await ResolveParticipantAsync(
            session,
            userId,
            participantToken,
            guestDisplayName: null,
            allowGuestCreation: false,
            cancellationToken);
        EnsureParticipantIsHost(session, participant);
        PlanningPokerSessionTask activeTask = GetActiveVotingTask(session);
        EnsureTaskIsStillEligibleForVoting(activeTask);
        if (activeTask.Votes.Count == 0)
        {
            throw new PlanningPokerValidationException("At least one vote is required before revealing.");
        }

        activeTask.RoundState = RevealedRoundState;
        session.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return ToSessionDto(session, participant);
    }

    public async System.Threading.Tasks.Task<PlanningPokerSessionDto> SelectRecommendationAsync(
        string joinToken,
        int? userId,
        string? participantToken,
        int storyPoints,
        CancellationToken cancellationToken)
    {
        if (storyPoints < 0)
        {
            throw new PlanningPokerValidationException("Recommended story points must be zero or greater.");
        }

        PlanningPokerSession session = await GetSessionByJoinTokenAsync(joinToken, cancellationToken);
        PlanningPokerParticipant participant = await ResolveParticipantAsync(
            session,
            userId,
            participantToken,
            guestDisplayName: null,
            allowGuestCreation: false,
            cancellationToken);
        EnsureParticipantIsHost(session, participant);

        PlanningPokerSessionTask activeTask = session.ActiveSessionTask
            ?? session.Tasks
                .OrderBy(task => task.Position)
                .FirstOrDefault(task => task.RoundState.Equals(RevealedRoundState, StringComparison.OrdinalIgnoreCase))
            ?? throw new PlanningPokerValidationException("There is no active planning poker task.");

        if (!activeTask.RoundState.Equals(RevealedRoundState, StringComparison.OrdinalIgnoreCase))
        {
            throw new PlanningPokerValidationException("Reveal votes before choosing a recommendation.");
        }

        EnsureTaskIsStillEligibleForVoting(activeTask);
        activeTask.RecommendedStoryPoints = storyPoints;
        session.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return ToSessionDto(session, participant);
    }

    public async System.Threading.Tasks.Task<PlanningPokerDeletedSessionResult> DeleteBoardSessionAsync(
        int boardId,
        int userId,
        CancellationToken cancellationToken)
    {
        Board board = await GetBoardWithMembershipsAsync(boardId, userId, cancellationToken);
        PlanningPokerSession session = await GetActiveSessionForBoardAsync(boardId, cancellationToken);

        PlanningPokerParticipant participant = session.Participants
            .FirstOrDefault(item => item.UserId == userId)
            ?? throw new PlanningPokerAccessDeniedException("You must join the planning poker session before deleting it.");

        EnsureParticipantIsHost(session, participant);

        PlanningPokerDeletedSessionResult result = new(session.Id, session.BoardId, session.JoinToken);
        session.ActiveSessionTaskId = null;
        session.ActiveSessionTask = null;
        await _context.SaveChangesAsync(cancellationToken);
        _context.PlanningPokerSessions.Remove(session);
        await _context.SaveChangesAsync(cancellationToken);

        return result;
    }

    public async System.Threading.Tasks.Task<PlanningPokerDeletedSessionResult> DeleteSessionAsync(
        string joinToken,
        int? userId,
        string? participantToken,
        CancellationToken cancellationToken)
    {
        PlanningPokerSession session = await GetSessionByJoinTokenAsync(joinToken, cancellationToken);
        PlanningPokerParticipant participant = await ResolveParticipantAsync(
            session,
            userId,
            participantToken,
            guestDisplayName: null,
            allowGuestCreation: false,
            cancellationToken);
        EnsureParticipantIsHost(session, participant);

        PlanningPokerDeletedSessionResult result = new(session.Id, session.BoardId, session.JoinToken);
        session.ActiveSessionTaskId = null;
        session.ActiveSessionTask = null;
        await _context.SaveChangesAsync(cancellationToken);
        _context.PlanningPokerSessions.Remove(session);
        await _context.SaveChangesAsync(cancellationToken);

        return result;
    }

    public async System.Threading.Tasks.Task<BoardTaskDto> ApplyRecommendationAsync(int boardId, int sessionTaskId, int userId, CancellationToken cancellationToken)
    {
        Board board = await GetBoardWithMembershipsAsync(boardId, userId, cancellationToken);
        PlanningPokerSessionTask? sessionTask = await _context.PlanningPokerSessionTasks
            .Include(item => item.Task)
            .Include(item => item.Session)
            .ThenInclude(session => session.Participants)
            .FirstOrDefaultAsync(item => item.Id == sessionTaskId, cancellationToken);

        if (sessionTask is null)
        {
            throw new PlanningPokerNotFoundException("Planning poker session task was not found.");
        }

        if (sessionTask.Session.BoardId != boardId ||
            sessionTask.Session.Status != ActiveSessionStatus ||
            sessionTask.Session.ActiveSessionTaskId != sessionTask.Id)
        {
            throw new PlanningPokerValidationException("There is no recommendation to apply.");
        }

        if (sessionTask.RecommendedStoryPoints is null)
        {
            throw new PlanningPokerValidationException("There is no recommendation to apply.");
        }

        if (!sessionTask.Session.Participants.Any(participant => participant.UserId == userId))
        {
            throw new PlanningPokerAccessDeniedException("You must be part of the planning poker session to apply a recommendation.");
        }

        sessionTask.Task.StoryPoints = sessionTask.RecommendedStoryPoints;
        sessionTask.Session.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await LoadBoardTaskDtoAsync(board, sessionTask.TaskId, cancellationToken);
    }

    private async System.Threading.Tasks.Task<PlanningPokerSession> GetSessionByJoinTokenAsync(string joinToken, CancellationToken cancellationToken)
    {
        string token = joinToken.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new PlanningPokerValidationException("Join token is required.");
        }

        PlanningPokerSession session = await LoadSessionForDtoQuery()
            .FirstOrDefaultAsync(candidate => candidate.JoinToken == token, cancellationToken)
            ?? throw new PlanningPokerNotFoundException("Planning poker session was not found.");

        if (!string.Equals(session.Status, ActiveSessionStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new PlanningPokerValidationException("Planning poker session is no longer active.");
        }

        return session;
    }

    private async System.Threading.Tasks.Task<Board> GetBoardWithMembershipsAsync(int boardId, int userId, CancellationToken cancellationToken)
    {
        Board? board = await _context.Boards
            .Include(board => board.Memberships)
            .ThenInclude(membership => membership.User)
            .FirstOrDefaultAsync(board => board.Id == boardId, cancellationToken);

        if (board is null)
        {
            throw new PlanningPokerNotFoundException("Board was not found.");
        }

        if (!board.Memberships.Any(membership => membership.UserId == userId))
        {
            throw new PlanningPokerAccessDeniedException("You do not have access to this board.");
        }

        return board;
    }

    private async System.Threading.Tasks.Task<PlanningPokerSession> GetActiveSessionForBoardAsync(int boardId, CancellationToken cancellationToken)
    {
        return await LoadSessionForDtoQuery()
            .Where(session => session.BoardId == boardId && session.Status == ActiveSessionStatus)
            .OrderByDescending(session => session.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new PlanningPokerNotFoundException("No active planning poker session exists for this board.");
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

    private async System.Threading.Tasks.Task<PlanningPokerParticipant> ResolveParticipantAsync(
        PlanningPokerSession session,
        int? userId,
        string? participantToken,
        string? guestDisplayName,
        bool allowGuestCreation,
        CancellationToken cancellationToken)
    {
        string normalizedParticipantToken = participantToken?.Trim().ToLowerInvariant() ?? string.Empty;
        PlanningPokerParticipant? tokenParticipant = null;

        if (!string.IsNullOrWhiteSpace(normalizedParticipantToken))
        {
            tokenParticipant = session.Participants.FirstOrDefault(item => item.ParticipantToken == normalizedParticipantToken);
            if (tokenParticipant is null)
            {
                throw new PlanningPokerAccessDeniedException("The session token does not match a known participant.");
            }
        }

        if (userId.HasValue)
        {
            Board board = await GetBoardWithMembershipsAsync(session.BoardId, userId.Value, cancellationToken);
            await EnsureBoardMemberParticipantAsync(session, board, userId.Value, cancellationToken);
            PlanningPokerParticipant participant = session.Participants.First(item => item.UserId == userId.Value);

            if (tokenParticipant is not null && tokenParticipant.UserId != userId.Value)
            {
                throw new PlanningPokerAccessDeniedException("Authenticated users cannot act as a different planning poker participant.");
            }

            participant.LastSeenAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            return participant;
        }

        if (tokenParticipant is not null)
        {
            tokenParticipant.LastSeenAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            return tokenParticipant;
        }

        if (!allowGuestCreation)
        {
            throw new PlanningPokerAccessDeniedException("You must join the planning poker session before voting.");
        }

        string displayName = NormalizeGuestDisplayName(guestDisplayName);
        var guestParticipant = new PlanningPokerParticipant
        {
            SessionId = session.Id,
            ParticipantToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant(),
            DisplayName = displayName,
            IsHost = false,
            IsGuest = true,
            LastSeenAtUtc = DateTime.UtcNow,
        };
        session.Participants.Add(guestParticipant);
        await _context.SaveChangesAsync(cancellationToken);

        return guestParticipant;
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

    private async System.Threading.Tasks.Task<PlanningPokerSessionDto> LoadSessionDtoByIdAsync(
        int sessionId,
        int? currentUserId,
        string? participantToken,
        CancellationToken cancellationToken)
    {
        PlanningPokerSession session = await LoadSessionForDtoQuery()
            .FirstAsync(item => item.Id == sessionId, cancellationToken);

        return ToSessionDto(session, GetCurrentParticipant(session, currentUserId, participantToken));
    }

    private static PlanningPokerSessionTask GetActiveVotingTask(PlanningPokerSession session)
    {
        PlanningPokerSessionTask? activeTask = session.ActiveSessionTask
            ?? session.Tasks
                .OrderBy(task => task.Position)
                .FirstOrDefault(task => task.RoundState.Equals(VotingRoundState, StringComparison.OrdinalIgnoreCase));

        if (activeTask is null)
        {
            throw new PlanningPokerValidationException("There is no active planning poker task.");
        }

        if (!activeTask.RoundState.Equals(VotingRoundState, StringComparison.OrdinalIgnoreCase))
        {
            throw new PlanningPokerValidationException("Votes for the active task have already been revealed.");
        }

        return activeTask;
    }

    private static void EnsureParticipantIsHost(PlanningPokerSession session, PlanningPokerParticipant participant)
    {
        if (!participant.IsHost || participant.IsGuest || participant.UserId != session.HostUserId)
        {
            throw new PlanningPokerAccessDeniedException("Only the host can reveal votes.");
        }
    }

    private static void EnsureTaskIsStillEligibleForVoting(PlanningPokerSessionTask sessionTask)
    {
        if (sessionTask.Task.StoryPoints.HasValue)
        {
            throw new PlanningPokerValidationException(
                "The active task has already been estimated. Refresh the room to continue.");
        }
    }

    private static string NormalizeGuestDisplayName(string? guestDisplayName)
    {
        string displayName = guestDisplayName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new PlanningPokerValidationException("Guest display name is required.");
        }

        if (displayName.Length > MaxGuestDisplayNameLength)
        {
            throw new PlanningPokerValidationException($"Guest display name can be up to {MaxGuestDisplayNameLength} characters.");
        }

        return displayName;
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

    private static PlanningPokerParticipant? GetCurrentParticipant(
        PlanningPokerSession session,
        int? userId,
        string? participantToken)
    {
        if (userId.HasValue)
        {
            return session.Participants.FirstOrDefault(item => item.UserId == userId.Value);
        }

        string normalizedParticipantToken = participantToken?.Trim().ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedParticipantToken))
        {
            return null;
        }

        return session.Participants.FirstOrDefault(item => item.ParticipantToken == normalizedParticipantToken);
    }

    private static PlanningPokerSessionDto ToSessionDto(
        PlanningPokerSession session,
        PlanningPokerParticipant? currentParticipant)
    {
        PlanningPokerSessionTask? activeTask = session.ActiveSessionTask
            ?? session.Tasks
                .OrderBy(task => task.Position)
                .FirstOrDefault(task => task.RoundState.Equals(VotingRoundState, StringComparison.OrdinalIgnoreCase))
            ?? session.Tasks.OrderBy(task => task.Position).FirstOrDefault();

        HashSet<int> votedParticipantIds = activeTask?.Votes
            .Select(vote => vote.ParticipantId)
            .ToHashSet() ?? new HashSet<int>();
        Dictionary<int, int> revealedVoteLookup = activeTask is not null &&
            activeTask.RoundState.Equals(RevealedRoundState, StringComparison.OrdinalIgnoreCase)
                ? activeTask.Votes.ToDictionary(vote => vote.ParticipantId, vote => vote.CardValue)
                : new Dictionary<int, int>();

        return new PlanningPokerSessionDto
        {
            SessionId = session.Id,
            BoardId = session.BoardId,
            JoinToken = session.JoinToken,
            JoinUrl = $"/planning-poker/{session.JoinToken}",
            Status = session.Status,
            IsCurrentUserHost = currentParticipant is not null && currentParticipant.IsHost,
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
                    RevealedCardValue = revealedVoteLookup.TryGetValue(participant.Id, out int cardValue)
                        ? cardValue
                        : null,
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
