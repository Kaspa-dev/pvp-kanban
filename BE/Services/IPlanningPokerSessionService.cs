using BE.DTOs;

namespace BE.Services;

public interface IPlanningPokerSessionService
{
    Task<PlanningPokerSessionDto> CreateSessionAsync(int boardId, int hostUserId, CancellationToken cancellationToken);
    Task<PlanningPokerSessionDto> GetBoardSessionAsync(int boardId, int userId, CancellationToken cancellationToken);
    Task<PlanningPokerSessionDto> GetSessionByTokenAsync(string joinToken, int? userId, string? participantToken, CancellationToken cancellationToken);
    Task<PlanningPokerJoinResult> JoinSessionAsync(string joinToken, int? userId, string? participantToken, string? guestDisplayName, CancellationToken cancellationToken);
    Task<PlanningPokerSessionDto> SubmitVoteAsync(string joinToken, int? userId, string? participantToken, int cardValue, CancellationToken cancellationToken);
    Task<PlanningPokerSessionDto> RevealVotesAsync(string joinToken, int? userId, string? participantToken, CancellationToken cancellationToken);
    Task<BoardTaskDto> ApplyRecommendationAsync(int boardId, int sessionTaskId, int userId, CancellationToken cancellationToken);
}

public sealed record PlanningPokerJoinResult(PlanningPokerSessionDto Session, string ParticipantToken);

public abstract class PlanningPokerException : Exception
{
    protected PlanningPokerException(string message) : base(message) { }
}

public sealed class PlanningPokerNotFoundException : PlanningPokerException
{
    public PlanningPokerNotFoundException(string message) : base(message) { }
}

public sealed class PlanningPokerAccessDeniedException : PlanningPokerException
{
    public PlanningPokerAccessDeniedException(string message) : base(message) { }
}

public sealed class PlanningPokerValidationException : PlanningPokerException
{
    public PlanningPokerValidationException(string message) : base(message) { }
}
