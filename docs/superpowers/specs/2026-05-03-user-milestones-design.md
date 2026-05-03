# User Milestones Design

## Summary

Add a dedicated user milestones feature that rewards meaningful product usage such as completing tasks, creating boards, starting and finishing sprints, collaborating with teammates, and running planning poker sessions. Users should be able to open a milestones page from their profile to review unlocked milestones, track progress toward count-based milestones, and see what goals are coming up next.

This feature should extend the existing gamification direction without depending on XP milestones. The first release should support a broad but curated set of milestone categories that can be expanded later without redesigning the system.

## Goals

- Reward users for reaching milestone moments across the product.
- Add a dedicated milestones page reachable from the profile page.
- Show unlocked milestones, earned dates, and progress toward upcoming milestones.
- Support milestone categories beyond task completion in the first release.
- Build the backend in a way that allows more milestone definitions to be added later.
- Keep milestone unlocks reliable even when tasks are reopened or users repeat actions.

## Non-Goals

- XP-based milestones in this release.
- Real-time toast or live push notifications for milestone unlocks.
- Reversible milestone unlocks.
- Admin tools for editing milestone definitions from the UI.
- Team-wide milestone pages or leaderboards for milestone counts.
- A generic event bus or broad gamification refactor unrelated to milestones.

## User Experience

### Navigation

- The profile page should include a milestone summary card or action near the current progress area.
- A clear action such as `View all milestones` should navigate to a dedicated route under the protected app area.
- The milestones page should feel like an extension of the profile/account hub rather than a separate disconnected feature.

### Milestones Page

The milestones page should have three primary sections:

1. `Unlocked` milestones the user has already earned.
2. `In Progress` milestones that expose measurable progress.
3. `Coming Up` milestones that preview the next likely goals.

Milestones should be grouped by category so the broad v1 stays easy to scan:

- Tasks
- Boards
- Sprints
- Collaboration
- Planning Poker

Each milestone card should present:

- Title
- Short description
- Category
- Icon or visual marker
- Unlock status
- Unlock date when earned
- Progress text when applicable, such as `7 / 10 tasks completed`

The page should support both empty and active states:

- New users should see a welcoming empty-progress view with beginner milestones highlighted.
- Returning users should see unlocked milestones first without hiding progress toward the next ones.

### Accessibility

The milestones experience should follow existing frontend rules:

- Keyboard-accessible navigation and card actions.
- Semantic headings for sections and categories.
- Screen-reader-friendly labels for milestone status and progress.
- Progress information shown in text, not only color.
- Styling that works in bright and dark themes and across accent colors.

## Milestone Scope

The first release should ship with milestone definitions that are broad but confidently trackable from product data. The initial set should include:

### Tasks

- First Task Completed
- 10 Tasks Completed
- 25 Tasks Completed
- 50 Tasks Completed

### Boards

- First Board Created
- 5 Boards Created

### Sprints

- First Sprint Started
- 5 Sprints Started
- First Sprint Finished
- 5 Sprints Finished

### Collaboration

- First Member Invited
- 5 Members Invited
- First Comment Posted
- 25 Comments Posted

### Planning Poker

- First Planning Poker Session Created
- 5 Planning Poker Sessions Created

If any milestone type cannot be tracked confidently from current persisted data, that definition should be left out of v1 rather than shown with misleading progress.

## Backend Design

### Data Model

Add milestone-specific persistence instead of deriving everything only at read time.

Recommended additions:

- A milestone definition model or static definition catalog that describes:
  - Stable key
  - Title
  - Description
  - Category
  - Sort order
  - Target count
  - Progress type
  - Icon key
- A user milestone record that stores:
  - Id
  - UserId
  - MilestoneKey
  - UnlockedAtUtc
  - ProgressValue snapshot if useful for auditing

The preferred design is to keep milestone definitions in code for v1 and store user unlock records in the database. This keeps the initial release focused while still making the unlock history durable.

### Progress Calculation

Milestones should be evaluated from trusted backend data:

- Task completion milestones from task completion records already tied to gamification history.
- Board creation milestones from boards where the user is the creator.
- Sprint milestones from persisted sprint lifecycle records already used by board workflow.
- Member invitation milestones from board membership additions performed through the board owner flow.
- Comment milestones from stored task comments authored by the user.
- Planning poker milestones from sessions created by the user.

For count-based milestones, current progress should be derived from source data and compared against the target threshold. Unlock records should be created only once per user per milestone key.

### Unlock Rules

- A milestone unlocks once and remains unlocked permanently.
- Repeating the same action after unlock must not create duplicate records.
- Reopening a task and completing it again may affect XP according to existing rules, but it must not remove or duplicate previously unlocked milestones.
- Threshold milestones should unlock exactly when the user meets or exceeds the target count.

### Milestone Evaluation Service

Add a dedicated milestone service responsible for:

- Returning milestone page data for the current user.
- Evaluating milestone unlocks after qualifying actions.
- Preventing duplicate unlock records.
- Mapping source counts into milestone progress output.

This service can be invoked from existing backend flows where actions already occur, such as:

- Task completion transitions
- Board creation
- Sprint start and sprint finish actions
- Member invitation or membership creation
- Comment creation
- Planning poker session creation

The service should stay focused on milestones and should not absorb unrelated XP logic unless a shared helper is genuinely needed.

### API Endpoints

Add a current-user milestone endpoint, for example:

- `GET /api/users/me/milestones`

The response should include:

- All visible milestone definitions for v1
- Whether each milestone is unlocked
- Unlock timestamp when applicable
- Current progress value for measurable milestones
- Category and presentation metadata needed by the frontend
- Small summary totals for the profile card, such as unlocked count and category counts

If the profile page needs only lightweight summary data, that can either come from the milestone response or from a compact summary field added to the existing profile gamification fetch. Reusing one response is preferred if it keeps the frontend simple.

### DTOs

Add DTOs for:

- Milestone item response
- Milestone summary response
- Milestone category enum or string contract

Each milestone item should include enough information for rendering without frontend hardcoding of milestone rules:

- `key`
- `title`
- `description`
- `category`
- `iconKey`
- `targetValue`
- `currentValue`
- `isUnlocked`
- `unlockedAtUtc`
- `sortOrder`

## Frontend Design

### Routing

Add a dedicated protected route for the milestone page under the app area, such as:

- `/app/profile/milestones`

The profile page should link to this route from the gamification/account area.

### Profile Integration

The profile page should remain lightweight. It should show:

- A short milestone summary
- A count of unlocked milestones
- A preview of one or two recent or upcoming milestones
- A `View all milestones` action

The full gallery, grouped sections, and detailed progress should live on the milestones page rather than expanding the existing profile page too much.

### Milestones Page Data Flow

The milestones page should:

- Fetch current-user milestone data on load.
- Render loading skeletons that resemble milestone cards.
- Render grouped milestone sections once data arrives.
- Handle API errors with a concise inline error message and retry option if consistent with existing patterns.

The frontend should avoid computing unlock rules itself. It should render the backend response as the source of truth.

## Error Handling

The feature should handle these cases clearly:

- Unauthorized requests to milestone endpoints.
- Missing or temporarily unavailable milestone data.
- Milestone definitions that are intentionally disabled for v1.
- Backend evaluation paths that process the same qualifying action more than once.

The user-facing page should fail gracefully:

- Keep the profile page functional if milestone data fails to load.
- Show a clear inline error on the milestones page rather than a blank section.
- Avoid displaying fake progress defaults that could mislead users about unlock state.

## Implementation Boundaries

Keep this feature focused on:

- Milestone persistence and evaluation
- Current-user milestone API response
- Profile page navigation and summary
- Dedicated milestones page UI

Avoid unrelated refactors to:

- Global XP rules
- Leaderboards
- Team profile experiences
- Planning poker live room behavior
- Broader board architecture unless a small local change is required to hook milestone evaluation into an action

## Verification

Implementation should include verification for:

- First milestone unlock on qualifying action
- No duplicate unlock records for the same milestone
- Correct threshold unlock behavior for count milestones
- Profile page link to the milestones page
- Milestones page loading, empty state, and grouped rendering
- Accessible labels and text progress for milestone cards

Manual verification should confirm:

- A new user sees upcoming milestones and no false unlocks
- A user with existing tracked activity sees the expected unlocked milestones
- Reopening and re-completing a task does not duplicate milestone unlocks
