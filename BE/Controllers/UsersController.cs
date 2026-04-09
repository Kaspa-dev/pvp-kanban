using BE.Data;
using BE.DTOs;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        "backlog-planning",
        "backlog-active-sprint",
        "projects-empty-state",
        "projects-board-list",
    ];

    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
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
