namespace BE.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
    public List<MembershipDto> Memberships { get; set; } = new();
}

public class MembershipDto
{
    public int Id { get; set; }
    public int OrganizationalUnitId { get; set; }
    public string OrganizationalUnitName { get; set; } = string.Empty;
    public string OrganizationalUnitCode { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime InvitedAt { get; set; }
    public DateTime? JoinedAt { get; set; }
}
