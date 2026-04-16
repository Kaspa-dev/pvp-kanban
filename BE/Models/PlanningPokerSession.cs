namespace BE.Models;

public class PlanningPokerSession
{
    public int Id { get; set; }
    public int BoardId { get; set; }
    public int HostUserId { get; set; }
    public string JoinToken { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public int ActiveSessionTaskId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public Board Board { get; set; } = null!;
    public User HostUser { get; set; } = null!;
    public ICollection<PlanningPokerSessionTask> Tasks { get; set; } = new List<PlanningPokerSessionTask>();
    public ICollection<PlanningPokerParticipant> Participants { get; set; } = new List<PlanningPokerParticipant>();
}
