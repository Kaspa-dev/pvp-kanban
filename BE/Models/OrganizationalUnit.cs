namespace BE.Models;

public class OrganizationalUnit
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Owner { get; set; } = null!;
    public ICollection<OrganizationalUnitMember> Members { get; set; } = new List<OrganizationalUnitMember>();
}
