namespace BE.DTOs;

public class UserMilestoneDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string IconKey { get; set; } = string.Empty;
    public int TargetValue { get; set; }
    public int CurrentValue { get; set; }
    public bool IsUnlocked { get; set; }
    public DateTime? UnlockedAtUtc { get; set; }
    public int SortOrder { get; set; }
}

public class UserMilestoneSummaryDto
{
    public int UnlockedCount { get; set; }
    public int TotalCount { get; set; }
    public List<UserMilestoneDto> RecentUnlocked { get; set; } = new();
    public List<UserMilestoneDto> Upcoming { get; set; } = new();
}

public class UserMilestonesResponseDto
{
    public UserMilestoneSummaryDto Summary { get; set; } = new();
    public List<UserMilestoneDto> Milestones { get; set; } = new();
}
