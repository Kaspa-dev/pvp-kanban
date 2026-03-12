using System.Reflection.Metadata;

namespace BE.Models;

public class Task
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? StoryPoints { get; set; } = null;
    public int StatusId { get; set; }
    public int? AssigneeId { get; set; } = null;
    public int ReporterId { get; set; }
    public int? SprintId { get; set; } = null;
    public int? TeamId { get; set; } = null;

    public Models.TaskStatus Status { get; set; } = null!;
    public User? Assignee { get; set; } = null;
    public User Reporter { get; set; } = null!;
    public Sprint? Sprint { get; set; } = null;
    public OrganizationalUnit? AssignedTeam { get; set; } = null;
    public Priority? Priority { get; set; } = null;
    public Type? Type { get; set; } = null;
    public ICollection<LabeledTasks> LabeledTasks { get; set; } = new List<LabeledTasks>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}

public enum Priority
{
    Low,
    Medium,
    High,
    Critical
}

public enum Type
{
    Story,
    Task,
    Spike,
    Bug,
    Feature,
    Epic,
}