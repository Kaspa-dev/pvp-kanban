# Task Comments Details Page Design

## Summary

Add a dedicated task details page for board tasks and use that page as the home for task comments. Board members should be able to open a task, read its full details, follow the discussion, add new comments, and edit or delete only the comments they authored.

This work replaces the current "edit in modal only" task interaction as the primary path from the board UI. The task details page should preserve current task editing capabilities while giving comments enough room to be useful.

## Goals

- Let board members open a dedicated page for a single task.
- Let board members view all comments on that task.
- Let board members add comments.
- Let comment authors edit and delete their own comments.
- Preserve existing task editing behavior in a way that fits the new page.
- Keep the change scoped to task details and comments without refactoring unrelated board features.

## Non-Goals

- Real-time comment updates.
- Reactions, mentions, attachments, or threaded replies.
- Fine-grained permissions beyond board membership and comment ownership.
- Changes to planning poker, gamification, or board workflow rules.
- Test additions for this feature.

## User Experience

### Navigation

- Clicking a task from the board should navigate to a dedicated route such as `/boards/:boardId/tasks/:taskId`.
- The page should make it easy to return to the board the task came from.
- The board page should stop relying on the edit modal as the primary task details experience.

### Task Details Layout

The task details page should have three clear sections:

1. A header with the task title and board context.
2. A task information section showing the existing task fields.
3. A comments section for discussion.

The task information section should surface the same core data already used in the application:

- Title
- Description
- Status
- Assignee
- Labels
- Story points
- Due date
- Priority
- Task type

Editing task data should still be possible from this page. The preferred implementation is to reuse the current task form logic where practical, but render it in a page-friendly way instead of relying on the modal as the only editing surface.

### Comments Experience

The comments area should support:

- Reading the full comment list in chronological order.
- Showing each comment author and creation time.
- Showing when a comment has been edited.
- Adding a new comment with a textarea and submit action.
- Editing an existing comment inline or in-place.
- Deleting an existing comment with a clear confirmation step.

Author-only actions should only be visible for comments authored by the current user.

The UI should continue to follow the existing accessibility and styling rules in the project:

- Keyboard-accessible actions.
- Screen-reader labels for comment actions.
- Clear inline error states.
- Styling that works in both bright and dark modes.

## Backend Design

### Data Model

The existing `Task` model already references a `Comments` collection. This feature should formalize that relationship by ensuring there is a comment entity that stores:

- `Id`
- `TaskId`
- `AuthorUserId`
- `Content`
- `CreatedAt`
- `UpdatedAt`

The comment entity should relate back to:

- The task it belongs to.
- The user who authored it.

### API Endpoints

Add or extend task endpoints under the board scope:

- `GET /api/boards/{boardId}/tasks/{taskId}`
  Returns one task with the data needed for the task details page.
- `GET /api/boards/{boardId}/tasks/{taskId}/comments`
  Returns the comments for the task.
- `POST /api/boards/{boardId}/tasks/{taskId}/comments`
  Creates a new comment.
- `PATCH /api/boards/{boardId}/tasks/{taskId}/comments/{commentId}`
  Updates an existing comment authored by the current user.
- `DELETE /api/boards/{boardId}/tasks/{taskId}/comments/{commentId}`
  Deletes an existing comment authored by the current user.

The task details endpoint may include comments directly, but the preferred shape is to keep comments as a dedicated nested resource so the frontend can load and update them independently.

### DTOs

Add DTOs for:

- Comment response data
- Create comment request
- Update comment request
- Task details response, if the existing task DTO is not sufficient

A comment response should include:

- Comment id
- Content
- Author identity needed by the UI
- Created timestamp
- Updated timestamp
- A simple derived flag or enough data for the frontend to decide whether the current user can edit/delete

### Authorization

Permissions should remain intentionally simple:

- Any board member can view the task details page and comment list.
- Any board member can create a comment.
- Only the author of a comment can edit it.
- Only the author of a comment can delete it.

Board membership should be validated through the existing board access path already used by the controller.

### Validation

Comment validation should follow the style already used for tasks:

- Reject empty or whitespace-only content.
- Enforce a maximum comment length.
- Return clear `BadRequest` messages for invalid input.

A max length of 2000 characters is recommended to stay aligned with the existing task description ceiling and avoid introducing a second arbitrary content scale.

## Frontend Design

### Routing

Add a dedicated route and page component for task details under the board experience. The route should receive both `boardId` and `taskId`.

Board task interactions should be updated so selecting a task navigates to this route instead of opening only the edit modal.

### Data Flow

The task details page should:

- Load the task details for the selected task.
- Load the task comments.
- Allow task updates through the existing task update API.
- Refresh local page state after comment create, edit, or delete actions.

Current task normalization utilities should be reused where possible so the new page stays aligned with the rest of the board task UI.

### Comments UI

The comments section should include:

- A list container for existing comments.
- Author name and timestamp metadata on each comment.
- An indicator when a comment was edited.
- A composer for new comments.
- Edit and delete controls for the current user's comments only.
- Inline pending and error states during create, update, and delete actions.

The page should avoid text-only placeholders where a loading skeleton or existing loading pattern is available and practical.

## Error Handling

The feature should handle these cases clearly:

- Task not found.
- User is not a board member.
- Comment not found.
- User tries to edit or delete another member's comment.
- Validation failures for empty or oversized comments.
- API failures while loading or mutating comments.

Frontend messaging should be concise and user-facing, matching the existing app tone.

## Implementation Boundaries

Keep this feature focused on the following areas:

- Board task routing and navigation
- Task details page
- Comment APIs and persistence
- Minimal task-details DTO expansion needed to support the page

Avoid unrelated refactors to:

- Planning poker
- Board settings
- Gamification rules
- Global task workspace behavior unless it directly depends on the new route

## Verification

Per product direction for this feature, do not add automated tests as part of this implementation.

Manual verification can still be used during development, but the feature scope should not include new test files or test suites.
