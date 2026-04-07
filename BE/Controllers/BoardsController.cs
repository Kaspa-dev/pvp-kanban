using System.Globalization;
using System.Security.Claims;
using BE.Data;
using BE.DTOs;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardTaskStatus = BE.Models.TaskStatus;
using TaskEntity = BE.Models.Task;

namespace BE.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BoardsController(AppDbContext context) : ControllerBase
{
    private readonly AppDbContext _context = context;

    private static readonly string[] StatusKeys =
    [
        "backlog",
        "todo",
        "inProgress",
        "inReview",
        "done",
    ];

    private static readonly string[] MemberColors =
    [
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#f59e0b",
        "#06b6d4",
        "#ec4899",
        "#ef4444",
        "#84cc16",
    ];

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BoardDto>>> GetBoards(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var boards = await _context.Boards
            .Where(board => board.Memberships.Any(membership => membership.UserId == userId))
            .Include(board => board.Memberships)
            .ThenInclude(membership => membership.User)
            .OrderByDescending(board => board.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(boards.Select(ToBoardDto));
    }

    [HttpPost]
    public async Task<ActionResult<BoardDto>> CreateBoard(CreateBoardRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        string boardName = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(boardName))
        {
            return BadRequest(new { message = "Board name is required." });
        }

        List<int> memberUserIds = request.MemberUserIds
            .Append(userId)
            .Distinct()
            .ToList();

        var users = await _context.Users
            .Where(user => memberUserIds.Contains(user.Id))
            .ToListAsync(cancellationToken);

        if (users.Count != memberUserIds.Count)
        {
            return BadRequest(new { message = "One or more selected members do not exist." });
        }

        var board = new Board
        {
            Title = boardName,
            Description = request.Description.Trim(),
            CreatorId = userId,
            CreatedAt = DateTime.UtcNow,
        };

        board.Memberships.Add(new BoardMembership
        {
            UserId = userId,
            Role = BoardRole.Owner,
            Color = MemberColors[0],
        });

        int colorIndex = 1;
        foreach (int memberId in memberUserIds.Where(id => id != userId))
        {
            board.Memberships.Add(new BoardMembership
            {
                UserId = memberId,
                Role = BoardRole.Member,
                Color = MemberColors[colorIndex % MemberColors.Length],
            });
            colorIndex += 1;
        }

        foreach (string statusKey in StatusKeys)
        {
            board.TaskStatuses.Add(new BoardTaskStatus
            {
                Title = statusKey,
            });
        }

        _context.Boards.Add(board);
        await _context.SaveChangesAsync(cancellationToken);

        var createdBoard = await _context.Boards
            .Include(item => item.Memberships)
            .ThenInclude(membership => membership.User)
            .SingleAsync(item => item.Id == board.Id, cancellationToken);

        return CreatedAtAction(nameof(GetBoard), new { boardId = board.Id }, ToBoardDto(createdBoard));
    }

    [HttpGet("{boardId:int}")]
    public async Task<ActionResult<BoardDto>> GetBoard(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (context, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        return Ok(ToBoardDto(context!.Board));
    }

    [HttpPatch("{boardId:int}")]
    public async Task<ActionResult<BoardDto>> UpdateBoard(int boardId, UpdateBoardRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: true, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        string boardName = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(boardName))
        {
            return BadRequest(new { message = "Board name is required." });
        }

        Board board = accessContext!.Board;
        List<int> requestedMemberIds = request.MemberUserIds
            .Append(userId)
            .Distinct()
            .ToList();

        var users = await _context.Users
            .Where(user => requestedMemberIds.Contains(user.Id))
            .ToListAsync(cancellationToken);

        if (users.Count != requestedMemberIds.Count)
        {
            return BadRequest(new { message = "One or more selected members do not exist." });
        }

        board.Title = boardName;
        board.Description = request.Description.Trim();

        var existingMemberships = board.Memberships.ToDictionary(membership => membership.UserId);
        var removedMemberIds = existingMemberships.Keys.Except(requestedMemberIds).ToList();

        foreach (int removedUserId in removedMemberIds)
        {
            BoardMembership membership = existingMemberships[removedUserId];
            _context.BoardMemberships.Remove(membership);
        }

        if (removedMemberIds.Count > 0)
        {
            var tasksToUnassign = await _context.Tasks
                .Where(task => task.BoardId == boardId && task.AssigneeId.HasValue && removedMemberIds.Contains(task.AssigneeId.Value))
                .ToListAsync(cancellationToken);

            foreach (TaskEntity task in tasksToUnassign)
            {
                task.AssigneeId = null;
            }
        }

        int nextColorIndex = 0;
        foreach (int memberId in requestedMemberIds)
        {
            if (existingMemberships.TryGetValue(memberId, out BoardMembership? existingMembership))
            {
                existingMembership.Role = memberId == userId ? BoardRole.Owner : BoardRole.Member;
                nextColorIndex += 1;
                continue;
            }

            board.Memberships.Add(new BoardMembership
            {
                UserId = memberId,
                Role = memberId == userId ? BoardRole.Owner : BoardRole.Member,
                Color = MemberColors[nextColorIndex % MemberColors.Length],
            });
            nextColorIndex += 1;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var updatedBoard = await _context.Boards
            .Include(item => item.Memberships)
            .ThenInclude(membership => membership.User)
            .SingleAsync(item => item.Id == board.Id, cancellationToken);

        return Ok(ToBoardDto(updatedBoard));
    }

    [HttpDelete("{boardId:int}")]
    public async Task<IActionResult> DeleteBoard(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: true, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        _context.Boards.Remove(accessContext!.Board);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("{boardId:int}/tasks")]
    public async Task<ActionResult<IEnumerable<BoardTaskDto>>> GetTasks(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Board board = accessContext!.Board;
        Dictionary<int, BoardMemberDto> memberLookup = board.Memberships.ToDictionary(
            membership => membership.UserId,
            ToBoardMemberDto);

        var tasks = await _context.Tasks
            .Where(task => task.BoardId == boardId)
            .Include(task => task.Status)
            .Include(task => task.Assignee)
            .Include(task => task.LabeledTasks)
            .OrderByDescending(task => task.Id)
            .ToListAsync(cancellationToken);

        return Ok(tasks.Select(task => ToTaskDto(task, memberLookup)));
    }

    [HttpPost("{boardId:int}/tasks")]
    public async Task<ActionResult<BoardTaskDto>> CreateTask(int boardId, CreateTaskRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Board board = accessContext!.Board;
        if (!TryResolveTaskStatus(board, request.StatusKey, out BoardTaskStatus? status))
        {
            return BadRequest(new { message = "Task status is invalid." });
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Task title is required." });
        }

        if (!AreBoardLabelsValid(board, request.LabelIds))
        {
            return BadRequest(new { message = "One or more labels do not belong to this board." });
        }

        if (!IsBoardMember(board, request.AssigneeUserId))
        {
            return BadRequest(new { message = "Assignee must be a member of this board." });
        }

        if (!DoesBoardContainSprint(board, request.SprintId))
        {
            return BadRequest(new { message = "Sprint does not belong to this board." });
        }

        if (!TryParsePriority(request.Priority, out Priority? priority))
        {
            return BadRequest(new { message = "Priority is invalid." });
        }

        if (!TryParseTaskType(request.TaskType, out BE.Models.Type? taskType))
        {
            return BadRequest(new { message = "Task type is invalid." });
        }

        if (!TryParseDate(request.DueDate, out DateTime? dueDate))
        {
            return BadRequest(new { message = "Due date must use the yyyy-MM-dd format." });
        }

        var task = new TaskEntity
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            BoardId = boardId,
            StatusId = status!.Id,
            AssigneeId = request.AssigneeUserId,
            ReporterId = userId,
            SprintId = request.SprintId,
            StoryPoints = request.StoryPoints,
            DueDate = dueDate,
            Priority = priority,
            Type = taskType,
        };

        foreach (int labelId in request.LabelIds.Distinct())
        {
            task.LabeledTasks.Add(new LabeledTask
            {
                LabelId = labelId,
            });
        }

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(cancellationToken);

        var createdTask = await _context.Tasks
            .Where(item => item.Id == task.Id)
            .Include(item => item.Status)
            .Include(item => item.Assignee)
            .Include(item => item.LabeledTasks)
            .SingleAsync(cancellationToken);

        var memberLookup = board.Memberships.ToDictionary(
            membership => membership.UserId,
            ToBoardMemberDto);

        return CreatedAtAction(nameof(GetTasks), new { boardId }, ToTaskDto(createdTask, memberLookup));
    }

    [HttpPatch("{boardId:int}/tasks/{taskId:int}")]
    public async Task<ActionResult<BoardTaskDto>> UpdateTask(int boardId, int taskId, UpdateTaskRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Board board = accessContext!.Board;
        TaskEntity? task = await _context.Tasks
            .Where(item => item.Id == taskId && item.BoardId == boardId)
            .Include(item => item.Status)
            .Include(item => item.Assignee)
            .Include(item => item.LabeledTasks)
            .FirstOrDefaultAsync(cancellationToken);

        if (task is null)
        {
            return NotFound();
        }

        if (!TryResolveTaskStatus(board, request.StatusKey, out BoardTaskStatus? status))
        {
            return BadRequest(new { message = "Task status is invalid." });
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Task title is required." });
        }

        if (!AreBoardLabelsValid(board, request.LabelIds))
        {
            return BadRequest(new { message = "One or more labels do not belong to this board." });
        }

        if (!IsBoardMember(board, request.AssigneeUserId))
        {
            return BadRequest(new { message = "Assignee must be a member of this board." });
        }

        if (!DoesBoardContainSprint(board, request.SprintId))
        {
            return BadRequest(new { message = "Sprint does not belong to this board." });
        }

        if (!TryParsePriority(request.Priority, out Priority? priority))
        {
            return BadRequest(new { message = "Priority is invalid." });
        }

        if (!TryParseTaskType(request.TaskType, out BE.Models.Type? taskType))
        {
            return BadRequest(new { message = "Task type is invalid." });
        }

        if (!TryParseDate(request.DueDate, out DateTime? dueDate))
        {
            return BadRequest(new { message = "Due date must use the yyyy-MM-dd format." });
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description.Trim();
        task.StatusId = status!.Id;
        task.AssigneeId = request.AssigneeUserId;
        task.SprintId = request.SprintId;
        task.StoryPoints = request.StoryPoints;
        task.DueDate = dueDate;
        task.Priority = priority;
        task.Type = taskType;

        _context.LabeledTasks.RemoveRange(task.LabeledTasks);
        task.LabeledTasks.Clear();
        foreach (int labelId in request.LabelIds.Distinct())
        {
            task.LabeledTasks.Add(new LabeledTask
            {
                LabelId = labelId,
                TaskId = task.Id,
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        var memberLookup = board.Memberships.ToDictionary(
            membership => membership.UserId,
            ToBoardMemberDto);

        return Ok(ToTaskDto(task, memberLookup));
    }

    [HttpDelete("{boardId:int}/tasks/{taskId:int}")]
    public async Task<IActionResult> DeleteTask(int boardId, int taskId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (_, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        TaskEntity? task = await _context.Tasks
            .FirstOrDefaultAsync(item => item.Id == taskId && item.BoardId == boardId, cancellationToken);

        if (task is null)
        {
            return NotFound();
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("{boardId:int}/labels")]
    public async Task<ActionResult<IEnumerable<BoardLabelDto>>> GetLabels(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (_, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        var labels = await _context.Labels
            .Where(label => label.BoardId == boardId)
            .OrderBy(label => label.Title)
            .ToListAsync(cancellationToken);

        return Ok(labels.Select(ToLabelDto));
    }

    [HttpPost("{boardId:int}/labels")]
    public async Task<ActionResult<BoardLabelDto>> CreateLabel(int boardId, CreateLabelRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (_, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Label name is required." });
        }

        var label = new Label
        {
            BoardId = boardId,
            Title = request.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#64748b" : request.Color.Trim(),
        };

        _context.Labels.Add(label);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetLabels), new { boardId }, ToLabelDto(label));
    }

    [HttpPatch("{boardId:int}/labels/{labelId:int}")]
    public async Task<ActionResult<BoardLabelDto>> UpdateLabel(int boardId, int labelId, UpdateLabelRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (_, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Label? label = await _context.Labels
            .FirstOrDefaultAsync(item => item.Id == labelId && item.BoardId == boardId, cancellationToken);

        if (label is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Label name is required." });
        }

        label.Title = request.Name.Trim();
        label.Color = string.IsNullOrWhiteSpace(request.Color) ? label.Color : request.Color.Trim();

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToLabelDto(label));
    }

    [HttpDelete("{boardId:int}/labels/{labelId:int}")]
    public async Task<IActionResult> DeleteLabel(int boardId, int labelId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (_, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Label? label = await _context.Labels
            .FirstOrDefaultAsync(item => item.Id == labelId && item.BoardId == boardId, cancellationToken);

        if (label is null)
        {
            return NotFound();
        }

        _context.Labels.Remove(label);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("{boardId:int}/sprints")]
    public async Task<ActionResult<IEnumerable<BoardSprintDto>>> GetSprints(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (_, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        var sprints = await _context.Sprints
            .Where(sprint => sprint.BoardId == boardId)
            .OrderByDescending(sprint => sprint.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(sprints.Select(ToSprintDto));
    }

    [HttpPost("{boardId:int}/sprints")]
    public async Task<ActionResult<BoardSprintDto>> CreateSprint(int boardId, CreateSprintRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Board board = accessContext!.Board;

        if (board.Sprints.Any(sprint => sprint.Status is SprintStatus.Planned or SprintStatus.Active))
        {
            return Conflict(new { message = "This board already has an active or planned sprint." });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Sprint name is required." });
        }

        if (!TryParseDate(request.StartDate, out DateTime? startDate) || !TryParseDate(request.EndDate, out DateTime? endDate))
        {
            return BadRequest(new { message = "Sprint dates must use the yyyy-MM-dd format." });
        }

        if (endDate <= startDate)
        {
            return BadRequest(new { message = "Sprint end date must be after the start date." });
        }

        var sprint = new Sprint
        {
            BoardId = boardId,
            Title = request.Name.Trim(),
            StartDate = startDate!.Value,
            EndDate = endDate!.Value,
            Status = SprintStatus.Planned,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Sprints.Add(sprint);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetSprints), new { boardId }, ToSprintDto(sprint));
    }

    [HttpPatch("{boardId:int}/sprints/{sprintId:int}")]
    public async Task<ActionResult<BoardSprintDto>> UpdateSprint(int boardId, int sprintId, UpdateSprintRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (_, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Sprint? sprint = await _context.Sprints
            .FirstOrDefaultAsync(item => item.Id == sprintId && item.BoardId == boardId, cancellationToken);

        if (sprint is null)
        {
            return NotFound();
        }

        if (sprint.Status == SprintStatus.Completed)
        {
            return Conflict(new { message = "Completed sprints cannot be edited." });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Sprint name is required." });
        }

        if (!TryParseDate(request.StartDate, out DateTime? startDate) || !TryParseDate(request.EndDate, out DateTime? endDate))
        {
            return BadRequest(new { message = "Sprint dates must use the yyyy-MM-dd format." });
        }

        if (endDate <= startDate)
        {
            return BadRequest(new { message = "Sprint end date must be after the start date." });
        }

        sprint.Title = request.Name.Trim();
        sprint.StartDate = startDate!.Value;
        sprint.EndDate = endDate!.Value;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToSprintDto(sprint));
    }

    [HttpPost("{boardId:int}/sprints/{sprintId:int}/start")]
    public async Task<ActionResult<BoardSprintDto>> StartSprint(int boardId, int sprintId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Board board = accessContext!.Board;
        Sprint? sprint = board.Sprints.FirstOrDefault(item => item.Id == sprintId);
        if (sprint is null)
        {
            return NotFound();
        }

        if (board.Sprints.Any(item => item.Id != sprintId && item.Status == SprintStatus.Active))
        {
            return Conflict(new { message = "This board already has an active sprint." });
        }

        if (sprint.Status != SprintStatus.Planned)
        {
            return Conflict(new { message = "Only planned sprints can be started." });
        }

        sprint.Status = SprintStatus.Active;

        BoardTaskStatus backlogStatus = board.TaskStatuses.Single(status => status.Title == "backlog");
        BoardTaskStatus todoStatus = board.TaskStatuses.Single(status => status.Title == "todo");

        var sprintTasks = await _context.Tasks
            .Where(task => task.BoardId == boardId && task.SprintId == sprintId)
            .ToListAsync(cancellationToken);

        foreach (TaskEntity task in sprintTasks.Where(task => task.StatusId == backlogStatus.Id))
        {
            task.StatusId = todoStatus.Id;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToSprintDto(sprint));
    }

    [HttpPost("{boardId:int}/sprints/{sprintId:int}/complete")]
    public async Task<ActionResult<BoardSprintDto>> CompleteSprint(int boardId, int sprintId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
        if (failure is not null)
        {
            return failure;
        }

        Sprint? sprint = accessContext!.Board.Sprints.FirstOrDefault(item => item.Id == sprintId);
        if (sprint is null)
        {
            return NotFound();
        }

        if (sprint.Status != SprintStatus.Active)
        {
            return Conflict(new { message = "Only active sprints can be completed." });
        }

        sprint.Status = SprintStatus.Completed;
        sprint.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToSprintDto(sprint));
    }

    private async Task<(BoardAccessContext? Context, ActionResult? Failure)> GetBoardAccessAsync(
        int boardId,
        int userId,
        bool requireOwner,
        CancellationToken cancellationToken)
    {
        Board? board = await _context.Boards
            .Include(item => item.Memberships)
            .ThenInclude(membership => membership.User)
            .Include(item => item.TaskStatuses)
            .Include(item => item.Labels)
            .Include(item => item.Sprints)
            .FirstOrDefaultAsync(item => item.Id == boardId, cancellationToken);

        if (board is null)
        {
            return (null, NotFound());
        }

        BoardMembership? membership = board.Memberships.FirstOrDefault(item => item.UserId == userId);
        if (membership is null)
        {
            return (null, Forbid());
        }

        if (requireOwner && membership.Role != BoardRole.Owner)
        {
            return (null, Forbid());
        }

        return (new BoardAccessContext(board, membership), null);
    }

    private static bool TryResolveTaskStatus(Board board, string statusKey, out BoardTaskStatus? status)
    {
        status = board.TaskStatuses
            .SingleOrDefault(item => item.Title.Equals(statusKey.Trim(), StringComparison.OrdinalIgnoreCase));
        return status is not null;
    }

    private static bool AreBoardLabelsValid(Board board, IEnumerable<int> labelIds)
    {
        HashSet<int> allowedLabelIds = board.Labels.Select(label => label.Id).ToHashSet();
        return labelIds.All(allowedLabelIds.Contains);
    }

    private static bool IsBoardMember(Board board, int? assigneeUserId)
    {
        return assigneeUserId is null || board.Memberships.Any(membership => membership.UserId == assigneeUserId.Value);
    }

    private static bool DoesBoardContainSprint(Board board, int? sprintId)
    {
        return sprintId is null || board.Sprints.Any(sprint => sprint.Id == sprintId.Value);
    }

    private static bool TryParsePriority(string? value, out Priority? priority)
    {
        priority = null;
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (Enum.TryParse(value, true, out Priority parsedPriority))
        {
            priority = parsedPriority;
            return true;
        }

        return false;
    }

    private static bool TryParseTaskType(string? value, out BE.Models.Type? taskType)
    {
        taskType = null;
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (Enum.TryParse(value, true, out BE.Models.Type parsedType))
        {
            taskType = parsedType;
            return true;
        }

        return false;
    }

    private static bool TryParseDate(string? value, out DateTime? parsedDate)
    {
        parsedDate = null;
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (DateTime.TryParseExact(
            value,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out DateTime date))
        {
            parsedDate = date.Date;
            return true;
        }

        return false;
    }

    private static BoardDto ToBoardDto(Board board)
    {
        return new BoardDto
        {
            Id = board.Id,
            Name = board.Title,
            Description = board.Description,
            CreatedAt = board.CreatedAt,
            CreatorUserId = board.CreatorId,
            Members = board.Memberships
                .OrderBy(membership => membership.Role == BoardRole.Owner ? 0 : 1)
                .ThenBy(membership => membership.User.FirstName)
                .ThenBy(membership => membership.User.LastName)
                .Select(ToBoardMemberDto)
                .ToList(),
        };
    }

    private static BoardMemberDto ToBoardMemberDto(BoardMembership membership)
    {
        return new BoardMemberDto
        {
            UserId = membership.UserId,
            Username = membership.User.Username,
            DisplayName = $"{membership.User.FirstName} {membership.User.LastName}".Trim(),
            Email = membership.User.Email,
            Color = membership.Color,
            Role = membership.Role.ToString().ToLowerInvariant(),
        };
    }

    private static BoardTaskDto ToTaskDto(TaskEntity task, IReadOnlyDictionary<int, BoardMemberDto> memberLookup)
    {
        return new BoardTaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            StatusKey = task.Status.Title,
            LabelIds = task.LabeledTasks
                .Select(labeledTask => labeledTask.LabelId)
                .OrderBy(id => id)
                .ToList(),
            AssigneeUserId = task.AssigneeId,
            Assignee = task.AssigneeId.HasValue && memberLookup.TryGetValue(task.AssigneeId.Value, out BoardMemberDto? member)
                ? member
                : null,
            ReporterUserId = task.ReporterId,
            SprintId = task.SprintId,
            StoryPoints = task.StoryPoints,
            DueDate = task.DueDate?.ToString("yyyy-MM-dd"),
            Priority = task.Priority?.ToString().ToLowerInvariant(),
            TaskType = task.Type?.ToString().ToLowerInvariant(),
        };
    }

    private static BoardLabelDto ToLabelDto(Label label)
    {
        return new BoardLabelDto
        {
            Id = label.Id,
            Name = label.Title,
            Color = label.Color,
        };
    }

    private static BoardSprintDto ToSprintDto(Sprint sprint)
    {
        return new BoardSprintDto
        {
            Id = sprint.Id,
            BoardId = sprint.BoardId,
            Name = sprint.Title,
            StartDate = sprint.StartDate.ToString("yyyy-MM-dd"),
            EndDate = sprint.EndDate.ToString("yyyy-MM-dd"),
            Status = sprint.Status.ToString().ToLowerInvariant(),
            CreatedAt = sprint.CreatedAt,
            CompletedAt = sprint.CompletedAt,
        };
    }

    private bool TryGetCurrentUserId(out int userId)
    {
        userId = 0;
        string? value =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(ClaimTypes.Sid) ??
            User.FindFirstValue("sub");

        return int.TryParse(value, out userId);
    }

    private sealed record BoardAccessContext(Board Board, BoardMembership Membership);
}
