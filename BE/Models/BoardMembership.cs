namespace BE.Models;

public class BoardMembership
{
    public int Id { get; set; }
    public int BoardId { get; set; }
    public int UserId { get; set; }
    public BoardRole Role { get; set; } = BoardRole.Member;
    public string Color { get; set; } = "#3b82f6";

    public Board Board { get; set; } = null!;
    public User User { get; set; } = null!;
}

public enum BoardRole
{
    Owner,
    Member,
}
