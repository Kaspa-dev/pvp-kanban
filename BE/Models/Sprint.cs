namespace BE.Models;

public class Sprint
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int BoardId { get; set; }
    public SprintStatus Status { get; set; } = SprintStatus.Planned;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public Board Board { get; set; } = null!;
    public ICollection<Models.Task> Tasks { get; set; } = new List<Models.Task>();
}

public enum SprintStatus
{
    Planned,
    Active,
    Completed,
}
