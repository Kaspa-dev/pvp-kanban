namespace BE.Models;

public class OrganizationalUnitMember
{
    public int Id { get; set; }
    public int OrganizationalUnitId { get; set; }
    public int UserId { get; set; }
    public OuMemberRole Role { get; set; } = OuMemberRole.Member;
    public OuMemberStatus Status { get; set; } = OuMemberStatus.Invited;
    public DateTime InvitedAt { get; set; } = DateTime.UtcNow;
    public DateTime? JoinedAt { get; set; }

    public OrganizationalUnit OrganizationalUnit { get; set; } = null!;
    public User User { get; set; } = null!;
}

public enum OuMemberRole
{
    Member,
    Admin
}

public enum OuMemberStatus
{
    Invited,
    Active
}
