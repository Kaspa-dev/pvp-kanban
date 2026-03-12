namespace BE.Models;

public class Board
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int CreatorId { get; set; }
    
    public User Creator {get; set;} = null!;
    public ICollection<OrganizationalUnit> Teams { get; set; } = new List<OrganizationalUnit>();
    public ICollection<Models.TaskStatus> TaskStatuses { get; set; } = new List<Models.TaskStatus>();
    public ICollection<Models.Task> Backlog { get; set; } = new List<Models.Task>();
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public ICollection<Label> Labels { get; set; } = new List<Label>();
}