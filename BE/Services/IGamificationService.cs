using BE.DTOs;
using TaskEntity = BE.Models.Task;

namespace BE.Services;

public interface IGamificationService
{
    Task<UserGamificationSummaryDto> GetUserGamificationSummaryAsync(int userId, CancellationToken cancellationToken);
    Task<UserProgressDto> GetUserProgressAsync(int userId, CancellationToken cancellationToken);
    Task ApplyTaskTransitionXpAsync(TaskEntity task, string previousStatusKey, string nextStatusKey, CancellationToken cancellationToken);
}
