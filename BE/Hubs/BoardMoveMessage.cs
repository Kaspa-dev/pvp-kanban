namespace BE.Hubs;

public class BoardMoveMessage
{
    public string BoardId { get; set; } = string.Empty;
    public string CardId { get; set; } = string.Empty;
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string MovedBy { get; set; } = string.Empty;
    public string MovedAt { get; set; } = string.Empty;
}
