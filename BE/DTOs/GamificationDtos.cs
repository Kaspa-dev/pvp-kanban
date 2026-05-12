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

public class BoardLevelLeaderboardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoIconKey { get; set; } = string.Empty;
    public string LogoColorKey { get; set; } = string.Empty;
    public int CurrentUserId { get; set; }
    public List<BoardLevelLeaderboardMemberDto> Members { get; set; } = new();
}

public class BoardLevelLeaderboardMemberDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int Level { get; set; }
    public BoardLevelLeaderboardPeriodsDto XpByPeriod { get; set; } = new();
}

public class BoardLevelLeaderboardPeriodsDto
{
    public int Day { get; set; }
    public int Week { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
}
