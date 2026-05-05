using BE.Data;
using BE.DTOs;
using BE.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Task = System.Threading.Tasks.Task;

namespace BE.Services;

public class UserMilestoneService(AppDbContext context) : IUserMilestoneService
{
    private const string TaskCompletedEventType = "task-completed";
    private const string BoardCreatedEventType = "board-created";
    private const string BoardMemberInvitedEventType = "board-member-invited";
    private const string CommentCreatedEventType = "comment-created";
    private const string PlanningPokerSessionCreatedEventType = "planning-poker-session-created";

    private readonly AppDbContext _context = context;

    private static readonly MilestoneDefinition[] Definitions =
    [
        new("first-task-completed", "First Task Completed", "Complete your first task.", "tasks", "check-circle-2", 1, 10, MilestoneProgressType.TaskCompletions),
        new("tasks-completed-10", "10 Tasks Completed", "Complete ten tasks.", "tasks", "check-check", 10, 20, MilestoneProgressType.TaskCompletions),
        new("tasks-completed-25", "25 Tasks Completed", "Complete twenty-five tasks.", "tasks", "list-checks", 25, 30, MilestoneProgressType.TaskCompletions),
        new("tasks-completed-50", "50 Tasks Completed", "Complete fifty tasks.", "tasks", "trophy", 50, 40, MilestoneProgressType.TaskCompletions),
        new("first-board-created", "First Board Created", "Create your first board.", "boards", "layout-dashboard", 1, 50, MilestoneProgressType.BoardsCreated),
        new("boards-created-5", "5 Boards Created", "Create five boards.", "boards", "folder-kanban", 5, 60, MilestoneProgressType.BoardsCreated),
        new("first-member-invited", "First Member Invited", "Invite your first teammate to a board.", "collaboration", "user-plus", 1, 70, MilestoneProgressType.BoardMembersInvited),
        new("members-invited-5", "5 Members Invited", "Invite five teammates to boards you own.", "collaboration", "users", 5, 80, MilestoneProgressType.BoardMembersInvited),
        new("first-comment-posted", "First Comment Posted", "Post your first task comment.", "collaboration", "message-square", 1, 90, MilestoneProgressType.CommentsAuthored),
        new("comments-posted-25", "25 Comments Posted", "Write twenty-five task comments.", "collaboration", "messages-square", 25, 100, MilestoneProgressType.CommentsAuthored),
        new("first-planning-poker-session-created", "First Planning Poker Session Created", "Start your first planning poker session.", "planningPoker", "cards", 1, 110, MilestoneProgressType.PlanningPokerSessionsCreated),
        new("planning-poker-sessions-created-5", "5 Planning Poker Sessions Created", "Start five planning poker sessions.", "planningPoker", "sparkles", 5, 120, MilestoneProgressType.PlanningPokerSessionsCreated),
    ];

    public async Task<UserMilestonesResponseDto> GetUserMilestonesAsync(int userId, CancellationToken cancellationToken)
    {
        Dictionary<string, int> progressCounts = await GetProgressCountsAsync(userId, cancellationToken);
        await EnsureUnlockedMilestonesAsync(userId, progressCounts, cancellationToken);

        if (HasPendingMilestones(userId))
        {
            await SaveChangesWithDuplicateRecoveryAsync(cancellationToken);
        }

        Dictionary<string, UserMilestone> unlocked = await GetUnlockedMilestonesAsync(userId, cancellationToken);
        List<UserMilestoneDto> milestones = new();

        foreach (MilestoneDefinition definition in GetVisibleDefinitions().OrderBy(item => item.SortOrder))
        {
            int currentValue = GetProgressValue(progressCounts, definition.ProgressType);
            bool isUnlocked = unlocked.TryGetValue(definition.Key, out UserMilestone? unlockedRecord);

            milestones.Add(new UserMilestoneDto
            {
                Key = definition.Key,
                Title = definition.Title,
                Description = definition.Description,
                Category = definition.Category,
                IconKey = definition.IconKey,
                TargetValue = definition.TargetValue,
                CurrentValue = Math.Min(currentValue, definition.TargetValue),
                IsUnlocked = isUnlocked,
                UnlockedAtUtc = unlockedRecord?.UnlockedAtUtc,
                SortOrder = definition.SortOrder,
            });
        }

        List<UserMilestoneDto> recentUnlocked = milestones
            .Where(item => item.IsUnlocked)
            .OrderByDescending(item => item.UnlockedAtUtc)
            .Take(2)
            .ToList();

        List<UserMilestoneDto> upcoming = milestones
            .Where(item => !item.IsUnlocked)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.SortOrder)
            .Take(2)
            .ToList();

        return new UserMilestonesResponseDto
        {
            Summary = new UserMilestoneSummaryDto
            {
                UnlockedCount = milestones.Count(item => item.IsUnlocked),
                TotalCount = milestones.Count,
                RecentUnlocked = recentUnlocked,
                Upcoming = upcoming,
            },
            Milestones = milestones,
        };
    }

    public async Task EnsureMilestonesUnlockedAsync(int userId, CancellationToken cancellationToken)
    {
        Dictionary<string, int> progressCounts = await GetProgressCountsAsync(userId, cancellationToken);
        await EnsureUnlockedMilestonesAsync(userId, progressCounts, cancellationToken);
    }

    public async Task<bool> TryRecoverFromDuplicateWriteAsync(DbUpdateException exception, CancellationToken cancellationToken)
    {
        bool normalizedEventDuplicates = NormalizeTrackedMilestoneEventDuplicates();
        bool normalizedMilestoneDuplicates = NormalizeTrackedUnlockedMilestoneDuplicates();

        List<EntityEntry<UserMilestoneEvent>> pendingEventEntries = _context.ChangeTracker
            .Entries<UserMilestoneEvent>()
            .Where(entry => entry.State == EntityState.Added)
            .ToList();

        List<EntityEntry<UserMilestone>> pendingMilestoneEntries = _context.ChangeTracker
            .Entries<UserMilestone>()
            .Where(entry => entry.State == EntityState.Added)
            .ToList();

        if (pendingEventEntries.Count == 0 && pendingMilestoneEntries.Count == 0)
        {
            return normalizedEventDuplicates || normalizedMilestoneDuplicates;
        }

        HashSet<string> eventTypes = pendingEventEntries
            .Select(entry => entry.Entity.EventType)
            .ToHashSet(StringComparer.Ordinal);

        List<(string EventType, string EventKey)> persistedEvents = eventTypes.Count == 0
            ? []
            : (await _context.UserMilestoneEvents
                .Where(item => eventTypes.Contains(item.EventType))
                .Select(item => new { item.EventType, item.EventKey })
                .ToListAsync(cancellationToken))
                .Select(item => (item.EventType, item.EventKey))
                .ToList();

        HashSet<string> persistedEventKeys = persistedEvents
            .Select(item => BuildEventIdentity(item.EventType, item.EventKey))
            .ToHashSet(StringComparer.Ordinal);

        HashSet<int> milestoneUserIds = pendingMilestoneEntries
            .Select(entry => entry.Entity.UserId)
            .ToHashSet();

        List<(int UserId, string MilestoneKey)> persistedMilestones = milestoneUserIds.Count == 0
            ? []
            : (await _context.UserMilestones
                .Where(item => milestoneUserIds.Contains(item.UserId))
                .Select(item => new { item.UserId, item.MilestoneKey })
                .ToListAsync(cancellationToken))
                .Select(item => (item.UserId, item.MilestoneKey))
                .ToList();

        HashSet<string> persistedMilestoneKeys = persistedMilestones
            .Select(item => BuildMilestoneIdentity(item.UserId, item.MilestoneKey))
            .ToHashSet(StringComparer.Ordinal);

        bool recoveredAny = normalizedEventDuplicates || normalizedMilestoneDuplicates;

        foreach (EntityEntry<UserMilestoneEvent> entry in pendingEventEntries)
        {
            string identity = BuildEventIdentity(entry.Entity.EventType, entry.Entity.EventKey);
            if (!persistedEventKeys.Contains(identity))
            {
                continue;
            }

            entry.State = EntityState.Detached;
            recoveredAny = true;
        }

        foreach (EntityEntry<UserMilestone> entry in pendingMilestoneEntries)
        {
            string identity = BuildMilestoneIdentity(entry.Entity.UserId, entry.Entity.MilestoneKey);
            if (!persistedMilestoneKeys.Contains(identity))
            {
                continue;
            }

            entry.State = EntityState.Detached;
            recoveredAny = true;
        }

        if (!recoveredAny)
        {
            return false;
        }

        _ = exception;
        return true;
    }

    public void StageTaskCompletion(int userId, int taskId, int completionCycle)
        => StageEvent(
            userId,
            TaskCompletedEventType,
            $"task-completed:{taskId}:{completionCycle}");

    public void StageBoardCreated(int userId, int boardId)
        => StageEvent(
            userId,
            BoardCreatedEventType,
            $"board-created:{boardId}");

    public void StageBoardMemberInvited(int userId, int boardId, int memberUserId)
        => StageEvent(
            userId,
            BoardMemberInvitedEventType,
            $"board-member-invited:{boardId}:{memberUserId}");

    public void StageCommentCreated(int userId, int commentId)
        => StageEvent(
            userId,
            CommentCreatedEventType,
            $"comment-created:{commentId}");

    public void StagePlanningPokerSessionCreated(int userId, int sessionId)
        => StageEvent(
            userId,
            PlanningPokerSessionCreatedEventType,
            $"planning-poker-session-created:{sessionId}");

    private async Task<Dictionary<string, UserMilestone>> GetUnlockedMilestonesAsync(int userId, CancellationToken cancellationToken)
    {
        Dictionary<string, UserMilestone> unlocked = await _context.UserMilestones
            .Where(item => item.UserId == userId)
            .ToDictionaryAsync(item => item.MilestoneKey, cancellationToken);

        foreach (UserMilestone trackedMilestone in GetTrackedUserMilestones(userId))
        {
            unlocked.TryAdd(trackedMilestone.MilestoneKey, trackedMilestone);
        }

        return unlocked;
    }

    private async Task<Dictionary<string, int>> GetProgressCountsAsync(int userId, CancellationToken cancellationToken)
    {
        List<UserMilestoneEvent> persistedEvents = await _context.UserMilestoneEvents
            .Where(item => item.UserId == userId)
            .Select(item => new UserMilestoneEvent
            {
                UserId = item.UserId,
                EventType = item.EventType,
                EventKey = item.EventKey,
            })
            .ToListAsync(cancellationToken);

        Dictionary<string, HashSet<string>> eventKeysByType = new(StringComparer.Ordinal);

        foreach (UserMilestoneEvent persistedEvent in persistedEvents)
        {
            GetOrCreateEventKeySet(eventKeysByType, persistedEvent.EventType).Add(persistedEvent.EventKey);
        }

        foreach (EntityEntry<UserMilestoneEvent> entry in _context.ChangeTracker.Entries<UserMilestoneEvent>())
        {
            UserMilestoneEvent milestoneEvent = entry.Entity;
            if (milestoneEvent.UserId != userId || entry.State == EntityState.Detached)
            {
                continue;
            }

            HashSet<string> keySet = GetOrCreateEventKeySet(eventKeysByType, milestoneEvent.EventType);
            if (entry.State == EntityState.Deleted)
            {
                keySet.Remove(milestoneEvent.EventKey);
                continue;
            }

            keySet.Add(milestoneEvent.EventKey);
        }

        return eventKeysByType.ToDictionary(item => item.Key, item => item.Value.Count, StringComparer.Ordinal);
    }

    private static IEnumerable<MilestoneDefinition> GetVisibleDefinitions()
    {
        return Definitions;
    }

    private static int GetProgressValue(IReadOnlyDictionary<string, int> progressCounts, MilestoneProgressType progressType)
    {
        string eventType = GetEventType(progressType);
        return progressCounts.GetValueOrDefault(eventType, 0);
    }

    private void StageEvent(
        int userId,
        string eventType,
        string eventKey)
    {
        NormalizeTrackedMilestoneEventDuplicates();

        if (HasTrackedMilestoneEvent(eventType, eventKey))
        {
            return;
        }

        _context.UserMilestoneEvents.Add(new UserMilestoneEvent
        {
            UserId = userId,
            EventType = eventType,
            EventKey = eventKey,
            CreatedAtUtc = DateTime.UtcNow,
        });
    }

    private async Task EnsureUnlockedMilestonesAsync(
        int userId,
        IReadOnlyDictionary<string, int> progressCounts,
        CancellationToken cancellationToken,
        MilestoneProgressType? progressType = null)
    {
        NormalizeTrackedUnlockedMilestoneDuplicates();

        HashSet<string> unlockedKeys = await _context.UserMilestones
            .Where(item => item.UserId == userId)
            .Select(item => item.MilestoneKey)
            .ToHashSetAsync(cancellationToken);

        foreach (UserMilestone trackedMilestone in GetTrackedUserMilestones(userId))
        {
            unlockedKeys.Add(trackedMilestone.MilestoneKey);
        }

        DateTime unlockedAtUtc = DateTime.UtcNow;

        IEnumerable<MilestoneDefinition> definitions = GetVisibleDefinitions()
            .Where(item => !progressType.HasValue || item.ProgressType == progressType.Value)
            .OrderBy(item => item.SortOrder);

        foreach (MilestoneDefinition definition in definitions)
        {
            int currentValue = GetProgressValue(progressCounts, definition.ProgressType);
            if (currentValue < definition.TargetValue || unlockedKeys.Contains(definition.Key))
            {
                continue;
            }

            UserMilestone milestone = new()
            {
                UserId = userId,
                MilestoneKey = definition.Key,
                ProgressValue = currentValue,
                UnlockedAtUtc = unlockedAtUtc,
            };

            _context.UserMilestones.Add(milestone);
            unlockedKeys.Add(definition.Key);
        }
    }

    private bool HasPendingMilestones(int userId)
    {
        return _context.ChangeTracker
            .Entries<UserMilestone>()
            .Any(entry => entry.State == EntityState.Added && entry.Entity.UserId == userId);
    }

    private async Task SaveChangesWithDuplicateRecoveryAsync(CancellationToken cancellationToken)
    {
        const int maxAttempts = 3;

        for (int attempt = 0; attempt < maxAttempts; attempt += 1)
        {
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                return;
            }
            catch (DbUpdateException exception) when (attempt < maxAttempts - 1)
            {
                bool recovered = await TryRecoverFromDuplicateWriteAsync(exception, cancellationToken);
                if (!recovered)
                {
                    throw;
                }
            }
        }
    }

    private bool NormalizeTrackedMilestoneEventDuplicates()
    {
        return DetachTrackedDuplicates(
            _context.ChangeTracker
                .Entries<UserMilestoneEvent>()
                .Where(entry => entry.State == EntityState.Added),
            entry => BuildEventIdentity(entry.Entity.EventType, entry.Entity.EventKey));
    }

    private bool NormalizeTrackedUnlockedMilestoneDuplicates()
    {
        return DetachTrackedDuplicates(
            _context.ChangeTracker
                .Entries<UserMilestone>()
                .Where(entry => entry.State == EntityState.Added),
            entry => BuildMilestoneIdentity(entry.Entity.UserId, entry.Entity.MilestoneKey));
    }

    private static bool DetachTrackedDuplicates<TEntity>(
        IEnumerable<EntityEntry<TEntity>> entries,
        Func<EntityEntry<TEntity>, string> keySelector)
        where TEntity : class
    {
        HashSet<string> seenKeys = new(StringComparer.Ordinal);
        bool detachedAny = false;

        foreach (EntityEntry<TEntity> entry in entries.ToList())
        {
            string key = keySelector(entry);
            if (seenKeys.Add(key))
            {
                continue;
            }

            entry.State = EntityState.Detached;
            detachedAny = true;
        }

        return detachedAny;
    }

    private bool HasTrackedMilestoneEvent(string eventType, string eventKey)
    {
        return _context.ChangeTracker
            .Entries<UserMilestoneEvent>()
            .Any(entry =>
                entry.State != EntityState.Deleted &&
                entry.State != EntityState.Detached &&
                entry.Entity.EventType == eventType &&
                entry.Entity.EventKey == eventKey);
    }

    private IEnumerable<UserMilestone> GetTrackedUserMilestones(int userId)
    {
        return _context.ChangeTracker
            .Entries<UserMilestone>()
            .Where(entry =>
                entry.Entity.UserId == userId &&
                entry.State != EntityState.Deleted &&
                entry.State != EntityState.Detached)
            .Select(entry => entry.Entity);
    }

    private static HashSet<string> GetOrCreateEventKeySet(
        IDictionary<string, HashSet<string>> eventKeysByType,
        string eventType)
    {
        if (!eventKeysByType.TryGetValue(eventType, out HashSet<string>? keySet))
        {
            keySet = new HashSet<string>(StringComparer.Ordinal);
            eventKeysByType[eventType] = keySet;
        }

        return keySet;
    }

    private static string BuildEventIdentity(string eventType, string eventKey)
    {
        return $"{eventType}\u001f{eventKey}";
    }

    private static string BuildMilestoneIdentity(int userId, string milestoneKey)
    {
        return $"{userId}\u001f{milestoneKey}";
    }

    private static string GetEventType(MilestoneProgressType progressType)
    {
        return progressType switch
        {
            MilestoneProgressType.TaskCompletions => TaskCompletedEventType,
            MilestoneProgressType.BoardsCreated => BoardCreatedEventType,
            MilestoneProgressType.BoardMembersInvited => BoardMemberInvitedEventType,
            MilestoneProgressType.CommentsAuthored => CommentCreatedEventType,
            MilestoneProgressType.PlanningPokerSessionsCreated => PlanningPokerSessionCreatedEventType,
            _ => throw new ArgumentOutOfRangeException(nameof(progressType), progressType, "Unsupported milestone progress type."),
        };
    }

    private enum MilestoneProgressType
    {
        TaskCompletions,
        BoardsCreated,
        BoardMembersInvited,
        CommentsAuthored,
        PlanningPokerSessionsCreated,
    }

    private sealed record MilestoneDefinition(
        string Key,
        string Title,
        string Description,
        string Category,
        string IconKey,
        int TargetValue,
        int SortOrder,
        MilestoneProgressType ProgressType);
}
