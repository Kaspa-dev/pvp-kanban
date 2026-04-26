namespace BE.DTOs;

public class UserGamificationSummaryDto
{
    public int LifetimeXp { get; set; }
    public int CurrentLevel { get; set; }
    public string CurrentLevelName { get; set; } = string.Empty;
    public int CurrentLevelXp { get; set; }
    public int XpForNextLevel { get; set; }
    public int XpRemainingForNextLevel { get; set; }
    public int ProgressPercent { get; set; }
    public int WeeklyXp { get; set; }
    public int MonthlyXp { get; set; }
    public int TasksCompleted { get; set; }
    public int Prestige { get; set; }
}
