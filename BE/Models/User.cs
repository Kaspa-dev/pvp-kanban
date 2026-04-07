namespace BE.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin { get; set; }

    public ICollection<OrganizationalUnitMember> Memberships { get; set; } = new List<OrganizationalUnitMember>();
    public ICollection<OrganizationalUnit> OwnedUnits { get; set; } = new List<OrganizationalUnit>();
    public ICollection<Board> Boards { get; set; } = new List<Board>();
    public ICollection<Models.Task> AssignedTasks { get; set; } = new List<Models.Task>();
    public ICollection<Models.Task> CreatedTasks { get; set; } = new List<Models.Task>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
