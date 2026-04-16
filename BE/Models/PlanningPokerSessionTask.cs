namespace BE.Models;

public class PlanningPokerSessionTask
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int TaskId { get; set; }
    public int Position { get; set; }
    public string RoundState { get; set; } = "voting";
    public int? RecommendedStoryPoints { get; set; }

    public PlanningPokerSession Session { get; set; } = null!;
    public Task Task { get; set; } = null!;
    public ICollection<PlanningPokerVote> Votes { get; set; } = new List<PlanningPokerVote>();
}
