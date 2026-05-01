namespace BE.Services;

public sealed record BoardWorkflowLimit(string StatusKey, int? SoftLimit, int? HardLimit);

public static class BoardWorkflowLimits
{
    private static readonly BoardWorkflowLimit[] ConfigurableDefaults =
    [
        new("todo", SoftLimit: 8, HardLimit: 12),
        new("inProgress", SoftLimit: 4, HardLimit: 6),
        new("inReview", SoftLimit: 3, HardLimit: 5),
        new("done", SoftLimit: 20, HardLimit: 20),
    ];

    private static readonly HashSet<string> ConfigurableStatusKeys = ConfigurableDefaults
        .Select(limit => limit.StatusKey)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyCollection<BoardWorkflowLimit> GetConfigurableDefaults()
    {
        return ConfigurableDefaults
            .Select(limit => new BoardWorkflowLimit(limit.StatusKey, limit.SoftLimit, limit.HardLimit))
            .ToArray();
    }

    public static bool IsConfigurableStatusKey(string? statusKey)
    {
        return !string.IsNullOrWhiteSpace(statusKey) && ConfigurableStatusKeys.Contains(statusKey.Trim());
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
