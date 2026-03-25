namespace BE.Models;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int CreatorId { get; set; }
    public int TaskId { get; set; }

    public User Creator { get; set; } = null!;
    public Models.Task Task { get; set; } = null!;
    public ICollection<Models.Attachment> Attachments { get; set; } = new List<Models.Attachment>();
}