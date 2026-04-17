# Planning Poker Design

**Date:** 2026-04-16

## Goal

Add a planning poker feature to the Kanban application so board members can start a live estimation session from the backlog, share a guest-accessible join link, and collaboratively produce a recommended estimate for backlog tasks without automatically changing task story points.

## Scope

This design covers:

- Creating a planning poker session from a board backlog
- Joining a session through a unique shared URL
- Allowing guests to participate with a session-scoped display name
- Running one active voting round at a time with a visible queue of remaining tasks
- Keeping votes hidden until the host reveals them
- Letting only the host select the recommended estimate
- Letting board members manually apply the recommended estimate back to a task
- Persisting session state so reconnects and refreshes are safe

This design does not cover:

- Automatic writing of recommended estimates to tasks
- Anonymous board access outside the planning poker session
- Multiple concurrently active tasks inside one session
- Sprint planning workflows beyond backlog task estimation

## Current Codebase Fit

The current application already provides the right foundation for this feature:

- The board page in `FE/src/app/pages/BoardNew.tsx` already loads the board, backlog tasks, labels, and user-facing workspace state
- The backlog and staging experience in `FE/src/app/components/BacklogView2.tsx` already hosts board-specific workflow actions
- Tasks already include `storyPoints`, `isQueued`, and backlog state in `FE/src/app/utils/cards.ts` and `BE/Models/Task.cs`
- Board-scoped backend endpoints already live in `BE/Controllers/BoardsController.cs`
- There is currently no real-time transport in the frontend or backend, so the feature should introduce one explicitly instead of assuming a preexisting socket layer

## Recommended Approach

Use a server-backed planning poker model stored in MySQL, with live updates delivered through SignalR.

### Why this approach

- It matches the requirement that the session is fully live
- It keeps the source of truth on the server instead of in one browser tab
- It allows reconnects, refreshes, and session recovery without losing the room state
- It creates a clean path for future additions like round history, facilitator handoff, and session summaries

### Alternatives considered

#### 1. Server-backed sessions with frontend polling

This would be simpler than real-time transport at first, but it would make voting, reveal, and participant-presence updates feel laggy. It also creates more complexity around polling intervals and race conditions without delivering a truly live experience.

#### 2. In-memory live rooms with partial persistence

This would be faster for a prototype, but it would be fragile on application restart and would not meet the expected reliability for a core collaboration feature inside the product.

## Product Behavior

### Session ownership and access

- A board member creates the session from the backlog page
- The creator becomes the session host
- The backend generates a unique public join token and returns a shareable URL
- Anyone with the link can join the session as a guest
- Guests must provide a display name before entering the room
- The guest token grants access only to the planning poker session, not to the board or broader application data

### Task selection model

- A session maintains a queue of eligible backlog tasks
- Only tasks without assigned `storyPoints` are eligible
- Only one task is active for voting at a time
- The session UI still shows the remaining queue so the meeting can continue smoothly without returning to the board page

### Voting model

- Participants can vote on the current active task
- Participants may change their vote until the host reveals the round
- Votes remain hidden from all participants until reveal
- Before reveal, the room should show participation progress such as whether someone has voted, not the selected value
- After reveal, the room shows the vote distribution and each participant's card

### Recommendation model

- After reveal, only the host can choose the recommended estimate for the active task
- Choosing a recommendation does not write to the task's `storyPoints`
- The recommendation is stored as planning poker session state for that task
- A board member later confirms the recommendation manually from the board-side experience

### Round progression

- After choosing a recommendation, the host can advance to the next queued task
- If a round needs to be rerun, the host can reset the round and participants can vote again
- If no more eligible tasks remain, the session moves into a completed or idle state instead of leaving the room in a broken state

## System Design

### Backend architecture

Add planning poker functionality as a board-scoped subsystem in the existing backend.

The backend responsibilities are:

- Create and manage planning poker sessions
- Store persistent room, queue, participant, and vote state
- Enforce host-only actions on the server
- Expose board-member APIs for session creation, session summaries, and manual estimate confirmation
- Expose a guest-safe join path for shared session URLs
- Broadcast live room updates through SignalR

### Proposed domain entities

The exact naming can be refined during implementation, but the model should separate concerns clearly:

- `PlanningPokerSession`
  - Board ownership
  - Public join token
  - Host identity
  - Session status such as active or completed
  - Active queue position
  - Created/updated timestamps
- `PlanningPokerSessionTask`
  - Session id
  - Task id
  - Ordered position in the queue
  - Recommendation selected by the host
  - Round status such as pending, voting, revealed, recommended, skipped
- `PlanningPokerParticipant`
  - Session id
  - Whether participant is a registered board member or guest
  - Display name
  - Stable session-scoped participant token or identity
  - Presence metadata such as last seen timestamp
  - Host flag
- `PlanningPokerVote`
  - Session task id or round id
  - Participant id
  - Selected card value
  - Submitted timestamp

If round reset/history requirements grow during implementation, introduce a dedicated `PlanningPokerRound` entity. For the first version, a session-task-centered model is enough as long as it supports vote reset cleanly.

### API and hub boundaries

Use conventional HTTP endpoints for setup and board-integrated actions:

- Create planning poker session for a board
- Fetch active or recent session summary for a board
- Fetch session details for the board-side view
- Manually apply a recommended estimate to a task

Use SignalR for live room behavior:

- Join session
- Rejoin session after refresh
- Update participant presence
- Submit or replace vote
- Reveal votes
- Reset round
- Select recommended estimate
- Advance to next task

This split keeps live room state synchronized while keeping board page actions aligned with the existing API patterns in `BoardsController`.

## Security And Authorization

### Board-side rules

- Only authenticated board members can create a planning poker session from a board
- Only board members should see board-integrated controls such as creating a session or manually applying the recommendation
- Host authority is granted by the session record on the server, not by frontend UI state

### Guest-side rules

- Shared links use an unguessable token
- The token grants access only to the planning poker session room
- Guests must not receive unrelated board details, hidden routes, or general application permissions
- Only the task details needed for estimation should be exposed in the guest room

### Host-only actions

The server must reject the following actions for non-host participants:

- Reveal votes
- Reset the round
- Select the recommended estimate
- Advance to the next task

## Frontend Design

### Board backlog experience

Add a planning poker entry point near the existing backlog or staging controls in the board workspace.

Expected board-side capabilities:

- Start a new planning poker session
- Copy the unique share link
- Reopen an in-progress session
- See the active task being estimated
- See participant count and session status
- See the selected recommendation for the current task once chosen
- Manually apply the recommendation to the task from the authenticated board UI

The board-side experience should follow existing app patterns:

- Reuse current page structure and board data-loading flow in `BoardNew.tsx`
- Use existing design system primitives and utility-first Tailwind styling
- Provide accessible labels, tooltips, status messaging, and keyboard access

### Shared planning poker room

The shared room should be a focused session interface with minimal distraction. It should work for guests who have no broader product context.

Expected room sections:

- Join step for display name entry
- Current task title and description
- Voting deck
- Hidden-vote participation summary
- Participant list
- Recommendation and reveal area
- Remaining queue of upcoming tasks
- Host controls when the participant is the host

### Interaction rules

- Non-host participants can vote and update their vote before reveal
- Participants should see whether they have already voted
- After reveal, voting controls become read-only until reset or advancement
- The host sees additional controls for reveal, reset, selecting recommendation, and next-task progression
- The room should restore the current session state when the browser reconnects

## Accessibility Requirements

This feature should align with the project's accessibility goals.

Required accessibility behaviors:

- All buttons and voting cards are keyboard reachable
- The selected vote has a clear non-color visual state
- Hidden and revealed round states are announced clearly
- Live updates use accessible status messaging for join, vote received, reveal, recommendation selected, and task advancement
- Display name entry, vote controls, and host actions have clear labels
- Queue and participant summaries do not rely only on color to convey meaning

## Failure And Edge Cases

The feature must handle session changes without corrupting room flow.

### Task changes during a session

- If a task receives `storyPoints` elsewhere while still in the queue, mark it unavailable and skip it when the session advances
- If the active task is deleted or moved out of the eligible state, show a clear room message and advance safely

### Participant changes

- If a guest refreshes, they should be able to rejoin using their session-scoped identity
- If a participant disconnects, their presence should update without breaking the round
- If the host disconnects temporarily, the session remains intact and resumes when they reconnect

### Empty session outcomes

- If session creation finds no eligible backlog tasks, the board-side flow should stop early with a clear message
- If the queue becomes empty after one or more rounds, the room should show a completed or idle state

### Concurrency safety

- Vote submission, reveal, recommendation selection, and advancement must validate current server state
- Manual estimate confirmation from the board should validate that the task is still eligible to receive the chosen estimate

## Data Flow

### Session creation flow

1. Board member opens backlog page
2. Board member starts planning poker
3. Backend gathers eligible backlog tasks where `storyPoints` is null
4. Backend creates session, ordered session-task rows, host participant entry, and join token
5. Frontend shows session summary and share link

### Guest join flow

1. User opens shared session URL
2. User enters display name
3. Frontend joins the SignalR room with token plus participant identity
4. Backend returns current session snapshot including active task, queue, reveal state, and participant list

### Voting flow

1. Participant chooses a card
2. Backend stores or replaces the participant's vote for the current active task
3. Hub broadcasts updated participation status without exposing the card value
4. Host reveals the round
5. Hub broadcasts full revealed vote state
6. Host chooses a recommended estimate
7. Backend stores recommendation for the current session task
8. Host advances to the next task

### Manual confirmation flow

1. Board member views the current planning poker recommendation in the board UI
2. Board member manually confirms the recommendation
3. Backend writes the value to the task's `storyPoints`
4. Frontend refreshes board task state and removes the task from eligible planning poker lists

## Testing Strategy

### Backend tests

Cover at least:

- Board member can create a session
- Non-member cannot create a session
- Session excludes tasks with existing `storyPoints`
- Guest can join with a valid token
- Invalid or expired token is rejected if expiry is implemented
- Only host can reveal, reset, recommend, and advance
- Votes remain hidden before reveal
- Votes are exposed after reveal
- Reset clears round votes correctly
- Recommendation persists without updating task story points automatically
- Manual board confirmation writes the recommended estimate to the task

### Frontend tests

Cover at least:

- Backlog page shows planning poker controls only in the appropriate board context
- Session creation shows copyable share link and in-progress state
- Guest join form validates display name
- Participant can vote and replace vote before reveal
- Non-host cannot access host actions
- Host can reveal, recommend, reset, and advance
- Board member can manually apply the recommendation from the board-side UI

### End-to-end verification

Validate the complete workflow:

1. Create a session from a board backlog
2. Join from a shared URL as at least two participants
3. Cast hidden votes
4. Reveal the round
5. Select the recommendation as host
6. Advance to the next task
7. Manually apply the recommendation back on the board

## Incremental Delivery Guidance

This feature is large enough that implementation should be staged.

Recommended sequence:

1. Persistent backend session model and board-member session creation
2. SignalR hub with join, vote, reveal, recommendation, and next-task flow
3. Shared session page for guests and host controls
4. Board backlog integration and manual estimate confirmation
5. Automated tests and polish for accessibility, reconnects, and edge cases

## Open Decisions Resolved In This Spec

- Recommendation is confirmed manually, not applied automatically
- Shared session links allow guests, not only board members
- Session shows a queue of unestimated backlog tasks, but only one active task is voted on at a time
- Votes stay hidden until reveal
- Only the host can choose the final recommended estimate

## Implementation Readiness

This design is focused enough for a single implementation plan. The feature is one subsystem with clear slices across backend persistence, live transport, guest join UX, board integration, and verification. It does not need to be decomposed into separate design documents before planning.
