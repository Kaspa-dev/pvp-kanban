using BE.DTOs;
using BoardEntity = BE.Models.Board;
using TaskEntity = BE.Models.Task;

namespace BE.Services;

public interface IGamificationService
{
    Task<UserGamificationSummaryDto> GetUserGamificationSummaryAsync(int userId, CancellationToken cancellationToken);
    Task<UserProgressDto> GetUserProgressAsync(int userId, CancellationToken cancellationToken);
    Task<BoardLevelLeaderboardDto> GetBoardLevelLeaderboardAsync(BoardEntity board, int currentUserId, CancellationToken cancellationToken);
    Task<Dictionary<int, int>> GetUserLevelsAsync(IEnumerable<int> userIds, CancellationToken cancellationToken);
    Task ApplyTaskTransitionXpAsync(TaskEntity task, string previousStatusKey, string nextStatusKey, CancellationToken cancellationToken);
}
