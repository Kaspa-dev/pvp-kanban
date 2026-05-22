using BE.Data;
using BE.DTOs;
using BE.Models;
using BE.Options;
using BE.Services;
using BE.Validation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Json;
using TaskEntity = BE.Models.Task;

namespace BE.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private const int DefaultTaskPageSize = 10;
    private const int MaxTaskPageSize = 24;
    private static readonly JsonSerializerOptions UserPreferenceJsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly HashSet<string> AllowedCoachmarkFlows =
    [
        "board-no-active-sprint",
        "board-active-sprint",
        "list-no-active-sprint",
        "list-active-sprint",
        "staging-planning",
        "staging-active-sprint",
        "backlog-overview",
        "history-overview",
        "projects-empty-state",
        "projects-board-list",
    ];
    private static readonly Dictionary<string, string> LegacyCoachmarkFlowAliases = new(StringComparer.Ordinal)
    {
        ["backlog-planning"] = "staging-planning",
        ["backlog-active-sprint"] = "staging-active-sprint",
    };

    private readonly AppDbContext _context;
    private readonly AuthOptions _authOptions;
    private readonly IGamificationService _gamificationService;
    private readonly IUserMilestoneService _userMilestoneService;

    public UsersController(
        AppDbContext context,
        IOptions<AuthOptions> authOptions,
        IGamificationService gamificationService,
        IUserMilestoneService userMilestoneService)
    {
        _context = context;
        _authOptions = authOptions.Value;
        _gamificationService = gamificationService;
        _userMilestoneService = userMilestoneService;
    }

    // GET api/users/search?q=query&limit=3
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<UserSearchDto>>> SearchUsers(
        [FromQuery] string? q,
        [FromQuery] int limit = 3,
        CancellationToken cancellationToken = default)
    {
        string query = q?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(Array.Empty<UserSearchDto>());
        }

        int cappedLimit = Math.Clamp(limit, 1, 3);
        string normalizedQuery = query.ToLower();

        var users = await _context.Users
            .AsNoTracking()
            .Where(u =>
                u.Username.ToLower().Contains(normalizedQuery) ||
                (u.Email.Contains("@") &&
                 u.Email.Substring(0, u.Email.IndexOf("@")).ToLower().Contains(normalizedQuery)) ||
                u.FirstName.ToLower().Contains(normalizedQuery) ||
                u.LastName.ToLower().Contains(normalizedQuery) ||
                (u.FirstName + " " + u.LastName).ToLower().Contains(normalizedQuery))
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Take(cappedLimit)
            .Select(u => new UserSearchDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                DisplayName = (u.FirstName + " " + u.LastName).Trim(),
            })
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    // GET api/users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        return await _context.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                DisplayName = $"{u.FirstName} {u.LastName}".Trim(),
                CreatedAt = u.CreatedAt,
                LastLogin = u.LastLogin,
                Memberships = u.Memberships.Select(m => new MembershipDto
                {
                    Id = m.Id,
                    OrganizationalUnitId = m.OrganizationalUnitId,
                    OrganizationalUnitName = m.OrganizationalUnit.Name,
                    OrganizationalUnitCode = m.OrganizationalUnit.Code,
                    Role = m.Role.ToString(),
                    Status = m.Status.ToString(),
                    InvitedAt = m.InvitedAt,
                    JoinedAt = m.JoinedAt
                }).ToList()
            })
            .ToListAsync();
    }

    // GET api/users/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                DisplayName = $"{u.FirstName} {u.LastName}".Trim(),
                CreatedAt = u.CreatedAt,
                LastLogin = u.LastLogin,
                Memberships = u.Memberships.Select(m => new MembershipDto
                {
                    Id = m.Id,
                    OrganizationalUnitId = m.OrganizationalUnitId,
                    OrganizationalUnitName = m.OrganizationalUnit.Name,
                    OrganizationalUnitCode = m.OrganizationalUnit.Code,
                    Role = m.Role.ToString(),
                    Status = m.Status.ToString(),
                    InvitedAt = m.InvitedAt,
                    JoinedAt = m.JoinedAt
                }).ToList()
            })
            .FirstOrDefaultAsync();

        return user is null ? NotFound() : Ok(user);
    }

    // GET api/users/me/progress
    [HttpGet("me/progress")]
    public async Task<ActionResult<UserProgressDto>> GetMyProgress(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        UserProgressDto progress = await _gamificationService.GetUserProgressAsync(userId, cancellationToken);
        return Ok(progress);
    }

    // GET api/users/me/tasks?scope=active
    [HttpGet("me/tasks")]
    public async Task<ActionResult<PagedMyTaskListResponseDto>> GetMyTasks(
        [FromQuery] MyTaskListQueryDto query,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        string scope = NormalizeMyTaskScope(query.Scope);

        IQueryable<TaskEntity> tasksQuery = _context.Tasks
            .AsNoTracking()
            .Include(task => task.Status)
            .Include(task => task.LabeledTasks)
            .Include(task => task.Board)
                .ThenInclude(board => board.Memberships)
                    .ThenInclude(membership => membership.User)
            .Where(task =>
                task.AssigneeId == userId &&
                (task.Board.CreatorId == userId || task.Board.Memberships.Any(membership => membership.UserId == userId)));

        tasksQuery = ApplyMyTaskListFilters(tasksQuery, scope, query);

        int pageSize = Math.Clamp(query.PageSize <= 0 ? DefaultTaskPageSize : query.PageSize, 1, MaxTaskPageSize);
        int totalItems = await tasksQuery.CountAsync(cancellationToken);
        int totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        int page = Math.Max(query.Page, 1);
        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

        List<TaskEntity> taskEntities = await ApplyMyTaskListSorting(tasksQuery, query)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        Dictionary<int, int> userLevels = await _gamificationService.GetUserLevelsAsync(
            taskEntities
                .SelectMany(task => task.Board.Memberships)
                .Select(membership => membership.UserId),
            cancellationToken);

        List<MyTaskItemDto> tasks = taskEntities
            .Select(task => ToMyTaskItemDto(task, userLevels))
            .ToList();

        return Ok(new PagedMyTaskListResponseDto
        {
            Items = tasks,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
        });
    }

    // GET api/users/me/gamification-summary
    [HttpGet("me/gamification-summary")]
    public async Task<ActionResult<UserGamificationSummaryDto>> GetMyGamificationSummary(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        UserGamificationSummaryDto summary = await _gamificationService.GetUserGamificationSummaryAsync(userId, cancellationToken);
        return Ok(summary);
    }

    // GET api/users/me/milestones
    [HttpGet("me/milestones")]
    public async Task<ActionResult<UserMilestonesResponseDto>> GetMyMilestones(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        UserMilestonesResponseDto response = await _userMilestoneService.GetUserMilestonesAsync(userId, cancellationToken);
        return Ok(response);
    }

    // GET api/users/me/preferences
    [HttpGet("me/preferences")]
    public async Task<ActionResult<UserPreferencesDto>> GetMyPreferences(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        string? preferencesJson = await _context.Users
            .Where(user => user.Id == userId)
            .Select(user => user.PreferencesJson)
            .SingleOrDefaultAsync(cancellationToken);

        return Ok(ParsePreferences(preferencesJson));
    }

    // PUT api/users/me/preferences
    [HttpPut("me/preferences")]
    public async Task<ActionResult<UserPreferencesDto>> UpdateMyPreferences(
        UpdateUserPreferencesRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        UserPreferencesDto normalizedPreferences = NormalizePreferences(request);
        user.PreferencesJson = JsonSerializer.Serialize(normalizedPreferences, UserPreferenceJsonOptions);

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(normalizedPreferences);
    }

    // PUT api/users/me
    [HttpPut("me")]
    public async Task<ActionResult<AuthUserDto>> UpdateMyProfile(
        UpdateCurrentUserRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        string email = request.Email.Trim().ToLowerInvariant();
        string username = request.Username.Trim();
        string firstName = request.FirstName.Trim();
        string lastName = request.LastName.Trim();

        string? validationError = ValidateProfileUpdate(email, username, firstName, lastName);
        if (validationError is not null)
        {
            return BadRequest(new AuthErrorDto { Message = validationError });
        }

        var user = await _context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        if (await _context.Users.AnyAsync(candidate => candidate.Id != userId && candidate.Email == email, cancellationToken))
        {
            return Conflict(new AuthErrorDto { Message = "Email is already registered." });
        }

        if (await _context.Users.AnyAsync(candidate => candidate.Id != userId && candidate.Username == username, cancellationToken))
        {
            return Conflict(new AuthErrorDto { Message = "Username is already taken." });
        }

        user.Email = email;
        user.Username = username;
        user.FirstName = firstName;
        user.LastName = lastName;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ToAuthUserDto(user));
    }

    // POST api/users/me/change-password
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangeMyPassword(
        ChangePasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
        {
            return BadRequest(new AuthErrorDto { Message = "All password fields are required." });
        }

        if (request.NewPassword.Length < 8)
        {
            return BadRequest(new AuthErrorDto { Message = "Password must be at least 8 characters long." });
        }

        if (request.NewPassword != request.ConfirmNewPassword)
        {
            return BadRequest(new AuthErrorDto { Message = "New password confirmation does not match." });
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            return BadRequest(new AuthErrorDto { Message = "Choose a different password from your current one." });
        }

        var user = await _context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        if (!PasswordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return Unauthorized(new AuthErrorDto { Message = "Current password is incorrect." });
        }

        user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // DELETE api/users/me
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyAccount(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        if (user is null)
        {
            ClearRefreshTokenCookie();
            return Unauthorized();
        }

        var blocked = new DeleteCurrentUserBlockedDto
        {
            OwnedBoardsCount = await _context.Boards.CountAsync(board => board.CreatorId == userId, cancellationToken),
            OwnedTeamsCount = await _context.OrganizationalUnits.CountAsync(team => team.OwnerId == userId, cancellationToken),
            ReportedTasksCount = await _context.Tasks.CountAsync(task => task.ReporterId == userId, cancellationToken),
        };

        if (blocked.OwnedBoardsCount > 0 || blocked.OwnedTeamsCount > 0 || blocked.ReportedTasksCount > 0)
        {
            blocked.Message = "Account deletion is blocked until you transfer or remove owned boards, owned teams, and reported tasks.";
            return Conflict(blocked);
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);
        ClearRefreshTokenCookie();
        return NoContent();
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

    private static string? ValidateProfileUpdate(string email, string username, string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return "Email is required.";
        }

        string? usernameValidation = UserIdentityValidation.ValidateUsername(username);
        if (usernameValidation is not null)
        {
            return usernameValidation;
        }

        string? firstNameValidation = UserIdentityValidation.ValidateFirstName(firstName);
        if (firstNameValidation is not null)
        {
            return firstNameValidation;
        }

        string? lastNameValidation = UserIdentityValidation.ValidateLastName(lastName);
        if (lastNameValidation is not null)
        {
            return lastNameValidation;
        }

        return null;
    }

    private static string NormalizeMyTaskScope(string? scope)
    {
        return string.Equals(scope?.Trim(), "all", StringComparison.OrdinalIgnoreCase)
            ? "all"
            : "active";
    }

    private static IQueryable<TaskEntity> ApplyMyTaskListFilters(
        IQueryable<TaskEntity> query,
        string scope,
        MyTaskListQueryDto request)
    {
        if (scope == "active")
        {
            query = query.Where(task => task.Status.Title != "done");
        }

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            string search = request.Q.Trim();
            query = query.Where(task =>
                EF.Functions.Like(task.Title, $"%{search}%") ||
                EF.Functions.Like(task.Description, $"%{search}%") ||
                EF.Functions.Like(task.Board.Title, $"%{search}%"));
        }

        if (string.Equals(request.QuickFilter, "due", StringComparison.OrdinalIgnoreCase))
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
        else if (string.Equals(request.QuickFilter, "overdue", StringComparison.OrdinalIgnoreCase))
        {
            DateTime utcToday = DateTime.UtcNow.Date;

            query = query.Where(task =>
                task.DueDate.HasValue &&
                task.DueDate.Value < utcToday);
        }

        List<Priority> priorityFilters = new();
        bool includeNoPriority = false;
        foreach (string priorityFilter in request.Priorities.Select(value => value.Trim().ToLowerInvariant()).Distinct())
        {
            if (priorityFilter == "none")
            {
                includeNoPriority = true;
                continue;
            }

            if (TryParsePriority(priorityFilter, out Priority? priority) && priority.HasValue)
            {
                priorityFilters.Add(priority.Value);
            }
        }

        if (priorityFilters.Count > 0 || includeNoPriority)
        {
            bool includeLowPriority = priorityFilters.Contains(Priority.Low);
            bool includeMediumPriority = priorityFilters.Contains(Priority.Medium);
            bool includeHighPriority = priorityFilters.Contains(Priority.High);
            bool includeCriticalPriority = priorityFilters.Contains(Priority.Critical);

            query = query.Where(task =>
                includeLowPriority && task.Priority == Priority.Low ||
                includeMediumPriority && task.Priority == Priority.Medium ||
                includeHighPriority && task.Priority == Priority.High ||
                includeCriticalPriority && task.Priority == Priority.Critical ||
                includeNoPriority && !task.Priority.HasValue);
        }

        List<BE.Models.Type> taskTypeFilters = new();
        bool includeNoTaskType = false;
        foreach (string taskTypeFilter in request.TaskTypes.Select(value => value.Trim().ToLowerInvariant()).Distinct())
        {
            if (taskTypeFilter == "none")
            {
                includeNoTaskType = true;
                continue;
            }

            if (TryParseTaskType(taskTypeFilter, out BE.Models.Type? taskType) && taskType.HasValue)
            {
                taskTypeFilters.Add(taskType.Value);
            }
        }

        if (taskTypeFilters.Count > 0 || includeNoTaskType)
        {
            bool includeStoryType = taskTypeFilters.Contains(BE.Models.Type.Story);
            bool includeTaskType = taskTypeFilters.Contains(BE.Models.Type.Task);
            bool includeSpikeType = taskTypeFilters.Contains(BE.Models.Type.Spike);
            bool includeBugType = taskTypeFilters.Contains(BE.Models.Type.Bug);
            bool includeFeatureType = taskTypeFilters.Contains(BE.Models.Type.Feature);
            bool includeEpicType = taskTypeFilters.Contains(BE.Models.Type.Epic);

            query = query.Where(task =>
                includeStoryType && task.Type == BE.Models.Type.Story ||
                includeTaskType && task.Type == BE.Models.Type.Task ||
                includeSpikeType && task.Type == BE.Models.Type.Spike ||
                includeBugType && task.Type == BE.Models.Type.Bug ||
                includeFeatureType && task.Type == BE.Models.Type.Feature ||
                includeEpicType && task.Type == BE.Models.Type.Epic ||
                includeNoTaskType && !task.Type.HasValue);
        }

        return query;
    }

    private static IQueryable<TaskEntity> ApplyMyTaskListSorting(
        IQueryable<TaskEntity> query,
        MyTaskListQueryDto request)
    {
        bool isDescending = string.Equals(request.Direction, "desc", StringComparison.OrdinalIgnoreCase);
        string sortKey = string.IsNullOrWhiteSpace(request.Sort)
            ? "duedate"
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
            "board" => isDescending
                ? query.OrderByDescending(task => task.Board.Title).ThenBy(task => task.Title)
                : query.OrderBy(task => task.Board.Title).ThenBy(task => task.Title),
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
            "storypoints" => isDescending
                ? query.OrderByDescending(task => task.StoryPoints ?? int.MinValue).ThenBy(task => task.Title)
                : query.OrderBy(task => task.StoryPoints ?? int.MaxValue).ThenBy(task => task.Title),
            "duedate" => isDescending
                ? query.OrderByDescending(task => task.DueDate.HasValue).ThenByDescending(task => task.DueDate).ThenBy(task => task.Title)
                : query.OrderByDescending(task => task.DueDate.HasValue).ThenBy(task => task.DueDate).ThenBy(task => task.Title),
            _ => query.OrderByDescending(task => task.DueDate.HasValue).ThenBy(task => task.DueDate).ThenBy(task => task.Title),
        };
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

    private static AuthUserDto ToAuthUserDto(User user)
    {
        return new AuthUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            DisplayName = $"{user.FirstName} {user.LastName}".Trim(),
        };
    }

    private static BoardMemberDto ToBoardMemberDto(
        BoardMembership membership,
        IReadOnlyDictionary<int, int>? userLevels = null)
    {
        return new BoardMemberDto
        {
            UserId = membership.UserId,
            Username = membership.User.Username,
            DisplayName = $"{membership.User.FirstName} {membership.User.LastName}".Trim(),
            Email = membership.User.Email,
            Color = membership.Color,
            Role = membership.Role.ToString().ToLowerInvariant(),
            CurrentLevel = userLevels is not null && userLevels.TryGetValue(membership.UserId, out int currentLevel)
                ? currentLevel
                : null,
        };
    }

    private static MyTaskItemDto ToMyTaskItemDto(
        TaskEntity task,
        IReadOnlyDictionary<int, int>? userLevels = null)
    {
        BoardMembership? assigneeMembership = task.AssigneeId.HasValue
            ? task.Board.Memberships.FirstOrDefault(membership => membership.UserId == task.AssigneeId.Value)
            : null;

        return new MyTaskItemDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            StatusKey = task.Status.Title,
            IsQueued = task.IsQueued,
            ColumnPosition = task.ColumnPosition,
            LabelIds = task.LabeledTasks
                .Select(labeledTask => labeledTask.LabelId)
                .OrderBy(labelId => labelId)
                .ToList(),
            AssigneeUserId = task.AssigneeId,
            Assignee = assigneeMembership is null ? null : ToBoardMemberDto(assigneeMembership, userLevels),
            ReporterUserId = task.ReporterId,
            StoryPoints = task.StoryPoints,
            DueDate = task.DueDate?.ToString("yyyy-MM-dd"),
            Priority = task.Priority?.ToString().ToLowerInvariant(),
            TaskType = task.Type?.ToString().ToLowerInvariant(),
            BoardId = task.BoardId,
            BoardName = task.Board.Title,
            BoardLogoIconKey = task.Board.LogoIconKey,
            BoardLogoColorKey = task.Board.LogoColorKey,
        };
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(_authOptions.RefreshTokenCookieName, new CookieOptions
        {
            Path = "/api/auth",
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
        });
    }

    private static UserPreferencesDto ParsePreferences(string? preferencesJson)
    {
        if (string.IsNullOrWhiteSpace(preferencesJson))
        {
            return new UserPreferencesDto();
        }

        try
        {
            UserPreferencesDto? preferences = JsonSerializer.Deserialize<UserPreferencesDto>(preferencesJson, UserPreferenceJsonOptions);
            return NormalizePreferences(preferences);
        }
        catch (JsonException)
        {
            return new UserPreferencesDto();
        }
    }

    private static UserPreferencesDto NormalizePreferences(UpdateUserPreferencesRequestDto? request)
    {
        return NormalizePreferences(request is null
            ? null
            : new UserPreferencesDto
            {
                CoachmarksEnabled = request.CoachmarksEnabled,
                CompletedFlows = request.CompletedFlows,
            });
    }

    private static UserPreferencesDto NormalizePreferences(UserPreferencesDto? preferences)
    {
        List<string> completedFlows = preferences?.CompletedFlows?
            .Select(flowId => LegacyCoachmarkFlowAliases.TryGetValue(flowId, out string? normalizedFlowId)
                ? normalizedFlowId
                : flowId)
            .Where(flowId => !string.IsNullOrWhiteSpace(flowId) && AllowedCoachmarkFlows.Contains(flowId))
            .Distinct(StringComparer.Ordinal)
            .ToList() ?? new List<string>();

        return new UserPreferencesDto
        {
            CoachmarksEnabled = preferences?.CoachmarksEnabled ?? true,
            CompletedFlows = completedFlows,
        };
    }
}
