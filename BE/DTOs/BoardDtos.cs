using Microsoft.AspNetCore.Mvc;

namespace BE.DTOs;

public class BoardMemberDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? CurrentLevel { get; set; }
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
    public bool IsFavorite { get; set; }
    public List<BoardColumnLimitDto> ColumnLimits { get; set; } = new();
    public List<BoardMemberDto> Members { get; set; } = new();
}

public class BoardColumnLimitDto
{
    public string StatusKey { get; set; } = string.Empty;
    public int? SoftLimit { get; set; }
    public int? HardLimit { get; set; }
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
    public bool IsFavorite { get; set; }
    public List<BoardMemberDto> Members { get; set; } = new();
}

public class BoardListSummaryDto
{
    public int ActiveProjects { get; set; }
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
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class BoardFavoriteStateDto
{
    public int BoardId { get; set; }
    public bool IsFavorite { get; set; }
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
    public List<UpdateBoardColumnLimitDto> ColumnLimits { get; set; } = new();
}

public class UpdateBoardColumnLimitDto
{
    public string StatusKey { get; set; } = string.Empty;
    public int? SoftLimit { get; set; }
    public int? HardLimit { get; set; }
}

public class BoardTaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StatusKey { get; set; } = string.Empty;
    public bool IsQueued { get; set; }
    public int ColumnPosition { get; set; }
    public List<int> LabelIds { get; set; } = new();
    public int? AssigneeUserId { get; set; }
    public BoardMemberDto? Assignee { get; set; }
    public int ReporterUserId { get; set; }
    public int? StoryPoints { get; set; }
    public string? DueDate { get; set; }
    public DateTime? StatusEnteredAtUtc { get; set; }
    public DateTime? ConcludedAtUtc { get; set; }
    public int? ConcludedByUserId { get; set; }
    public string? Priority { get; set; }
    public string? TaskType { get; set; }
}

public class ConcludeBoardTasksResponseDto
{
    public List<int> TaskIds { get; set; } = new();
    public int Count { get; set; }
}

public class BoardStatisticsDto
{
    public BoardStatisticsStatusSummaryDto StatusCounts { get; set; } = new();
    public List<BoardStatisticsAgingTaskDto> AgingTasks { get; set; } = new();
    public BoardStatisticsArchiveTrendDto ArchiveTrend { get; set; } = new();
    public List<BoardStatisticsPriorityMixDto> PriorityMix { get; set; } = new();
}

public class BoardStatisticsStatusSummaryDto
{
    public List<BoardStatisticsStatusCountDto> Items { get; set; } = new();
}

public class BoardStatisticsStatusCountDto
{
    public string StatusKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public int TaskCount { get; set; }
    public int StoryPoints { get; set; }
}

public class BoardStatisticsAgingTaskDto
{
    public int TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string StatusKey { get; set; } = string.Empty;
    public string StatusLabel { get; set; } = string.Empty;
    public int DaysInStatus { get; set; }
    public DateTime? StatusEnteredAtUtc { get; set; }
    public string? Priority { get; set; }
    public BoardMemberDto? Assignee { get; set; }
}

public class BoardStatisticsArchiveTrendDto
{
    public string Range { get; set; } = "30d";
    public string Bucket { get; set; } = "day";
    public List<BoardStatisticsArchiveTrendBucketDto> Buckets { get; set; } = new();
}

public class BoardStatisticsArchiveTrendBucketDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int ConcludedCount { get; set; }
}

public class BoardStatisticsPriorityMixDto
{
    public string Priority { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int TaskCount { get; set; }
}

public class TaskCommentDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public BoardMemberDto Author { get; set; } = new();
    public int AuthorUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}

public class TaskDetailsDto : BoardTaskDto
{
    public List<TaskCommentDto> Comments { get; set; } = new();
}

public class CreateTaskCommentRequestDto
{
    public string Content { get; set; } = string.Empty;
}

public class UpdateTaskCommentRequestDto
{
    public string Content { get; set; } = string.Empty;
}

public class PagedBoardTaskListResponseDto
{
    public List<BoardTaskDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public class BoardTaskListQueryDto
{
    public string Scope { get; set; } = "active";
    public string? Q { get; set; }
    public string QuickFilter { get; set; } = "all";
    public List<int> LabelIds { get; set; } = new();
    [FromQuery(Name = "assigneeUserIds")]
    public List<int> AssigneeUserIds { get; set; } = new();
    [FromQuery(Name = "priorities")]
    public List<string> Priorities { get; set; } = new();
    [FromQuery(Name = "taskTypes")]
    public List<string> TaskTypes { get; set; } = new();
    public string StageFilter { get; set; } = "all";
    public string? Sort { get; set; }
    public string? Direction { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PagedMyTaskListResponseDto
{
    public List<MyTaskItemDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public class MyTaskBoardOptionDto
{
    public int BoardId { get; set; }
    public string BoardName { get; set; } = string.Empty;
    public string BoardLogoIconKey { get; set; } = string.Empty;
    public string BoardLogoColorKey { get; set; } = string.Empty;
}

public class MyTaskListQueryDto
{
    public string Scope { get; set; } = "active";
    public int? BoardId { get; set; }
    [FromQuery(Name = "boardIds")]
    public List<int> BoardIds { get; set; } = new();
    public string? Q { get; set; }
    public string QuickFilter { get; set; } = "all";
    [FromQuery(Name = "priorities")]
    public List<string> Priorities { get; set; } = new();
    [FromQuery(Name = "taskTypes")]
    public List<string> TaskTypes { get; set; } = new();
    public string? Sort { get; set; }
    public string? Direction { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class MyTaskItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StatusKey { get; set; } = string.Empty;
    public bool IsQueued { get; set; }
    public int ColumnPosition { get; set; }
    public List<int> LabelIds { get; set; } = new();
    public int? AssigneeUserId { get; set; }
    public BoardMemberDto? Assignee { get; set; }
    public int ReporterUserId { get; set; }
    public int? StoryPoints { get; set; }
    public string? DueDate { get; set; }
    public DateTime? StatusEnteredAtUtc { get; set; }
    public DateTime? ConcludedAtUtc { get; set; }
    public int? ConcludedByUserId { get; set; }
    public string? Priority { get; set; }
    public string? TaskType { get; set; }
    public int BoardId { get; set; }
    public string BoardName { get; set; } = string.Empty;
    public string BoardLogoIconKey { get; set; } = string.Empty;
    public string BoardLogoColorKey { get; set; } = string.Empty;
}

public class PlanningPokerParticipantDto
{
    public int ParticipantId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public bool IsHost { get; set; }
    public bool IsGuest { get; set; }
    public bool HasVoted { get; set; }
    public int? RevealedCardValue { get; set; }
}

public class PlanningPokerVoteSummaryDto
{
    public int CardValue { get; set; }
    public int Count { get; set; }
}

public class PlanningPokerSessionTaskDto
{
    public int SessionTaskId { get; set; }
    public int TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Position { get; set; }
    public string RoundState { get; set; } = string.Empty;
    public int? RecommendedStoryPoints { get; set; }
    public int? AppliedStoryPoints { get; set; }
    public List<PlanningPokerVoteSummaryDto> VoteSummary { get; set; } = new();
}

public class PlanningPokerSessionDto
{
    public int SessionId { get; set; }
    public int BoardId { get; set; }
    public string JoinToken { get; set; } = string.Empty;
    public string JoinUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsCurrentUserHost { get; set; }
    public PlanningPokerSessionTaskDto ActiveTask { get; set; } = new();
    public List<PlanningPokerSessionTaskDto> Queue { get; set; } = new();
    public List<PlanningPokerParticipantDto> Participants { get; set; } = new();
    public bool IsRevealed { get; set; }
}

public class PlanningPokerSessionDeletedDto
{
    public int BoardId { get; set; }
    public string Message { get; set; } = string.Empty;
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
}

public class UpdateTaskPositionRequestDto
{
    public string TargetStatusKey { get; set; } = string.Empty;
    public int TargetIndex { get; set; }
}

public class CreatePlanningPokerSessionRequestDto
{
    public string? Name { get; set; }
}

public class ApplyPlanningPokerRecommendationRequestDto
{
    public int SessionTaskId { get; set; }
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

public class UserProgressDto
{
    public int Xp { get; set; }
    public int Level { get; set; }
    public int TasksCompleted { get; set; }
}
