using BE.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BE.Services;

public interface IUserMilestoneService
{
    Task<UserMilestonesResponseDto> GetUserMilestonesAsync(int userId, CancellationToken cancellationToken);
    Task EnsureMilestonesUnlockedAsync(int userId, CancellationToken cancellationToken);
    Task<bool> TryRecoverFromDuplicateWriteAsync(DbUpdateException exception, CancellationToken cancellationToken);
    void StageTaskCompletion(int userId, int taskId, int completionCycle);
    void StageBoardCreated(int userId, int boardId);
    void StageBoardMemberInvited(int userId, int boardId, int memberUserId);
    void StageCommentCreated(int userId, int commentId);
    void StagePlanningPokerSessionCreated(int userId, int sessionId);
}
