namespace BE.DTOs;

public class UpdateCurrentUserRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class ChangePasswordRequestDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmNewPassword { get; set; } = string.Empty;
}

public class DeleteCurrentUserBlockedDto
{
    public string Message { get; set; } = string.Empty;
    public int OwnedBoardsCount { get; set; }
    public int OwnedTeamsCount { get; set; }
    public int ReportedTasksCount { get; set; }
}
