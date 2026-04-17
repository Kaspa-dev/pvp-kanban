using System.Globalization;
using System.Security.Claims;
using BE.Data;
using BE.DTOs;
using BE.Hubs;
using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardTaskStatus = BE.Models.TaskStatus;
using TaskEntity = BE.Models.Task;

namespace BE.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BoardsController(
    AppDbContext context,
    IPlanningPokerSessionService planningPokerSessionService,
    IHubContext<PlanningPokerHub> planningPokerHubContext) : ControllerBase
{
    private readonly AppDbContext _context = context;
    private readonly IPlanningPokerSessionService _planningPokerSessionService = planningPokerSessionService;
    private readonly IHubContext<PlanningPokerHub> _planningPokerHubContext = planningPokerHubContext;
    private const int MaxBoardMembers = 20;
    private const int MaxBoardNameLength = 128;
    private const int MaxBoardDescriptionLength = 500;
    private const int DefaultBoardPageSize = 6;
    private const int MaxBoardPageSize = 48;
    private const int DefaultTaskPageSize = 10;
    private const int MaxTaskPageSize = 24;

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

    private static readonly string[] AllowedBoardLogoIconKeys =
    [
        "folder",
        "briefcase",
        "rocket",
        "layoutGrid",
        "code2",
        "megaphone",
        "palette",
        "chartNoAxesColumn",
    ];

    private static readonly string[] AllowedBoardLogoColorKeys =
    [
        "slate",
        "blue",
        "emerald",
        "amber",
        "rose",
        "violet",
        "cyan",
        "stone",
    ];

    [HttpGet]
    public async Task<ActionResult<PagedBoardListResponseDto>> GetBoards([FromQuery] BoardListQueryDto query, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        IQueryable<Board> accessibleBoardsQuery = _context.Boards
            .Where(board => board.Memberships.Any(membership => membership.UserId == userId));

        var summary = new BoardListSummaryDto
        {
            ActiveProjects = await accessibleBoardsQuery.CountAsync(cancellationToken),
            AssignedTasks = await _context.Tasks
                .Where(task =>
                    task.AssigneeId == userId &&
                    accessibleBoardsQuery.Select(board => board.Id).Contains(task.BoardId))
                .CountAsync(cancellationToken),
            OpenTasks = await _context.Tasks
                .Where(task =>
                    task.AssigneeId == userId &&
                    accessibleBoardsQuery.Select(board => board.Id).Contains(task.BoardId) &&
                    task.Status.Title != "done")
                .CountAsync(cancellationToken),
            CompletedTasks = await _context.Tasks
                .Where(task =>
                    task.AssigneeId == userId &&
                    accessibleBoardsQuery.Select(board => board.Id).Contains(task.BoardId) &&
                    task.Status.Title == "done")
                .CountAsync(cancellationToken),
        };

        IQueryable<Board> filteredBoardsQuery = ApplyBoardListFilters(accessibleBoardsQuery, userId, query);

        int pageSize = Math.Clamp(query.PageSize <= 0 ? DefaultBoardPageSize : query.PageSize, 1, MaxBoardPageSize);
        int totalItems = await filteredBoardsQuery.CountAsync(cancellationToken);
        int totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        int page = Math.Max(query.Page, 1);
        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

        var boards = await ApplyBoardListSorting(filteredBoardsQuery, query)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(board => board.Memberships)
            .ThenInclude(membership => membership.User)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return Ok(new PagedBoardListResponseDto
        {
            Items = boards
                .Select(ToBoardListItemDto)
                .ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            Summary = summary,
        });
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

        if (boardName.Length > MaxBoardNameLength)
        {
            return BadRequest(new { message = $"Board name can be up to {MaxBoardNameLength} characters." });
        }

        string description = request.Description.Trim();
        if (description.Length > MaxBoardDescriptionLength)
        {
            return BadRequest(new { message = $"Board description can be up to {MaxBoardDescriptionLength} characters." });
        }

        if (!TryNormalizeBoardLogoKey(
                request.LogoIconKey,
                AllowedBoardLogoIconKeys,
                Board.DefaultLogoIconKey,
                out string logoIconKey))
        {
            return BadRequest(new { message = "Board logo icon is invalid." });
        }

        if (!TryNormalizeBoardLogoKey(
                request.LogoColorKey,
                AllowedBoardLogoColorKeys,
                Board.DefaultLogoColorKey,
                out string logoColorKey))
        {
            return BadRequest(new { message = "Board logo color is invalid." });
        }

        List<int> memberUserIds = request.MemberUserIds
            .Append(userId)
            .Distinct()
            .ToList();

        if (memberUserIds.Count > MaxBoardMembers)
        {
            return BadRequest(new { message = $"Boards can have up to {MaxBoardMembers} members." });
        }

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
            Description = description,
            LogoIconKey = logoIconKey,
            LogoColorKey = logoColorKey,
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

    [HttpPost("{boardId:int}/planning-poker/session")]
    public async Task<ActionResult<PlanningPokerSessionDto>> CreatePlanningPokerSession(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        try
        {
            PlanningPokerSessionDto session = await _planningPokerSessionService.CreateSessionAsync(boardId, userId, cancellationToken);
            return Ok(session);
        }
        catch (PlanningPokerNotFoundException)
        {
            return NotFound();
        }
        catch (PlanningPokerAccessDeniedException)
        {
            return Forbid();
        }
        catch (PlanningPokerValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Unable to create the planning poker session right now."
            });
        }
    }

    [HttpGet("{boardId:int}/planning-poker/session")]
    public async Task<ActionResult<PlanningPokerSessionDto>> GetPlanningPokerSession(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        try
        {
            PlanningPokerSessionDto session = await _planningPokerSessionService.GetBoardSessionAsync(boardId, userId, cancellationToken);
            return Ok(session);
        }
        catch (PlanningPokerNotFoundException)
        {
            return NotFound();
        }
        catch (PlanningPokerAccessDeniedException)
        {
            return Forbid();
        }
        catch (PlanningPokerValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Unable to load the planning poker session right now."
            });
        }
    }

    [HttpDelete("{boardId:int}/planning-poker/session")]
    public async Task<IActionResult> DeletePlanningPokerSession(int boardId, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        try
        {
            PlanningPokerDeletedSessionResult result = await _planningPokerSessionService.DeleteBoardSessionAsync(
                boardId,
                userId,
                cancellationToken);
            await _planningPokerHubContext.Clients
                .Group(PlanningPokerHub.GetGroupNameForSession(result.SessionId))
                .SendAsync(
                    PlanningPokerHub.SessionDeletedEventName,
                    new PlanningPokerSessionDeletedDto
                    {
                        BoardId = result.BoardId,
                        Message = "This planning poker session was deleted by the host.",
                    },
                    cancellationToken);

            return NoContent();
        }
        catch (PlanningPokerNotFoundException)
        {
            return NotFound();
        }
        catch (PlanningPokerAccessDeniedException)
        {
            return Forbid();
        }
        catch (PlanningPokerValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Unable to delete the planning poker session right now."
            });
        }
    }

    [HttpPost("{boardId:int}/planning-poker/apply")]
    public async Task<ActionResult<BoardTaskDto>> ApplyPlanningPokerRecommendation(
        int boardId,
        ApplyPlanningPokerRecommendationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        try
        {
            BoardTaskDto task = await _planningPokerSessionService.ApplyRecommendationAsync(
                boardId,
                request.SessionTaskId,
                userId,
                cancellationToken);
            return Ok(task);
        }
        catch (PlanningPokerNotFoundException)
        {
            return NotFound();
        }
        catch (PlanningPokerAccessDeniedException)
        {
            return Forbid();
        }
        catch (PlanningPokerValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Unable to apply the planning poker recommendation right now."
            });
        }
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

        if (boardName.Length > MaxBoardNameLength)
        {
            return BadRequest(new { message = $"Board name can be up to {MaxBoardNameLength} characters." });
        }

        string description = request.Description.Trim();
        if (description.Length > MaxBoardDescriptionLength)
        {
            return BadRequest(new { message = $"Board description can be up to {MaxBoardDescriptionLength} characters." });
        }

        if (!TryNormalizeBoardLogoKey(
                request.LogoIconKey,
                AllowedBoardLogoIconKeys,
                Board.DefaultLogoIconKey,
                out string logoIconKey))
        {
            return BadRequest(new { message = "Board logo icon is invalid." });
        }

        if (!TryNormalizeBoardLogoKey(
                request.LogoColorKey,
                AllowedBoardLogoColorKeys,
                Board.DefaultLogoColorKey,
                out string logoColorKey))
        {
            return BadRequest(new { message = "Board logo color is invalid." });
        }

        Board board = accessContext!.Board;
        List<int> requestedMemberIds = request.MemberUserIds
            .Append(userId)
            .Distinct()
            .ToList();

        if (requestedMemberIds.Count > MaxBoardMembers)
        {
            return BadRequest(new { message = $"Boards can have up to {MaxBoardMembers} members." });
        }

        var users = await _context.Users
            .Where(user => requestedMemberIds.Contains(user.Id))
            .ToListAsync(cancellationToken);

        if (users.Count != requestedMemberIds.Count)
        {
            return BadRequest(new { message = "One or more selected members do not exist." });
        }

        board.Title = boardName;
        board.Description = description;
        board.LogoIconKey = logoIconKey;
        board.LogoColorKey = logoColorKey;

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

    [HttpGet("{boardId:int}/tasks/index")]
    public async Task<ActionResult<PagedBoardTaskListResponseDto>> GetTaskIndex(
        int boardId,
        [FromQuery] BoardTaskListQueryDto query,
        CancellationToken cancellationToken)
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

        IQueryable<TaskEntity> tasksQuery = _context.Tasks
            .Where(task => task.BoardId == boardId)
            .Include(task => task.Status)
            .Include(task => task.Assignee)
            .Include(task => task.LabeledTasks)
            .AsQueryable();

        tasksQuery = ApplyBoardTaskListFilters(tasksQuery, userId, query);

        int pageSize = Math.Clamp(query.PageSize <= 0 ? DefaultTaskPageSize : query.PageSize, 1, MaxTaskPageSize);
        int totalItems = await tasksQuery.CountAsync(cancellationToken);
        int totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        int page = Math.Max(query.Page, 1);
        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

        var items = await ApplyBoardTaskListSorting(tasksQuery, query)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedBoardTaskListResponseDto
        {
            Items = items.Select(task => ToTaskDto(task, memberLookup)).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
        });
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
            StoryPoints = request.StoryPoints,
            IsQueued = false,
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
        task.StoryPoints = request.StoryPoints;
        task.DueDate = dueDate;
        task.Priority = priority;
        task.Type = taskType;
        if (!string.Equals(status.Title, "backlog", StringComparison.OrdinalIgnoreCase))
        {
            task.IsQueued = false;
        }

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

    [HttpPost("{boardId:int}/queue/tasks/{taskId:int}")]
    public async Task<ActionResult<BoardTaskDto>> AddTaskToQueue(int boardId, int taskId, CancellationToken cancellationToken)
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

        if (!string.Equals(task.Status.Title, "backlog", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Only backlog tasks can be added to the queue." });
        }

        task.IsQueued = true;
        await _context.SaveChangesAsync(cancellationToken);

        var memberLookup = board.Memberships.ToDictionary(
            membership => membership.UserId,
            ToBoardMemberDto);

        return Ok(ToTaskDto(task, memberLookup));
    }

    [HttpDelete("{boardId:int}/queue/tasks/{taskId:int}")]
    public async Task<ActionResult<BoardTaskDto>> RemoveTaskFromQueue(int boardId, int taskId, CancellationToken cancellationToken)
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

        task.IsQueued = false;
        await _context.SaveChangesAsync(cancellationToken);

        var memberLookup = board.Memberships.ToDictionary(
            membership => membership.UserId,
            ToBoardMemberDto);

        return Ok(ToTaskDto(task, memberLookup));
    }

    [HttpPost("{boardId:int}/queue/start")]
    public async Task<ActionResult<IEnumerable<BoardTaskDto>>> StartQueue(int boardId, CancellationToken cancellationToken)
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
        BoardTaskStatus? todoStatus = board.TaskStatuses
            .SingleOrDefault(item => item.Title.Equals("todo", StringComparison.OrdinalIgnoreCase));

        if (todoStatus is null)
        {
            return BadRequest(new { message = "The board is missing a To Do status." });
        }

        var queuedTasks = await _context.Tasks
            .Where(task => task.BoardId == boardId && task.IsQueued)
            .Include(task => task.Status)
            .Include(task => task.Assignee)
            .Include(task => task.LabeledTasks)
            .OrderByDescending(task => task.Id)
            .ToListAsync(cancellationToken);

        List<TaskEntity> startableTasks = queuedTasks
            .Where(task => task.Status.Title.Equals("backlog", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (startableTasks.Count == 0)
        {
            return BadRequest(new { message = "There are no queued backlog tasks to start." });
        }

        foreach (TaskEntity task in startableTasks)
        {
            task.StatusId = todoStatus.Id;
            task.Status = todoStatus;
            task.IsQueued = false;
        }

        foreach (TaskEntity task in queuedTasks.Except(startableTasks))
        {
            task.IsQueued = false;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var memberLookup = board.Memberships.ToDictionary(
            membership => membership.UserId,
            ToBoardMemberDto);

        return Ok(startableTasks.Select(task => ToTaskDto(task, memberLookup)));
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

    private static bool TryNormalizeBoardLogoKey(
        string? value,
        IEnumerable<string> allowedKeys,
        string fallbackKey,
        out string normalizedKey)
    {
        string requestedKey = string.IsNullOrWhiteSpace(value) ? fallbackKey : value.Trim();
        string? canonicalKey = allowedKeys.FirstOrDefault(
            allowedKey => allowedKey.Equals(requestedKey, StringComparison.OrdinalIgnoreCase));

        if (canonicalKey is not null)
        {
            normalizedKey = canonicalKey;
            return true;
        }

        normalizedKey = string.Empty;
        return false;
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
            LogoIconKey = board.LogoIconKey,
            LogoColorKey = board.LogoColorKey,
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

    private static IQueryable<Board> ApplyBoardListFilters(IQueryable<Board> query, int userId, BoardListQueryDto request)
    {
        string membership = NormalizeMembershipFilter(request.Membership);

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            string search = request.Q.Trim();
            query = query.Where(board =>
                EF.Functions.Like(board.Title, $"%{search}%") ||
                EF.Functions.Like(board.Description, $"%{search}%"));
        }

        query = membership switch
        {
            "owned" => query.Where(board => board.Memberships.Any(membership => membership.UserId == userId && membership.Role == BoardRole.Owner)),
            "shared" => query.Where(board => board.Memberships.Any(membership => membership.UserId == userId && membership.Role == BoardRole.Member)),
            _ => query,
        };

        return query;
    }

    private static IQueryable<Board> ApplyBoardListSorting(IQueryable<Board> query, BoardListQueryDto request)
    {
        return NormalizeBoardSort(request.Sort) switch
        {
            "nameAsc" => query.OrderBy(board => board.Title).ThenByDescending(board => board.CreatedAt),
            "nameDesc" => query.OrderByDescending(board => board.Title).ThenByDescending(board => board.CreatedAt),
            _ => query.OrderByDescending(board => board.CreatedAt),
        };
    }

    private static IQueryable<TaskEntity> ApplyBoardTaskListFilters(
        IQueryable<TaskEntity> query,
        int currentUserId,
        BoardTaskListQueryDto request)
    {
        bool isBacklogScope = string.Equals(request.Scope, "backlog", StringComparison.OrdinalIgnoreCase);
        query = isBacklogScope
            ? query.Where(task => task.Status.Title == "backlog")
            : query.Where(task => task.Status.Title != "backlog");

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            string search = request.Q.Trim();
            query = query.Where(task =>
                EF.Functions.Like(task.Title, $"%{search}%") ||
                task.LabeledTasks.Any(labeledTask => EF.Functions.Like(labeledTask.Label.Title, $"%{search}%")));
        }

        if (request.LabelIds.Count > 0)
        {
            query = query.Where(task => task.LabeledTasks.Any(labeledTask => request.LabelIds.Contains(labeledTask.LabelId)));
        }

        if (string.Equals(request.QuickFilter, "assigned", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(task => task.AssigneeId == currentUserId);
        }
        else if (string.Equals(request.QuickFilter, "due", StringComparison.OrdinalIgnoreCase))
        {
            DateTime utcToday = DateTime.UtcNow.Date;
            int daysSinceMonday = ((int)utcToday.DayOfWeek + 6) % 7;
            DateTime startOfWeek = utcToday.AddDays(-daysSinceMonday);
            DateTime endOfWeek = startOfWeek.AddDays(7);

            query = query.Where(task =>
                task.DueDate.HasValue &&
                task.DueDate.Value >= startOfWeek &&
                task.DueDate.Value < endOfWeek);
        }

        if (isBacklogScope)
        {
            if (string.Equals(request.StageFilter, "waiting", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(task => !task.IsQueued);
            }
            else if (string.Equals(request.StageFilter, "queued", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(task => task.IsQueued);
            }
        }

        return query;
    }

    private static IQueryable<TaskEntity> ApplyBoardTaskListSorting(
        IQueryable<TaskEntity> query,
        BoardTaskListQueryDto request)
    {
        bool isDescending = string.Equals(request.Direction, "desc", StringComparison.OrdinalIgnoreCase);
        string sortKey = string.IsNullOrWhiteSpace(request.Sort)
            ? "updated"
            : request.Sort.Trim().ToLowerInvariant();

        return sortKey switch
        {
            "priority" => isDescending
                ? query
                    .OrderByDescending(task => task.Priority == Priority.Critical)
                    .ThenByDescending(task => task.Priority == Priority.High)
                    .ThenByDescending(task => task.Priority == Priority.Medium)
                    .ThenBy(task => task.Title)
                : query
                    .OrderByDescending(task => task.Priority == null)
                    .ThenByDescending(task => task.Priority == Priority.Low)
                    .ThenByDescending(task => task.Priority == Priority.Medium)
                    .ThenByDescending(task => task.Priority == Priority.High)
                    .ThenBy(task => task.Title),
            "title" => isDescending
                ? query.OrderByDescending(task => task.Title).ThenByDescending(task => task.Id)
                : query.OrderBy(task => task.Title).ThenByDescending(task => task.Id),
            "status" => isDescending
                ? query
                    .OrderByDescending(task => task.Status.Title == "done")
                    .ThenByDescending(task => task.Status.Title == "inReview")
                    .ThenByDescending(task => task.Status.Title == "inProgress")
                    .ThenByDescending(task => task.Status.Title == "todo")
                    .ThenByDescending(task => task.Id)
                : query
                    .OrderByDescending(task => task.Status.Title == "backlog")
                    .ThenByDescending(task => task.Status.Title == "todo")
                    .ThenByDescending(task => task.Status.Title == "inProgress")
                    .ThenByDescending(task => task.Status.Title == "inReview")
                    .ThenByDescending(task => task.Id),
            "readiness" => isDescending
                ? query.OrderByDescending(task => task.IsQueued).ThenByDescending(task => task.Id)
                : query.OrderBy(task => task.IsQueued).ThenByDescending(task => task.Id),
            "storypoints" => isDescending
                ? query.OrderByDescending(task => task.StoryPoints ?? int.MinValue).ThenBy(task => task.Title)
                : query.OrderBy(task => task.StoryPoints ?? int.MaxValue).ThenBy(task => task.Title),
            "assignee" => isDescending
                ? query.OrderByDescending(task => task.Assignee != null ? task.Assignee.FirstName + " " + task.Assignee.LastName : "zzzzzz").ThenBy(task => task.Title)
                : query.OrderBy(task => task.Assignee != null ? task.Assignee.FirstName + " " + task.Assignee.LastName : "zzzzzz").ThenBy(task => task.Title),
            _ => query.OrderByDescending(task => task.Id),
        };
    }

    private static string NormalizeMembershipFilter(string? value)
    {
        return value?.Trim().ToLowerInvariant() switch
        {
            "owned" => "owned",
            "shared" => "shared",
            _ => "all",
        };
    }

    private static string NormalizeBoardSort(string? value)
    {
        return value?.Trim() switch
        {
            "nameAsc" => "nameAsc",
            "nameDesc" => "nameDesc",
            _ => "newest",
        };
    }

    private static BoardListItemDto ToBoardListItemDto(Board board)
    {
        return new BoardListItemDto
        {
            Id = board.Id,
            Name = board.Title,
            Description = board.Description,
            LogoIconKey = board.LogoIconKey,
            LogoColorKey = board.LogoColorKey,
            CreatedAt = board.CreatedAt,
            CreatorUserId = board.CreatorId,
            MemberCount = board.Memberships.Count,
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
            IsQueued = task.IsQueued,
            LabelIds = task.LabeledTasks
                .Select(labeledTask => labeledTask.LabelId)
                .OrderBy(id => id)
                .ToList(),
            AssigneeUserId = task.AssigneeId,
            Assignee = task.AssigneeId.HasValue && memberLookup.TryGetValue(task.AssigneeId.Value, out BoardMemberDto? member)
                ? member
                : null,
            ReporterUserId = task.ReporterId,
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
