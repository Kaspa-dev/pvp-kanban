using BE.Data;
using BE.DTOs;
using BE.Models;
using BE.Options;
using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Json;

namespace BE.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
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

    public UsersController(AppDbContext context, IOptions<AuthOptions> authOptions)
    {
        _context = context;
        _authOptions = authOptions.Value;
    }

    // GET api/users/search?q=query&limit=8
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<UserSearchDto>>> SearchUsers(
        [FromQuery] string? q,
        [FromQuery] int limit = 8,
        CancellationToken cancellationToken = default)
    {
        string query = q?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(Array.Empty<UserSearchDto>());
        }

        int cappedLimit = Math.Clamp(limit, 1, 20);
        string normalizedQuery = query.ToLower();

        var users = await _context.Users
            .AsNoTracking()
            .Where(u =>
                u.Username.ToLower().Contains(normalizedQuery) ||
                u.Email.ToLower().Contains(normalizedQuery) ||
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

        var completedTasks = await _context.Tasks
            .Where(task => task.AssigneeId == userId && task.Status.Title == "done")
            .Select(task => task.StoryPoints)
            .ToListAsync(cancellationToken);

        int tasksCompleted = completedTasks.Count;
        int xp = completedTasks.Sum(storyPoints => (storyPoints ?? 0) * 10);

        return Ok(new UserProgressDto
        {
            Xp = xp,
            Level = CalculateLevel(xp),
            TasksCompleted = tasksCompleted,
        });
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

    private static int CalculateLevel(int xp)
    {
        int[] xpPerLevel =
        [
            0,
            20,
            60,
            130,
            240,
            400,
            620,
            910,
            1280,
            1740,
            2300,
            2970,
            3760,
            4680,
            5740,
        ];

        int level = 1;
        for (int index = xpPerLevel.Length - 1; index >= 0; index -= 1)
        {
            if (xp >= xpPerLevel[index])
            {
                level = index + 1;
                break;
            }
        }

        return level;
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

        if (string.IsNullOrWhiteSpace(username))
        {
            return "Username is required.";
        }

        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
        {
            return "First name and last name are required.";
        }

        return null;
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
