namespace BE.DTOs;

public class UserPreferencesDto
{
    public bool CoachmarksEnabled { get; set; } = true;
    public List<string> CompletedFlows { get; set; } = new();
}

public class UpdateUserPreferencesRequestDto
{
    public bool CoachmarksEnabled { get; set; } = true;
    public List<string> CompletedFlows { get; set; } = new();
}
