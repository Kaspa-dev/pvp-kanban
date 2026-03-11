using BE.Data;
using BE.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers;

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
}
