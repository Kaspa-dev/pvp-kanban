using BE.Data;
using BE.DTOs;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BE.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
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
}
