namespace BE.Models;

public class XpEvent
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int BoardId { get; set; }
    public int? TaskId { get; set; }
    public string Type { get; set; } = string.Empty;
    public int XpAmount { get; set; }
    public string AwardKey { get; set; } = string.Empty;
    public int? ReversesXpEventId { get; set; }
    public string? SourceSnapshotJson { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Board Board { get; set; } = null!;
    public Task? Task { get; set; }
    public XpEvent? ReversedXpEvent { get; set; }
}
