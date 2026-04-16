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
