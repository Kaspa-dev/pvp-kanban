namespace BE.Models;

public class TaskStatus
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int BoardId { get; set; }

    public Board Board { get; set; } = null!;
    public ICollection<Models.Task> Tasks { get; set; } = new List<Models.Task>();
    public ICollection<Models.Attachment> Attachments { get; set; } = new List<Models.Attachment>();
}