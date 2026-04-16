using System.Security.Claims;
using BE.DTOs;
using BE.Services;
using Microsoft.AspNetCore.SignalR;

namespace BE.Hubs;

public class PlanningPokerHub(IPlanningPokerSessionService service) : Hub
{
    private readonly IPlanningPokerSessionService _service = service;

    public async Task<PlanningPokerHubJoinResponse> JoinSession(
        string joinToken,
        string? participantToken = null,
        string? displayName = null)
    {
        try
        {
            PlanningPokerJoinResult result = await _service.JoinSessionAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                displayName,
                Context.ConnectionAborted);

            string groupName = GetGroupName(result.Session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("SessionUpdated", result.Session, Context.ConnectionAborted);

            return new PlanningPokerHubJoinResponse
            {
                Session = result.Session,
                ParticipantToken = result.ParticipantToken,
            };
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task<PlanningPokerSessionDto> SubmitVote(
        string joinToken,
        int cardValue,
        string? participantToken = null)
    {
        try
        {
            PlanningPokerSessionDto session = await _service.SubmitVoteAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                cardValue,
                Context.ConnectionAborted);

            string groupName = GetGroupName(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("VotingUpdated", session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("SessionUpdated", session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task<PlanningPokerSessionDto> RevealVotes(string joinToken, string? participantToken = null)
    {
        try
        {
            PlanningPokerSessionDto session = await _service.RevealVotesAsync(
                joinToken,
                TryGetCurrentUserId(),
                participantToken,
                Context.ConnectionAborted);

            string groupName = GetGroupName(session.SessionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("VotingUpdated", session, Context.ConnectionAborted);
            await Clients.Group(groupName).SendAsync("SessionUpdated", session, Context.ConnectionAborted);

            return session;
        }
        catch (PlanningPokerException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    private int? TryGetCurrentUserId()
    {
        string? value =
            Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
            Context.User?.FindFirstValue(ClaimTypes.Sid) ??
            Context.User?.FindFirstValue("sub");

        return int.TryParse(value, out int userId) ? userId : null;
    }

    private static string GetGroupName(int sessionId) => $"planning-poker-session:{sessionId}";

    public sealed class PlanningPokerHubJoinResponse
    {
        public PlanningPokerSessionDto Session { get; set; } = new();
        public string ParticipantToken { get; set; } = string.Empty;
    }
}
