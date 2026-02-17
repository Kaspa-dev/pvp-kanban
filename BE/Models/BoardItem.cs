namespace BE.Models;

public class BoardItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public BoardItemStatus Status { get; set; } = BoardItemStatus.Todo;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum BoardItemStatus
{
    Todo,
    InProgress,
    Done
}
