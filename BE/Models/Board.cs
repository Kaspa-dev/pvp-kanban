namespace BE.Models;

public class Board
{
    public const string DefaultLogoIconKey = "folder";
    public const string DefaultLogoColorKey = "slate";

    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoIconKey { get; set; } = DefaultLogoIconKey;
    public string LogoColorKey { get; set; } = DefaultLogoColorKey;
    public int CreatorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Creator {get; set;} = null!;
    public ICollection<BoardMembership> Memberships { get; set; } = new List<BoardMembership>();
    public ICollection<BoardFavorite> Favorites { get; set; } = new List<BoardFavorite>();
    public ICollection<OrganizationalUnit> Teams { get; set; } = new List<OrganizationalUnit>();
    public ICollection<Models.TaskStatus> TaskStatuses { get; set; } = new List<Models.TaskStatus>();
    public ICollection<Models.Task> Backlog { get; set; } = new List<Models.Task>();
    public ICollection<Label> Labels { get; set; } = new List<Label>();
    public ICollection<PlanningPokerSession> PlanningPokerSessions { get; set; } = new List<PlanningPokerSession>();
}
