namespace BE.Models;

public class Attachment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int CommentId { get; set; }

    public Comment Comment { get; set; } = null!;
}