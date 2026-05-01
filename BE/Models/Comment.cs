namespace BE.Models;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int AuthorUserId { get; set; }
    public int TaskId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public User Author { get; set; } = null!;
    public Models.Task Task { get; set; } = null!;
    public ICollection<Models.Attachment> Attachments { get; set; } = new List<Models.Attachment>();
}
