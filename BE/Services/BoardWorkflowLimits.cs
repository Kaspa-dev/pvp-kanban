namespace BE.Services;

public sealed record BoardWorkflowLimit(string StatusKey, int? SoftLimit, int? HardLimit);

public static class BoardWorkflowLimits
{
    private static readonly IReadOnlyDictionary<string, BoardWorkflowLimit> LimitsByStatus =
        new Dictionary<string, BoardWorkflowLimit>(StringComparer.OrdinalIgnoreCase)
        {
            ["todo"] = new("todo", SoftLimit: 8, HardLimit: 12),
            ["inProgress"] = new("inProgress", SoftLimit: 4, HardLimit: 6),
            ["inReview"] = new("inReview", SoftLimit: 3, HardLimit: 5),
            ["done"] = new("done", SoftLimit: null, HardLimit: null),
            ["backlog"] = new("backlog", SoftLimit: null, HardLimit: null),
        };

    public static IReadOnlyCollection<BoardWorkflowLimit> GetAll()
    {
        return LimitsByStatus.Values.ToArray();
    }

    public static BoardWorkflowLimit? GetLimit(string? statusKey)
    {
        if (string.IsNullOrWhiteSpace(statusKey))
        {
            return null;
        }

        return LimitsByStatus.TryGetValue(statusKey.Trim(), out BoardWorkflowLimit? limit)
            ? limit
            : null;
    }

    public static bool WouldExceedSoftLimit(BoardWorkflowLimit? limit, int currentCount, int itemsToAdd = 1)
    {
        if (limit?.SoftLimit is not int softLimit)
        {
            return false;
        }

        return currentCount + itemsToAdd > softLimit;
    }

    public static bool WouldExceedHardLimit(BoardWorkflowLimit? limit, int currentCount, int itemsToAdd = 1)
    {
        if (limit?.HardLimit is not int hardLimit)
        {
            return false;
        }

        return currentCount + itemsToAdd > hardLimit;
    }
}
