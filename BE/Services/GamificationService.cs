using System.Text.Json;
using BE.Data;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using BoardEntity = BE.Models.Board;
using BoardRoleModel = BE.Models.BoardRole;
using PriorityLevel = BE.Models.Priority;
using TaskEntity = BE.Models.Task;
using UserMilestoneEventModel = BE.Models.UserMilestoneEvent;
using UserEntity = BE.Models.User;
using XpEventModel = BE.Models.XpEvent;

namespace BE.Services;

public class GamificationService(
    AppDbContext context,
    IUserMilestoneService userMilestoneService) : IGamificationService
{
    private const int MaxLevel = 150;

    private static readonly int[] InitialLevelThresholds =
    [
        0,
        20,
        60,
        130,
        240,
        400,
        620,
        910,
        1280,
        1740,
        2300,
        2970,
        3760,
        4680,
        5740,
    ];

    private static readonly string[] LevelBandNames =
    [
        "Slate",
        "Ember",
        "Cinder",
        "Amber",
        "Lime",
        "Jade",
        "Tide",
        "Sky",
        "Azure",
        "Indigo",
        "Violet",
        "Orchid",
        "Fuchsia",
        "Rose",
        "Solar",
    ];

    private static readonly string[] CompletionEventTypes =
    [
        XpEventTypes.TaskCompleted,
        XpEventTypes.TaskCompletedEarly,
        XpEventTypes.TaskCompletedPriorityHigh,
        XpEventTypes.TaskCompletedPriorityCritical,
    ];

    private const string TaskCompletedMilestoneEventType = "task-completed";

    private readonly AppDbContext _context = context;
    private readonly IUserMilestoneService _userMilestoneService = userMilestoneService;

    public async Task<UserGamificationSummaryDto> GetUserGamificationSummaryAsync(int userId, CancellationToken cancellationToken)
    {
        DateTime utcNow = DateTime.UtcNow;
        DateTime startOfWeekUtc = GetStartOfUtcWeek(utcNow);
        DateTime startOfMonthUtc = new(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var userEvents = _context.XpEvents.Where(xpEvent => xpEvent.UserId == userId);

        int lifetimeXp = await userEvents
            .Select(xpEvent => (int?)xpEvent.XpAmount)
            .SumAsync(cancellationToken) ?? 0;

        int weeklyXp = await userEvents
            .Where(xpEvent => xpEvent.CreatedAtUtc >= startOfWeekUtc)
            .Select(xpEvent => (int?)xpEvent.XpAmount)
            .SumAsync(cancellationToken) ?? 0;

        int monthlyXp = await userEvents
            .Where(xpEvent => xpEvent.CreatedAtUtc >= startOfMonthUtc)
            .Select(xpEvent => (int?)xpEvent.XpAmount)
            .SumAsync(cancellationToken) ?? 0;

        int tasksCompleted = await userEvents
            .CountAsync(
                xpEvent => xpEvent.Type == XpEventTypes.TaskCompleted && xpEvent.XpAmount > 0,
                cancellationToken);

        ProgressMetrics progress = GetProgressMetrics(lifetimeXp);

        return new UserGamificationSummaryDto
        {
            LifetimeXp = lifetimeXp,
            CurrentLevel = progress.Level,
            CurrentLevelName = progress.LevelName,
            CurrentLevelXp = progress.CurrentLevelXp,
            XpForNextLevel = progress.XpForNextLevel,
            XpRemainingForNextLevel = progress.XpRemainingForNextLevel,
            ProgressPercent = progress.ProgressPercent,
            WeeklyXp = weeklyXp,
            MonthlyXp = monthlyXp,
            TasksCompleted = tasksCompleted,
            Prestige = 0,
        };
    }

    public async Task<UserProgressDto> GetUserProgressAsync(int userId, CancellationToken cancellationToken)
    {
        UserGamificationSummaryDto summary = await GetUserGamificationSummaryAsync(userId, cancellationToken);
        return new UserProgressDto
        {
            Xp = summary.LifetimeXp,
            Level = summary.CurrentLevel,
            TasksCompleted = summary.TasksCompleted,
        };
    }

    public async Task<BoardLevelLeaderboardDto> GetBoardLevelLeaderboardAsync(
        BoardEntity board,
        int currentUserId,
        CancellationToken cancellationToken)
    {
        DateTime utcNow = DateTime.UtcNow;
        DateTime startOfDayUtc = utcNow.AddHours(-24);
        DateTime startOfWeekUtc = GetStartOfUtcWeek(utcNow);
        DateTime startOfMonthUtc = new(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime startOfYearUtc = new(utcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        List<int> memberIds = board.Memberships
            .Select(membership => membership.UserId)
            .Distinct()
            .ToList();

        var xpRows = await _context.XpEvents
            .Where(xpEvent => xpEvent.BoardId == board.Id && memberIds.Contains(xpEvent.UserId))
            .GroupBy(xpEvent => xpEvent.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                LifetimeXp = group.Sum(xpEvent => xpEvent.XpAmount),
                DayXp = group
                    .Where(xpEvent => xpEvent.CreatedAtUtc >= startOfDayUtc)
                    .Sum(xpEvent => xpEvent.XpAmount),
                WeekXp = group
                    .Where(xpEvent => xpEvent.CreatedAtUtc >= startOfWeekUtc)
                    .Sum(xpEvent => xpEvent.XpAmount),
                MonthXp = group
                    .Where(xpEvent => xpEvent.CreatedAtUtc >= startOfMonthUtc)
                    .Sum(xpEvent => xpEvent.XpAmount),
                YearXp = group
                    .Where(xpEvent => xpEvent.CreatedAtUtc >= startOfYearUtc)
                    .Sum(xpEvent => xpEvent.XpAmount),
            })
            .ToListAsync(cancellationToken);

        var xpByUserId = xpRows.ToDictionary(row => row.UserId);

        return new BoardLevelLeaderboardDto
        {
            Id = board.Id,
            Name = board.Title,
            Description = board.Description,
            LogoIconKey = board.LogoIconKey,
            LogoColorKey = board.LogoColorKey,
            CurrentUserId = currentUserId,
            Members = board.Memberships
                .OrderBy(membership => membership.Role == BoardRoleModel.Owner ? 0 : 1)
                .ThenBy(membership => membership.User.FirstName)
                .ThenBy(membership => membership.User.LastName)
                .Select(membership =>
                {
                    bool hasXp = xpByUserId.TryGetValue(membership.UserId, out var row);
                    int lifetimeXp = hasXp ? row!.LifetimeXp : 0;

                    return new BoardLevelLeaderboardMemberDto
                    {
                        UserId = membership.UserId,
                        Username = membership.User.Username,
                        DisplayName = GetDisplayName(membership.User),
                        Level = GetProgressMetrics(lifetimeXp).Level,
                        XpByPeriod = new BoardLevelLeaderboardPeriodsDto
                        {
                            Day = hasXp ? row!.DayXp : 0,
                            Week = hasXp ? row!.WeekXp : 0,
                            Month = hasXp ? row!.MonthXp : 0,
                            Year = hasXp ? row!.YearXp : 0,
                        },
                    };
                })
                .ToList(),
        };
    }

    public async Task<Dictionary<int, int>> GetUserLevelsAsync(
        IEnumerable<int> userIds,
        CancellationToken cancellationToken)
    {
        List<int> distinctUserIds = userIds
            .Where(userId => userId > 0)
            .Distinct()
            .ToList();

        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<int, int>();
        }

        var userXpTotals = await _context.XpEvents
            .Where(xpEvent => distinctUserIds.Contains(xpEvent.UserId))
            .GroupBy(xpEvent => xpEvent.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                LifetimeXp = group.Sum(xpEvent => xpEvent.XpAmount),
            })
            .ToListAsync(cancellationToken);

        Dictionary<int, int> levels = distinctUserIds.ToDictionary(userId => userId, _ => 1);
        foreach (var userXp in userXpTotals)
        {
            levels[userXp.UserId] = GetProgressMetrics(userXp.LifetimeXp).Level;
        }

        return levels;
    }

    public async Task ApplyTaskTransitionXpAsync(
        TaskEntity task,
        string previousStatusKey,
        string nextStatusKey,
        CancellationToken cancellationToken)
    {
        bool wasDone = IsDoneStatus(previousStatusKey);
        bool isDone = IsDoneStatus(nextStatusKey);

        if (!wasDone && isDone)
        {
            await AwardCompletionEventsAsync(task, cancellationToken);
            return;
        }

        if (wasDone && !isDone)
        {
            await ReverseLatestCompletionCycleAsync(task, cancellationToken);
        }
    }

    private async Task AwardCompletionEventsAsync(TaskEntity task, CancellationToken cancellationToken)
    {
        if (!task.AssigneeId.HasValue)
        {
            return;
        }

        DateTime completedAtUtc = DateTime.UtcNow;
        int cycle = await GetNextCompletionCycleAsync(task.Id, cancellationToken);
        int assigneeUserId = task.AssigneeId.Value;

        if (task.StoryPoints.HasValue)
        {
            AddXpEvent(
                task,
                assigneeUserId,
                XpEventTypes.TaskCompleted,
                task.StoryPoints.Value * 10,
                $"task-complete:{task.Id}:{assigneeUserId}:{cycle}",
                completedAtUtc);
        }

        if (task.DueDate.HasValue && completedAtUtc.Date <= task.DueDate.Value.Date)
        {
            AddXpEvent(
                task,
                assigneeUserId,
                XpEventTypes.TaskCompletedEarly,
                10,
                $"task-complete-early:{task.Id}:{assigneeUserId}:{cycle}",
                completedAtUtc);
        }

        if (task.Priority == PriorityLevel.High)
        {
            AddXpEvent(
                task,
                assigneeUserId,
                XpEventTypes.TaskCompletedPriorityHigh,
                10,
                $"task-complete-priority-high:{task.Id}:{assigneeUserId}:{cycle}",
                completedAtUtc);
        }
        else if (task.Priority == PriorityLevel.Critical)
        {
            AddXpEvent(
                task,
                assigneeUserId,
                XpEventTypes.TaskCompletedPriorityCritical,
                20,
                $"task-complete-priority-critical:{task.Id}:{assigneeUserId}:{cycle}",
                completedAtUtc);
        }

        _userMilestoneService.StageTaskCompletion(assigneeUserId, task.Id, cycle);
        await _userMilestoneService.EnsureMilestonesUnlockedAsync(assigneeUserId, cancellationToken);
    }

    private async Task ReverseLatestCompletionCycleAsync(TaskEntity task, CancellationToken cancellationToken)
    {
        List<XpEventModel> positiveCompletionEvents = await _context.XpEvents
            .Where(xpEvent =>
                xpEvent.TaskId == task.Id &&
                xpEvent.XpAmount > 0 &&
                CompletionEventTypes.Contains(xpEvent.Type))
            .OrderByDescending(xpEvent => xpEvent.CreatedAtUtc)
            .ThenByDescending(xpEvent => xpEvent.Id)
            .ToListAsync(cancellationToken);

        if (positiveCompletionEvents.Count == 0)
        {
            return;
        }

        HashSet<int> reversedEventIds = await _context.XpEvents
            .Where(xpEvent => xpEvent.ReversesXpEventId.HasValue)
            .Select(xpEvent => xpEvent.ReversesXpEventId!.Value)
            .ToHashSetAsync(cancellationToken);

        List<XpEventModel> unreversedEvents = positiveCompletionEvents
            .Where(xpEvent => !reversedEventIds.Contains(xpEvent.Id))
            .ToList();

        if (unreversedEvents.Count == 0)
        {
            return;
        }

        int latestCycle = unreversedEvents
            .Select(GetCompletionCycle)
            .DefaultIfEmpty(0)
            .Max();

        if (latestCycle <= 0)
        {
            return;
        }

        DateTime reversedAtUtc = DateTime.UtcNow;
        foreach (XpEventModel originalEvent in unreversedEvents.Where(xpEvent => GetCompletionCycle(xpEvent) == latestCycle))
        {
            _context.XpEvents.Add(new XpEventModel
            {
                UserId = originalEvent.UserId,
                BoardId = originalEvent.BoardId,
                TaskId = originalEvent.TaskId,
                Type = XpEventTypes.TaskCompletionReversed,
                XpAmount = -originalEvent.XpAmount,
                AwardKey = $"xp-reversal:{originalEvent.Id}",
                ReversesXpEventId = originalEvent.Id,
                SourceSnapshotJson = originalEvent.SourceSnapshotJson,
                CreatedAtUtc = reversedAtUtc,
            });
        }
    }

    private void AddXpEvent(
        TaskEntity task,
        int userId,
        string eventType,
        int xpAmount,
        string awardKey,
        DateTime createdAtUtc)
    {
        string snapshotJson = JsonSerializer.Serialize(new TaskCompletionXpSnapshot
        {
            Status = "done",
            StoryPoints = task.StoryPoints,
            Priority = task.Priority?.ToString().ToLowerInvariant(),
            DueDate = task.DueDate?.ToString("yyyy-MM-dd"),
            CompletedAtUtc = createdAtUtc,
            AssigneeUserId = userId,
        });

        _context.XpEvents.Add(new XpEventModel
        {
            UserId = userId,
            BoardId = task.BoardId,
            TaskId = task.Id,
            Type = eventType,
            XpAmount = xpAmount,
            AwardKey = awardKey,
            SourceSnapshotJson = snapshotJson,
            CreatedAtUtc = createdAtUtc,
        });
    }

    private async Task<int> GetNextCompletionCycleAsync(int taskId, CancellationToken cancellationToken)
    {
        List<string> persistedAwardKeys = await _context.XpEvents
            .Where(xpEvent =>
                xpEvent.TaskId == taskId &&
                xpEvent.XpAmount > 0 &&
                CompletionEventTypes.Contains(xpEvent.Type))
            .Select(xpEvent => xpEvent.AwardKey)
            .ToListAsync(cancellationToken);

        string milestoneEventKeyPrefix = BuildTaskCompletedMilestoneEventKeyPrefix(taskId);
        List<string> persistedMilestoneEventKeys = await _context.UserMilestoneEvents
            .Where(milestoneEvent =>
                milestoneEvent.EventType == TaskCompletedMilestoneEventType &&
                milestoneEvent.EventKey.StartsWith(milestoneEventKeyPrefix))
            .Select(milestoneEvent => milestoneEvent.EventKey)
            .ToListAsync(cancellationToken);

        IEnumerable<string> trackedAwardKeys = _context.ChangeTracker
            .Entries<XpEventModel>()
            .Where(entry =>
                entry.State != EntityState.Deleted &&
                entry.Entity.TaskId == taskId &&
                entry.Entity.XpAmount > 0 &&
                CompletionEventTypes.Contains(entry.Entity.Type))
            .Select(entry => entry.Entity.AwardKey);

        IEnumerable<string> trackedMilestoneEventKeys = _context.ChangeTracker
            .Entries<UserMilestoneEventModel>()
            .Where(entry =>
                entry.State != EntityState.Deleted &&
                entry.Entity.EventType == TaskCompletedMilestoneEventType &&
                entry.Entity.EventKey.StartsWith(milestoneEventKeyPrefix, StringComparison.Ordinal))
            .Select(entry => entry.Entity.EventKey);

        int currentMaxCycle = persistedAwardKeys
            .Concat(persistedMilestoneEventKeys)
            .Concat(trackedAwardKeys)
            .Concat(trackedMilestoneEventKeys)
            .Distinct(StringComparer.Ordinal)
            .Select(GetCompletionCycle)
            .DefaultIfEmpty(0)
            .Max();

        return currentMaxCycle + 1;
    }

    private static string BuildTaskCompletedMilestoneEventKeyPrefix(int taskId)
    {
        return $"{TaskCompletedMilestoneEventType}:{taskId}:";
    }

    private static int GetCompletionCycle(string awardKey)
    {
        if (string.IsNullOrWhiteSpace(awardKey))
        {
            return 0;
        }

        int separatorIndex = awardKey.LastIndexOf(':');
        if (separatorIndex < 0 || separatorIndex == awardKey.Length - 1)
        {
            return 0;
        }

        return int.TryParse(awardKey[(separatorIndex + 1)..], out int cycle) ? cycle : 0;
    }

    private static int GetCompletionCycle(XpEventModel xpEvent) => GetCompletionCycle(xpEvent.AwardKey);

    private static bool IsDoneStatus(string statusKey)
    {
        return string.Equals(statusKey, "done", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetDisplayName(UserEntity user)
    {
        string displayName = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(displayName) ? user.Username : displayName;
    }

    private static DateTime GetStartOfUtcWeek(DateTime utcNow)
    {
        int daysSinceMonday = ((int)utcNow.DayOfWeek + 6) % 7;
        DateTime utcDate = utcNow.Date;
        return DateTime.SpecifyKind(utcDate.AddDays(-daysSinceMonday), DateTimeKind.Utc);
    }

    private static ProgressMetrics GetProgressMetrics(int lifetimeXp)
    {
        int normalizedLifetimeXp = Math.Max(lifetimeXp, 0);
        int level = 1;
        for (int candidateLevel = MaxLevel; candidateLevel >= 1; candidateLevel -= 1)
        {
            if (normalizedLifetimeXp >= GetLevelThreshold(candidateLevel))
            {
                level = candidateLevel;
                break;
            }
        }

        int currentThreshold = GetLevelThreshold(level);
        int nextThreshold = level < MaxLevel
            ? GetLevelThreshold(level + 1)
            : currentThreshold + GetXpRequiredForLevel(level);
        int xpForNextLevel = Math.Max(nextThreshold - currentThreshold, 1);
        int currentLevelXp = Math.Clamp(normalizedLifetimeXp - currentThreshold, 0, xpForNextLevel);
        int xpRemainingForNextLevel = Math.Max(xpForNextLevel - currentLevelXp, 0);
        int progressPercent = Math.Clamp((int)Math.Round((double)currentLevelXp / xpForNextLevel * 100), 0, 100);

        return new ProgressMetrics(
            Level: level,
            LevelName: GetLevelName(level),
            CurrentLevelXp: currentLevelXp,
            XpForNextLevel: xpForNextLevel,
            XpRemainingForNextLevel: xpRemainingForNextLevel,
            ProgressPercent: progressPercent);
    }

    private static int GetLevelThreshold(int level)
    {
        if (level <= 1)
        {
            return 0;
        }

        if (level <= InitialLevelThresholds.Length)
        {
            return InitialLevelThresholds[level - 1];
        }

        int threshold = InitialLevelThresholds[^1];
        for (int previousLevel = InitialLevelThresholds.Length; previousLevel < level; previousLevel += 1)
        {
            threshold += GetXpRequiredForLevel(previousLevel);
        }

        return threshold;
    }

    private static int GetXpRequiredForLevel(int level)
    {
        int normalizedLevel = Math.Clamp(level, 1, MaxLevel);
        if (normalizedLevel < InitialLevelThresholds.Length)
        {
            return InitialLevelThresholds[normalizedLevel] - InitialLevelThresholds[normalizedLevel - 1];
        }

        int bandIndex = (normalizedLevel - 1) / 10;
        int levelsBeyondInitialScale = normalizedLevel - InitialLevelThresholds.Length;
        return 1180 + (levelsBeyondInitialScale * 85) + (bandIndex * 120);
    }

    private static string GetLevelName(int level)
    {
        int normalizedLevel = Math.Clamp(level, 1, MaxLevel);
        int bandIndex = Math.Clamp((normalizedLevel - 1) / 10, 0, LevelBandNames.Length - 1);
        int bandLevel = ((normalizedLevel - 1) % 10) + 1;
        return $"{LevelBandNames[bandIndex]} {bandLevel}";
    }

    private sealed record ProgressMetrics(
        int Level,
        string LevelName,
        int CurrentLevelXp,
        int XpForNextLevel,
        int XpRemainingForNextLevel,
        int ProgressPercent);

    private sealed class TaskCompletionXpSnapshot
    {
        public string Status { get; set; } = string.Empty;
        public int? StoryPoints { get; set; }
        public string? Priority { get; set; }
        public string? DueDate { get; set; }
        public DateTime CompletedAtUtc { get; set; }
        public int AssigneeUserId { get; set; }
    }

    private static class XpEventTypes
    {
        public const string TaskCompleted = "TASK_COMPLETED";
        public const string TaskCompletedEarly = "TASK_COMPLETED_EARLY";
        public const string TaskCompletedPriorityHigh = "TASK_COMPLETED_PRIORITY_HIGH";
        public const string TaskCompletedPriorityCritical = "TASK_COMPLETED_PRIORITY_CRITICAL";
        public const string TaskCompletionReversed = "TASK_COMPLETION_REVERSED";
    }
}
