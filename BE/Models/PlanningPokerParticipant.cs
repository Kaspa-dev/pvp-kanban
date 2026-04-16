namespace BE.Models;

public class PlanningPokerParticipant
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int? UserId { get; set; }
    public string ParticipantToken { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsHost { get; set; }
    public bool IsGuest { get; set; }
    public DateTime LastSeenAtUtc { get; set; }

    public PlanningPokerSession Session { get; set; } = null!;
    public User? User { get; set; }
}
