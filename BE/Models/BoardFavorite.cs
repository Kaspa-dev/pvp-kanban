namespace BE.Models;

public class BoardFavorite
{
    public int Id { get; set; }
    public int BoardId { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Board Board { get; set; } = null!;
    public User User { get; set; } = null!;
}
