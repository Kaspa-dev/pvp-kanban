using System.Text.Json;
using BE.Data;
using BE.DTOs;
using Microsoft.EntityFrameworkCore;
using PriorityLevel = BE.Models.Priority;
using TaskEntity = BE.Models.Task;
using XpEventModel = BE.Models.XpEvent;

namespace BE.Services;

public class GamificationService(AppDbContext context) : IGamificationService
{
    private static readonly int[] LevelThresholds =
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

    private static readonly string[] LevelNames =
    [
        "Beginner",
        "Trainee",
        "Contributor",
        "Organizer",
        "Flow Runner",
        "Task Slayer",
        "Flow Master",
        "Board Wizard",
        "Agile Champion",
        "Jira Master",
        "Kanban Legend",
        "Productivity Guru",
        "Velocity King",
        "Epic Closer",
        "Kanban Champion",
    ];

    private static readonly string[] CompletionEventTypes =
    [
        XpEventTypes.TaskCompleted,
        XpEventTypes.TaskCompletedEarly,
        XpEventTypes.TaskCompletedPriorityHigh,
        XpEventTypes.TaskCompletedPriorityCritical,
    ];

    private readonly AppDbContext _context = context;

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
        List<string> awardKeys = await _context.XpEvents
            .Where(xpEvent =>
                xpEvent.TaskId == taskId &&
                xpEvent.XpAmount > 0 &&
                CompletionEventTypes.Contains(xpEvent.Type))
            .Select(xpEvent => xpEvent.AwardKey)
            .ToListAsync(cancellationToken);

        int currentMaxCycle = awardKeys
            .Select(GetCompletionCycle)
            .DefaultIfEmpty(0)
            .Max();

        return currentMaxCycle + 1;
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

    private static DateTime GetStartOfUtcWeek(DateTime utcNow)
    {
        int daysSinceMonday = ((int)utcNow.DayOfWeek + 6) % 7;
        DateTime utcDate = utcNow.Date;
        return DateTime.SpecifyKind(utcDate.AddDays(-daysSinceMonday), DateTimeKind.Utc);
    }

    private static ProgressMetrics GetProgressMetrics(int lifetimeXp)
    {
        int level = 1;
        for (int index = LevelThresholds.Length - 1; index >= 0; index -= 1)
        {
            if (lifetimeXp >= LevelThresholds[index])
            {
                level = index + 1;
                break;
            }
        }

        int currentThreshold = LevelThresholds[level - 1];
        int nextThreshold = level < LevelThresholds.Length
            ? LevelThresholds[level]
            : currentThreshold + 1000;
        int xpForNextLevel = Math.Max(nextThreshold - currentThreshold, 1);
        int currentLevelXp = Math.Clamp(lifetimeXp - currentThreshold, 0, xpForNextLevel);
        int xpRemainingForNextLevel = Math.Max(xpForNextLevel - currentLevelXp, 0);
        int progressPercent = Math.Clamp((int)Math.Round((double)currentLevelXp / xpForNextLevel * 100), 0, 100);

        return new ProgressMetrics(
            Level: level,
            LevelName: LevelNames[level - 1],
            CurrentLevelXp: currentLevelXp,
            XpForNextLevel: xpForNextLevel,
            XpRemainingForNextLevel: xpRemainingForNextLevel,
            ProgressPercent: progressPercent);
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
