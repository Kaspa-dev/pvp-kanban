namespace BE.DTOs;

public class BoardMemberDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class BoardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoIconKey { get; set; } = string.Empty;
    public string LogoColorKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CreatorUserId { get; set; }
    public List<BoardMemberDto> Members { get; set; } = new();
}

public class BoardListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoIconKey { get; set; } = string.Empty;
    public string LogoColorKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CreatorUserId { get; set; }
    public int MemberCount { get; set; }
    public bool HasActiveSprint { get; set; }
    public string? ActiveSprintName { get; set; }
    public int RemainingActiveSprintTasks { get; set; }
    public List<BoardMemberDto> Members { get; set; } = new();
}

public class BoardListSummaryDto
{
    public int ActiveProjects { get; set; }
    public int ActiveSprints { get; set; }
    public int AssignedTasks { get; set; }
    public int OpenTasks { get; set; }
    public int CompletedTasks { get; set; }
}

public class PagedBoardListResponseDto
{
    public List<BoardListItemDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public BoardListSummaryDto Summary { get; set; } = new();
}

public class BoardListQueryDto
{
    public string? Q { get; set; }
    public string? Membership { get; set; }
    public bool ActiveSprint { get; set; }
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class CreateBoardRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoIconKey { get; set; } = string.Empty;
    public string LogoColorKey { get; set; } = string.Empty;
    public List<int> MemberUserIds { get; set; } = new();
}

public class UpdateBoardRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoIconKey { get; set; } = string.Empty;
    public string LogoColorKey { get; set; } = string.Empty;
    public List<int> MemberUserIds { get; set; } = new();
}

public class BoardTaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StatusKey { get; set; } = string.Empty;
    public List<int> LabelIds { get; set; } = new();
    public int? AssigneeUserId { get; set; }
    public BoardMemberDto? Assignee { get; set; }
    public int ReporterUserId { get; set; }
    public int? SprintId { get; set; }
    public int? StoryPoints { get; set; }
    public string? DueDate { get; set; }
    public string? Priority { get; set; }
    public string? TaskType { get; set; }
}

public class CreateTaskRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StatusKey { get; set; } = string.Empty;
    public List<int> LabelIds { get; set; } = new();
    public int? AssigneeUserId { get; set; }
    public int? StoryPoints { get; set; }
    public string? DueDate { get; set; }
    public string? Priority { get; set; }
    public string? TaskType { get; set; }
    public int? SprintId { get; set; }
}

public class UpdateTaskRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StatusKey { get; set; } = string.Empty;
    public List<int> LabelIds { get; set; } = new();
    public int? AssigneeUserId { get; set; }
    public int? StoryPoints { get; set; }
    public string? DueDate { get; set; }
    public string? Priority { get; set; }
    public string? TaskType { get; set; }
    public int? SprintId { get; set; }
}

public class BoardLabelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class CreateLabelRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class UpdateLabelRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class BoardSprintDto
{
    public int Id { get; set; }
    public int BoardId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class CreateSprintRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
}

public class UpdateSprintRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
}

public class UserProgressDto
{
    public int Xp { get; set; }
    public int Level { get; set; }
    public int TasksCompleted { get; set; }
}
