using Microsoft.AspNetCore.SignalR;

namespace BE.Hubs;

public class BoardHub : Hub
{
    public Task JoinBoard(string boardId)
    {
        if (string.IsNullOrWhiteSpace(boardId))
        {
            throw new HubException("Board id is required.");
        }

        return Groups.AddToGroupAsync(Context.ConnectionId, boardId);
    }

    public Task LeaveBoard(string boardId)
    {
        if (string.IsNullOrWhiteSpace(boardId))
        {
            throw new HubException("Board id is required.");
        }

        return Groups.RemoveFromGroupAsync(Context.ConnectionId, boardId);
    }

    public async Task MoveCard(BoardMoveMessage moveMessage)
    {
        if (string.IsNullOrWhiteSpace(moveMessage.BoardId) ||
            string.IsNullOrWhiteSpace(moveMessage.CardId) ||
            string.IsNullOrWhiteSpace(moveMessage.FromStatus) ||
            string.IsNullOrWhiteSpace(moveMessage.ToStatus))
        {
            throw new HubException("Invalid board move payload.");
        }

        await Clients.OthersInGroup(moveMessage.BoardId).SendAsync("CardMoved", moveMessage);
    }
}
