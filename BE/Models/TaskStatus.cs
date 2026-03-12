namespace BE.Models;

public class TaskStatus
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int BoardId { get; set; }
    public int TaskId { get; set; }

    public Board Board { get; set; } = null!;
    public Models.Task Task { get; set; } = null!;
    public ICollection<Models.Attachment> Attachments { get; set; } = new List<Models.Attachment>();
}