# Planning Poker Room Redesign

Date: 2026-04-22
Status: Proposed

## Goal

Redesign the planning poker room so it feels like a natural extension of the board workspace instead of a separate standalone page.

The page should prioritize the active task and voting flow above the fold while reusing the visual language already established in the board area:

- shared workspace surface background treatment
- board-style page spacing and section rhythm
- theme-aware card surfaces, borders, and text colors
- clear hierarchy between primary work, supporting controls, and status feedback

## User Experience Outcome

When a user opens a planning poker room, they should immediately understand:

1. what task is currently being estimated
2. what action they can take right now
3. what the room state is
4. where host and collaboration controls live

The page should read like a focused collaboration workspace, not like a separate product mode.

## Chosen Direction

Use a board-style command room layout.

This means:

- the active task becomes the visual hero
- voting is placed directly beneath the active task
- room controls and participant context move into a right sidebar
- the current custom dark microsite styling is replaced with the existing workspace surface system

## Layout

## Top-Level Page Structure

The room page should adopt the same visual grammar used by board pages:

- workspace background from `getWorkspaceSurfaceStyles`
- centered content width aligned with other app workspaces
- page header followed by a two-column content layout on large screens
- stacked single-column layout on smaller screens

## Header

The header should feel closer to a board workspace header than a marketing banner.

Contents:

- small planning poker label
- primary page title
- compact secondary status copy
- concise room status panel on the right

The token should not be a primary visual element. If it remains visible, it should appear as subdued metadata rather than a highlighted badge.

## Main Content Column

The main column should own the page narrative.

Sections:

1. Active task hero
2. Vote deck
3. Queue or next-up task context

### Active Task Hero

This section should be the most visually prominent surface on the page.

Contents:

- task title
- task description
- recommendation or reveal state
- supporting status such as current round state

It should visually echo the board task surfaces already used elsewhere in the app, but with more room for reading and collaboration context.

### Vote Deck

The vote deck should sit directly beneath the active task, not compete with sidebar controls.

This keeps the primary question clear:

"What are we estimating, and how do I vote?"

### Queue Context

The queue should remain visible, but it should not overpower the active task.

It should behave like supporting board context:

- show what is next
- support host recommendation actions
- keep visual weight below the active task and vote action

## Right Sidebar

The sidebar should collect secondary but important collaboration tools.

Sections:

1. Room controls
2. Participant list
3. Link sharing and room health

### Room Controls

This panel keeps host-only actions and current round state together:

- reveal votes
- delete session
- round readiness summary

### Participant List

Participants should stay visible, but as awareness context rather than the centerpiece.

The list should feel like a board-side panel:

- compact
- readable
- status-oriented

### Share Link and Connection Feedback

The join link and connection state should be available without dominating the page.

Connection and retry messaging should sit close to the controls area instead of appearing as isolated full-page warnings unless the whole room is unavailable.

## Visual Style

## Reuse Existing Workspace Styling

The redesign should align with the rest of the application by reusing existing visual systems wherever possible:

- `getWorkspaceSurfaceStyles`
- `ThemeContext` color tokens
- existing card and section spacing patterns
- existing border and glass-like surface treatments

## Intentional Changes

The current room uses a strong custom dark gradient and standalone visual language. That should be replaced with the board workspace style so the room feels like part of the same application.

Allowed page-specific accents:

- a modest planning poker label
- subtle emphasis around the active task
- limited emphasis color for live state or reveal state

Avoid:

- hero styles that feel like a landing page
- oversized token or session metadata
- full-page alert-heavy presentation when only one section needs feedback

## Responsive Behavior

On desktop:

- two-column layout with dominant main task column and slimmer sidebar

On tablet and mobile:

- single-column stack
- active task and vote deck remain first
- controls and participants follow
- spacing should stay close to existing board page rhythm

## Accessibility

The redesign must preserve or improve current accessibility:

- keyboard-reachable controls
- visible focus states
- alerts announced with appropriate `role` or `aria-live`
- no reliance on color alone for round status or participant state
- clear labels for copy, reveal, delete, and vote actions

## Error and Empty States

## Invalid Link

If the token is missing or invalid, keep the state simple and workspace-consistent. It should look like an app error state, not a different branded screen.

## Join Failure

Join-related errors should appear close to the join form or room controls, with clearer wording than raw hub invocation failures.

## Deleted Session

Deleted session feedback should remain noticeable, but should still use the same app surface language.

## Implementation Notes

- `PlanningPokerRoom.tsx` should move onto the workspace surface system used by board pages.
- The page should likely introduce a small set of room-specific layout wrappers rather than pushing all layout responsibility into the existing child panels.
- Existing planning poker feature components can be preserved, but their framing and placement should be updated to match the new structure.
- If one or more planning poker subcomponents still look visually detached after the page-level redesign, targeted style updates should be made within those components rather than creating parallel design primitives.

## Validation

This redesign should not add testing work as part of scope.

Implementation can still be checked during development as needed, but no dedicated test-writing or test-expansion work is included in this redesign effort.

## Scope Boundaries

Included:

- planning poker room page layout and styling alignment
- stronger hierarchy around active task and vote flow
- better placement of collaboration controls and participant context

Not included:

- planning poker feature behavior changes
- backend protocol changes
- unrelated board or backlog redesign work
- dedicated testing additions or test refactors
