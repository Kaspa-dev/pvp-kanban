using BE.DTOs;

namespace BE.Services;

public interface IPlanningPokerSessionService
{
    Task<PlanningPokerSessionDto> CreateSessionAsync(int boardId, int hostUserId, CancellationToken cancellationToken);
    Task<PlanningPokerSessionDto> GetBoardSessionAsync(int boardId, int userId, CancellationToken cancellationToken);
    Task<PlanningPokerSessionDto> GetSessionByTokenAsync(string joinToken, CancellationToken cancellationToken);
    Task<BoardTaskDto> ApplyRecommendationAsync(int boardId, int sessionTaskId, int userId, CancellationToken cancellationToken);
}
