namespace BE.Models;

public class UserMilestone
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string MilestoneKey { get; set; } = string.Empty;
    public int ProgressValue { get; set; }
    public DateTime UnlockedAtUtc { get; set; }

    public User User { get; set; } = null!;
}
