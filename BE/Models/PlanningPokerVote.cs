namespace BE.Models;

public class PlanningPokerVote
{
    public int Id { get; set; }
    public int SessionTaskId { get; set; }
    public int ParticipantId { get; set; }
    public int CardValue { get; set; }
    public DateTime SubmittedAtUtc { get; set; }

    public PlanningPokerSessionTask SessionTask { get; set; } = null!;
    public PlanningPokerParticipant Participant { get; set; } = null!;
}
