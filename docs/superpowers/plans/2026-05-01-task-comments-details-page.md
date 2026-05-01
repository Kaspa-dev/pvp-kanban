# Task Comments Details Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated board task details page that supports viewing and editing task data plus creating, editing, and deleting task comments for board members.

**Architecture:** Extend the existing board-scoped `BoardsController` with a single-task details endpoint and nested comment endpoints, upgrade the existing comment persistence model to carry author and timestamp metadata, and add a new protected frontend route at `/app/:boardId/tasks/:taskId`. Reuse the current task editing form by extracting shared task form fields out of the modal shell so the new page can host the same edit surface without duplicating validation and field UI.

**Tech Stack:** ASP.NET Core, Entity Framework Core, MySQL migrations, React, TypeScript, React Router, Tailwind CSS, existing shared UI/components.

---

## File Structure

### Backend

- Modify: `BE/Models/Comment.cs`
  Add the fields needed for editable task comments: author id naming aligned with frontend DTOs, created timestamp, updated timestamp, and navigation names that read clearly in controller code.
- Modify: `BE/Data/AppDbContext.cs`
  Update the `Comment` entity configuration for content length, timestamps, foreign keys, and any index needed for efficient task comment reads.
- Modify: `BE/DTOs/BoardDtos.cs`
  Add DTOs for task details and comment requests/responses.
- Modify: `BE/Controllers/BoardsController.cs`
  Add `GET /tasks/{taskId}` and nested comment CRUD endpoints using existing board membership checks.
- Create: `BE/Migrations/<timestamp>_ExpandTaskCommentsForDetailsPage.cs`
  Persist the comment schema changes.
- Modify: `BE/Migrations/AppDbContextModelSnapshot.cs`
  Keep EF snapshot aligned with the migration.

### Frontend

- Modify: `FE/src/app/App.tsx`
  Register the new protected task details route.
- Modify: `FE/src/app/utils/cards.ts`
  Add task-details and comment API types/functions, plus any normalization helpers needed by the new page.
- Create: `FE/src/app/pages/TaskDetails.tsx`
  Build the dedicated task page shell and orchestrate task/comment loading and mutations.
- Create: `FE/src/app/components/TaskFormFields.tsx`
  Extract the reusable task-edit field set out of the modal.
- Modify: `FE/src/app/components/TaskFormModal.tsx`
  Keep the modal shell, but render the new shared form fields component inside it.
- Modify: `FE/src/app/components/EditTaskModal.tsx`
  Point the modal to the extracted shared form field implementation so the existing modal keeps working during the transition.
- Create: `FE/src/app/components/task-details/TaskCommentThread.tsx`
  Render the comment list, composer, inline editor, and per-comment actions.
- Create: `FE/src/app/components/task-details/TaskDetailsEditor.tsx`
  Render the task data editor block on the new page using the shared fields.
- Modify: `FE/src/app/components/KanbanCard.tsx`
  Make task cards navigable to the details route while preserving assignment/delete actions.
- Modify: `FE/src/app/components/KanbanColumn.tsx`
  Thread the navigate handler into board-column cards.
- Modify: `FE/src/app/components/BacklogView2.tsx`
  Thread the navigate handler into backlog cards.
- Modify: `FE/src/app/components/ListView.tsx`
  Add row-level navigation to the task details route.
- Modify: `FE/src/app/components/HistoryView.tsx`
  Thread the navigate handler into history cards.
- Modify: `FE/src/app/pages/BoardNew.tsx`
  Swap primary task-open behavior from edit modal to route navigation and keep explicit editing available where still needed.

---

### Task 1: Upgrade The Comment Persistence Model

**Files:**
- Modify: `BE/Models/Comment.cs`
- Modify: `BE/Data/AppDbContext.cs`
- Create: `BE/Migrations/<timestamp>_ExpandTaskCommentsForDetailsPage.cs`
- Modify: `BE/Migrations/AppDbContextModelSnapshot.cs`

- [ ] **Step 1: Update the comment entity shape**

Change `BE/Models/Comment.cs` from the current minimal model:

```csharp
public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int CreatorId { get; set; }
    public int TaskId { get; set; }

    public User Creator { get; set; } = null!;
    public Models.Task Task { get; set; } = null!;
    public ICollection<Models.Attachment> Attachments { get; set; } = new List<Models.Attachment>();
}
```

to this:

```csharp
public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int AuthorUserId { get; set; }
    public int TaskId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public User Author { get; set; } = null!;
    public Models.Task Task { get; set; } = null!;
    public ICollection<Models.Attachment> Attachments { get; set; } = new List<Models.Attachment>();
}
```

- [ ] **Step 2: Reconfigure the EF mapping**

Replace the comment mapping block in `BE/Data/AppDbContext.cs`:

```csharp
modelBuilder.Entity<Comment>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Content).IsRequired().HasMaxLength(255);

    entity.HasOne(e => e.Creator)
        .WithMany(u => u.Comments)
        .HasForeignKey(e => e.CreatorId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.HasOne(e => e.Task)
        .WithMany(t => t.Comments)
        .HasForeignKey(e => e.TaskId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

with:

```csharp
modelBuilder.Entity<Comment>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
    entity.Property(e => e.CreatedAt).IsRequired();
    entity.Property(e => e.UpdatedAt);
    entity.HasIndex(e => new { e.TaskId, e.CreatedAt });

    entity.HasOne(e => e.Author)
        .WithMany(u => u.Comments)
        .HasForeignKey(e => e.AuthorUserId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.HasOne(e => e.Task)
        .WithMany(t => t.Comments)
        .HasForeignKey(e => e.TaskId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

- [ ] **Step 3: Create the EF migration**

Run:

```powershell
dotnet ef migrations add ExpandTaskCommentsForDetailsPage
```

from:

```powershell
C:\Users\Kaspa\Desktop\kanban\pvp-kanban\BE
```

Expected result:
- A new migration file appears under `BE/Migrations/`
- `AppDbContextModelSnapshot.cs` reflects the renamed foreign key plus new timestamp and content length columns

- [ ] **Step 4: Review the generated migration for the intended schema change**

The generated migration should include operations equivalent to:

```csharp
migrationBuilder.RenameColumn(
    name: "CreatorId",
    table: "Comments",
    newName: "AuthorUserId");

migrationBuilder.AddColumn<DateTime>(
    name: "CreatedAt",
    table: "Comments",
    type: "datetime(6)",
    nullable: false,
    defaultValue: new DateTime(1, 1, 1));

migrationBuilder.AddColumn<DateTime>(
    name: "UpdatedAt",
    table: "Comments",
    type: "datetime(6)",
    nullable: true);

migrationBuilder.AlterColumn<string>(
    name: "Content",
    table: "Comments",
    type: "varchar(2000)",
    maxLength: 2000,
    nullable: false,
    oldClrType: typeof(string),
    oldType: "varchar(255)",
    oldMaxLength: 255);
```

If EF chooses a drop/add for the foreign key instead of a rename, keep the generated version as long as the resulting schema is correct.

- [ ] **Step 5: Commit**

```bash
git add BE/Models/Comment.cs BE/Data/AppDbContext.cs BE/Migrations
git commit -m "feat: expand task comment persistence"
```

### Task 2: Add Single-Task And Comment APIs

**Files:**
- Modify: `BE/DTOs/BoardDtos.cs`
- Modify: `BE/Controllers/BoardsController.cs`

- [ ] **Step 1: Add comment and task-details DTOs**

Append the following DTOs to `BE/DTOs/BoardDtos.cs` after `BoardTaskDto`:

```csharp
public class TaskCommentDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public BoardMemberDto Author { get; set; } = new();
    public int AuthorUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}

public class TaskDetailsDto : BoardTaskDto
{
    public List<TaskCommentDto> Comments { get; set; } = new();
}

public class CreateTaskCommentRequestDto
{
    public string Content { get; set; } = string.Empty;
}

public class UpdateTaskCommentRequestDto
{
    public string Content { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Add comment constants and mapping helpers**

Near the task constants in `BE/Controllers/BoardsController.cs`, add:

```csharp
private const int MaxTaskCommentLength = 2000;
```

Then add helper methods near the existing DTO mappers:

```csharp
private TaskCommentDto ToTaskCommentDto(Comment comment, Dictionary<int, BoardMemberDto> memberLookup, int currentUserId)
{
    BoardMemberDto author = memberLookup.TryGetValue(comment.AuthorUserId, out BoardMemberDto? member)
        ? member
        : new BoardMemberDto
        {
            UserId = comment.AuthorUserId,
            DisplayName = comment.Author.Username,
            Username = comment.Author.Username,
            Email = comment.Author.Email,
            Color = "#9ca3af",
            Role = "member",
        };

    bool isAuthor = comment.AuthorUserId == currentUserId;

    return new TaskCommentDto
    {
        Id = comment.Id,
        Content = comment.Content,
        Author = author,
        AuthorUserId = comment.AuthorUserId,
        CreatedAt = comment.CreatedAt,
        UpdatedAt = comment.UpdatedAt,
        CanEdit = isAuthor,
        CanDelete = isAuthor,
    };
}

private TaskDetailsDto ToTaskDetailsDto(TaskEntity task, Dictionary<int, BoardMemberDto> memberLookup, int currentUserId)
{
    BoardTaskDto baseTask = ToTaskDto(task, memberLookup);

    return new TaskDetailsDto
    {
        Id = baseTask.Id,
        Title = baseTask.Title,
        Description = baseTask.Description,
        StatusKey = baseTask.StatusKey,
        IsQueued = baseTask.IsQueued,
        LabelIds = baseTask.LabelIds,
        AssigneeUserId = baseTask.AssigneeUserId,
        Assignee = baseTask.Assignee,
        ReporterUserId = baseTask.ReporterUserId,
        StoryPoints = baseTask.StoryPoints,
        DueDate = baseTask.DueDate,
        Priority = baseTask.Priority,
        TaskType = baseTask.TaskType,
        Comments = task.Comments
            .OrderBy(comment => comment.CreatedAt)
            .Select(comment => ToTaskCommentDto(comment, memberLookup, currentUserId))
            .ToList(),
    };
}
```

- [ ] **Step 3: Add the single-task details endpoint**

Add this endpoint above `UpdateTask` in `BE/Controllers/BoardsController.cs`:

```csharp
[HttpGet("{boardId:int}/tasks/{taskId:int}")]
public async Task<ActionResult<TaskDetailsDto>> GetTaskDetails(int boardId, int taskId, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out int userId))
    {
        return Unauthorized();
    }

    var (accessContext, failure) = await GetBoardAccessAsync(boardId, userId, requireOwner: false, cancellationToken);
    if (failure is not null)
    {
        return failure;
    }

    TaskEntity? task = await _context.Tasks
        .Where(item => item.Id == taskId && item.BoardId == boardId)
        .Include(item => item.Status)
        .Include(item => item.Assignee)
        .Include(item => item.LabeledTasks)
        .Include(item => item.Comments)
        .ThenInclude(comment => comment.Author)
        .FirstOrDefaultAsync(cancellationToken);

    if (task is null)
    {
        return NotFound();
    }

    var memberLookup = accessContext!.Board.Memberships.ToDictionary(
        membership => membership.UserId,
        ToBoardMemberDto);

    return Ok(ToTaskDetailsDto(task, memberLookup, userId));
}
```

- [ ] **Step 4: Add the nested comment CRUD endpoints**

Add these endpoints after `GetTaskDetails`:

```csharp
[HttpGet("{boardId:int}/tasks/{taskId:int}/comments")]
public async Task<ActionResult<IEnumerable<TaskCommentDto>>> GetTaskComments(int boardId, int taskId, CancellationToken cancellationToken)
```

```csharp
[HttpPost("{boardId:int}/tasks/{taskId:int}/comments")]
public async Task<ActionResult<TaskCommentDto>> CreateTaskComment(int boardId, int taskId, CreateTaskCommentRequestDto request, CancellationToken cancellationToken)
```

```csharp
[HttpPatch("{boardId:int}/tasks/{taskId:int}/comments/{commentId:int}")]
public async Task<ActionResult<TaskCommentDto>> UpdateTaskComment(int boardId, int taskId, int commentId, UpdateTaskCommentRequestDto request, CancellationToken cancellationToken)
```

```csharp
[HttpDelete("{boardId:int}/tasks/{taskId:int}/comments/{commentId:int}")]
public async Task<IActionResult> DeleteTaskComment(int boardId, int taskId, int commentId, CancellationToken cancellationToken)
```

Use this validation pattern inside create/update:

```csharp
string normalizedContent = request.Content?.Trim() ?? string.Empty;
if (string.IsNullOrWhiteSpace(normalizedContent))
{
    return BadRequest(new { message = "Comment content is required." });
}

if (normalizedContent.Length > MaxTaskCommentLength)
{
    return BadRequest(new { message = $"Comment content can be up to {MaxTaskCommentLength} characters." });
}
```

Use this ownership guard inside update/delete:

```csharp
if (comment.AuthorUserId != userId)
{
    return Forbid();
}
```

Use these assignments on mutation:

```csharp
comment.Content = normalizedContent;
comment.UpdatedAt = DateTime.UtcNow;
```

and:

```csharp
var comment = new Comment
{
    TaskId = taskId,
    AuthorUserId = userId,
    Content = normalizedContent,
    CreatedAt = DateTime.UtcNow,
};
```

- [ ] **Step 5: Commit**

```bash
git add BE/DTOs/BoardDtos.cs BE/Controllers/BoardsController.cs
git commit -m "feat: add board task details and comments api"
```

### Task 3: Add Frontend Task Details And Comment API Utilities

**Files:**
- Modify: `FE/src/app/utils/cards.ts`

- [ ] **Step 1: Add frontend types for task details and comments**

Add these interfaces near the existing `ApiTask` and `Card` declarations in `FE/src/app/utils/cards.ts`:

```ts
export interface TaskCommentAuthor extends TaskAssignee {}

interface ApiTaskComment {
  id: number;
  content: string;
  author: ApiAssignee;
  authorUserId: number;
  createdAt: string;
  updatedAt?: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

interface ApiTaskDetails extends ApiTask {
  comments: ApiTaskComment[];
}

export interface TaskComment {
  id: number;
  content: string;
  author: TaskCommentAuthor;
  authorUserId: number;
  createdAt: string;
  updatedAt?: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface TaskDetails extends Card {
  comments: TaskComment[];
}
```

- [ ] **Step 2: Add normalization helpers**

Add these helpers below `normalizeTask`:

```ts
function normalizeTaskComment(comment: ApiTaskComment): TaskComment {
  return {
    id: comment.id,
    content: comment.content,
    author: normalizeAssignee(comment.author),
    authorUserId: comment.authorUserId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt ?? null,
    canEdit: comment.canEdit,
    canDelete: comment.canDelete,
  };
}

export function normalizeTaskDetails(task: ApiTaskDetails): TaskDetails {
  return {
    ...normalizeTask(task),
    comments: (task.comments ?? []).map(normalizeTaskComment),
  };
}
```

- [ ] **Step 3: Add API functions for details and comments**

Append these functions after `updateBoardTask`:

```ts
export async function getBoardTaskDetails(
  boardId: number | string,
  taskId: number | string,
): Promise<TaskDetails> {
  const task = await apiJson<ApiTaskDetails>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}`,
    { method: "GET" },
    "Unable to load the task right now.",
  );

  return normalizeTaskDetails(task);
}

export async function getTaskComments(
  boardId: number | string,
  taskId: number | string,
): Promise<TaskComment[]> {
  const comments = await apiJson<ApiTaskComment[]>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments`,
    { method: "GET" },
    "Unable to load comments right now.",
  );

  return comments.map(normalizeTaskComment);
}

export async function createTaskComment(
  boardId: number | string,
  taskId: number | string,
  content: string,
): Promise<TaskComment> {
  const comment = await apiJson<ApiTaskComment>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
    "Unable to add the comment right now.",
  );

  return normalizeTaskComment(comment);
}

export async function updateTaskComment(
  boardId: number | string,
  taskId: number | string,
  commentId: number | string,
  content: string,
): Promise<TaskComment> {
  const comment = await apiJson<ApiTaskComment>(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments/${Number(commentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ content }),
    },
    "Unable to save the comment right now.",
  );

  return normalizeTaskComment(comment);
}

export async function deleteTaskComment(
  boardId: number | string,
  taskId: number | string,
  commentId: number | string,
): Promise<void> {
  await apiVoid(
    `/api/boards/${Number(boardId)}/tasks/${Number(taskId)}/comments/${Number(commentId)}`,
    { method: "DELETE" },
    "Unable to delete the comment right now.",
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add FE/src/app/utils/cards.ts
git commit -m "feat: add frontend task details and comment clients"
```

### Task 4: Extract Shared Task Edit Fields For Modal And Page Reuse

**Files:**
- Create: `FE/src/app/components/TaskFormFields.tsx`
- Modify: `FE/src/app/components/TaskFormModal.tsx`
- Modify: `FE/src/app/components/EditTaskModal.tsx`

- [ ] **Step 1: Extract the reusable task form body**

Create `FE/src/app/components/TaskFormFields.tsx` and move the field body currently inside `TaskFormModal` into a reusable component:

```tsx
interface TaskFormFieldsProps {
  boardId: number;
  formIdPrefix: string;
  taskTitle: string;
  onTaskTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  onTaskTitleBlur?: () => void;
  onDescriptionBlur?: () => void;
  titleError?: string;
  descriptionError?: string;
  dueDateError?: string;
  availableLabels: Label[];
  selectedLabelIds: number[];
  onSelectedLabelIdsChange: (labelIds: number[]) => void;
  availableAssignees: TaskAssignee[];
  suggestedAssignees?: TaskAssignee[];
  selectedAssignee: TaskAssignee | null;
  onSelectedAssigneeChange: (assignee: TaskAssignee | null) => void;
  storyPoints?: number | null;
  customStoryPoints: string;
  onStoryPointsPresetClick: (points: number) => void;
  onCustomStoryPointsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onStoryPointsBlur?: () => void;
  onClearStoryPoints: () => void;
  storyPointsError?: string;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onDueDateBlur?: () => void;
  priority?: Priority | null;
  onPriorityChange: (priority: Priority | undefined | null) => void;
  taskType?: TaskType | null;
  onTaskTypeChange: (taskType: TaskType | undefined | null) => void;
  layoutClassName?: string;
}

export function TaskFormFields(props: TaskFormFieldsProps) {
  // move the current field JSX here unchanged
}
```

- [ ] **Step 2: Refactor the modal to use the shared fields**

Inside `FE/src/app/components/TaskFormModal.tsx`, replace the large inlined field body with:

```tsx
<TaskFormFields
  boardId={boardId}
  formIdPrefix={formIdPrefix}
  taskTitle={taskTitle}
  onTaskTitleChange={onTaskTitleChange}
  description={description}
  onDescriptionChange={onDescriptionChange}
  onTaskTitleBlur={onTaskTitleBlur}
  onDescriptionBlur={onDescriptionBlur}
  titleError={titleError}
  descriptionError={descriptionError}
  dueDateError={dueDateError}
  availableLabels={availableLabels}
  selectedLabelIds={selectedLabelIds}
  onSelectedLabelIdsChange={onSelectedLabelIdsChange}
  availableAssignees={availableAssignees}
  suggestedAssignees={suggestedAssignees}
  selectedAssignee={selectedAssignee}
  onSelectedAssigneeChange={onSelectedAssigneeChange}
  storyPoints={storyPoints}
  customStoryPoints={customStoryPoints}
  onStoryPointsPresetClick={onStoryPointsPresetClick}
  onCustomStoryPointsChange={onCustomStoryPointsChange}
  onStoryPointsBlur={onStoryPointsBlur}
  onClearStoryPoints={onClearStoryPoints}
  storyPointsError={storyPointsError}
  dueDate={dueDate}
  onDueDateChange={onDueDateChange}
  onDueDateBlur={onDueDateBlur}
  priority={priority}
  onPriorityChange={onPriorityChange}
  taskType={taskType}
  onTaskTypeChange={onTaskTypeChange}
  layoutClassName="grid items-start gap-5 px-1 py-1 md:grid-cols-2"
/>
```

- [ ] **Step 3: Keep the existing edit modal behavior intact**

`FE/src/app/components/EditTaskModal.tsx` should continue to render `TaskFormModal` exactly as it does now, with no comment logic added there. The point of this task is reuse, not feature expansion.

- [ ] **Step 4: Commit**

```bash
git add FE/src/app/components/TaskFormFields.tsx FE/src/app/components/TaskFormModal.tsx FE/src/app/components/EditTaskModal.tsx
git commit -m "refactor: extract reusable task form fields"
```

### Task 5: Build The Task Details Page And Comment Thread

**Files:**
- Modify: `FE/src/app/App.tsx`
- Create: `FE/src/app/pages/TaskDetails.tsx`
- Create: `FE/src/app/components/task-details/TaskDetailsEditor.tsx`
- Create: `FE/src/app/components/task-details/TaskCommentThread.tsx`

- [ ] **Step 1: Register the protected route**

In `FE/src/app/App.tsx`, import the new page and add:

```tsx
<Route
  path="/app/:boardId/tasks/:taskId"
  element={
    <ProtectedRoute>
      <TaskDetails />
    </ProtectedRoute>
  }
/>
```

between the existing board route and planning poker route.

- [ ] **Step 2: Create the task details page state shell**

Create `FE/src/app/pages/TaskDetails.tsx` with page state shaped like this:

```tsx
const { boardId, taskId } = useParams<{ boardId: string; taskId: string }>();
const navigate = useNavigate();
const { theme, isDarkMode } = useTheme();
const currentTheme = getThemeColors(theme, isDarkMode);

const [task, setTask] = useState<TaskDetails | null>(null);
const [labels, setLabels] = useState<Label[]>([]);
const [board, setBoard] = useState<BoardType | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState("");
```

Load data with:

```tsx
const [boardResult, boardLabels, taskDetails] = await Promise.all([
  getBoard(numericBoardId),
  getBoardLabels(numericBoardId),
  getBoardTaskDetails(numericBoardId, numericTaskId),
]);
```

Render a three-part page:

```tsx
<main>
  <header>{/* back to board, title, board name */}</header>
  <section>{/* TaskDetailsEditor */}</section>
  <section>{/* TaskCommentThread */}</section>
</main>
```

- [ ] **Step 3: Create the task details editor component**

Create `FE/src/app/components/task-details/TaskDetailsEditor.tsx` using the same local state pattern as `EditTaskModal`, but render it inline on the page with `TaskFormFields` rather than `TaskFormModal`.

The submit call should reuse `updateBoardTask`:

```tsx
await updateBoardTask(boardId, task.id, {
  title: title.trim(),
  description: description.trim(),
  status: task.status,
  labelIds: selectedLabelIds,
  assigneeUserId: selectedAssignee?.userId || null,
  storyPoints,
  dueDate: dueDate || null,
  priority,
  taskType,
});
```

Expose a callback:

```tsx
onTaskUpdated(updatedTask: Card): void
```

so `TaskDetails.tsx` can merge the updated task fields back into the current page state.

- [ ] **Step 4: Create the comment thread component**

Create `FE/src/app/components/task-details/TaskCommentThread.tsx` with:

```tsx
interface TaskCommentThreadProps {
  boardId: number;
  taskId: number;
  comments: TaskComment[];
  onCommentsChange: (comments: TaskComment[]) => void;
}
```

It should manage:

```tsx
const [draft, setDraft] = useState("");
const [submitError, setSubmitError] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
const [editingContent, setEditingContent] = useState("");
```

Mutation behavior:

```tsx
const created = await createTaskComment(boardId, taskId, draft.trim());
onCommentsChange([...comments, created]);
```

```tsx
const updated = await updateTaskComment(boardId, taskId, editingCommentId, editingContent.trim());
onCommentsChange(comments.map((comment) => comment.id === updated.id ? updated : comment));
```

```tsx
await deleteTaskComment(boardId, taskId, commentId);
onCommentsChange(comments.filter((comment) => comment.id !== commentId));
```

Author-only actions should be gated by:

```tsx
if (!comment.canEdit) { return null; }
if (!comment.canDelete) { return null; }
```

- [ ] **Step 5: Commit**

```bash
git add FE/src/app/App.tsx FE/src/app/pages/TaskDetails.tsx FE/src/app/components/task-details
git commit -m "feat: add task details page and comment thread"
```

### Task 6: Rewire Board Task Opening To Use The Details Route

**Files:**
- Modify: `FE/src/app/pages/BoardNew.tsx`
- Modify: `FE/src/app/components/KanbanCard.tsx`
- Modify: `FE/src/app/components/KanbanColumn.tsx`
- Modify: `FE/src/app/components/BacklogView2.tsx`
- Modify: `FE/src/app/components/ListView.tsx`
- Modify: `FE/src/app/components/HistoryView.tsx`

- [ ] **Step 1: Add a dedicated open-task callback on the board page**

In `FE/src/app/pages/BoardNew.tsx`, add:

```tsx
const handleOpenTask = (taskId: number) => {
  navigate(`/app/${numericBoardId}/tasks/${taskId}`);
};
```

Keep `handleSaveEdit` and `EditTaskModal` intact for explicit edit actions during the transition.

- [ ] **Step 2: Add card-level navigation support**

In `FE/src/app/components/KanbanCard.tsx`, replace the static title with a button:

```tsx
interface KanbanCardProps {
  // existing props
  onOpen?: (cardId: number) => void;
}
```

```tsx
<button
  type="button"
  onClick={() => onOpen?.(id)}
  className={`mb-4 block max-w-full truncate text-left font-bold text-[15px] leading-tight ${currentTheme.text}`}
>
  {priorityIndicator && <span className="sr-only">{priorityIndicator.label} priority. </span>}
  {title}
</button>
```

Keep action buttons stopping propagation:

```tsx
onMouseDown={(e) => e.stopPropagation()}
onClick={(e) => {
  e.stopPropagation();
  onDelete(id, title);
}}
```

- [ ] **Step 3: Thread the open-task callback through board/backlog/history card lists**

Add `onOpen?: (cardId: number) => void;` to:

```tsx
FE/src/app/components/KanbanColumn.tsx
FE/src/app/components/BacklogView2.tsx
FE/src/app/components/HistoryView.tsx
```

and pass it into each `KanbanCard`:

```tsx
<KanbanCard
  // existing props
  onOpen={onOpen}
/>
```

From `BoardNew.tsx`, wire:

```tsx
onOpen={handleOpenTask}
```

for all task-presenting views.

- [ ] **Step 4: Add row-level navigation in list view**

In `FE/src/app/components/ListView.tsx`, add:

```tsx
onOpen?: (cardId: number) => void;
```

to props and make the title cell clickable:

```tsx
<button
  type="button"
  onClick={() => onOpen?.(card.id)}
  className={`block max-w-full truncate text-left text-[15px] font-semibold ${currentTheme.text}`}
>
  {card.title}
</button>
```

Then pass `onOpen={handleOpenTask}` from `BoardNew.tsx` into both `ListView` instances.

- [ ] **Step 5: Commit**

```bash
git add FE/src/app/pages/BoardNew.tsx FE/src/app/components/KanbanCard.tsx FE/src/app/components/KanbanColumn.tsx FE/src/app/components/BacklogView2.tsx FE/src/app/components/ListView.tsx FE/src/app/components/HistoryView.tsx
git commit -m "feat: route board tasks to the details page"
```

### Task 7: Manual Validation And Final Sweep

**Files:**
- Modify: any files above only if validation exposes defects

- [ ] **Step 1: Build the backend**

Run:

```powershell
dotnet build
```

from:

```powershell
C:\Users\Kaspa\Desktop\kanban\pvp-kanban\BE
```

Expected:

```text
Build succeeded.
```

- [ ] **Step 2: Build and lint the frontend**

Run:

```powershell
npm run build
npm run lint
```

from:

```powershell
C:\Users\Kaspa\Desktop\kanban\pvp-kanban\FE
```

Expected:
- Vite build completes successfully
- Lint exits with code `0`

- [ ] **Step 3: Manually verify the feature flow**

Check this exact flow:

```text
1. Open a board and click a task card.
2. Confirm the app navigates to /app/{boardId}/tasks/{taskId}.
3. Confirm task details load with title, description, labels, assignee, story points, due date, priority, and task type.
4. Add a comment and confirm it appears in chronological order.
5. Edit your new comment and confirm the updated marker appears.
6. Delete your new comment and confirm it disappears.
7. Update task metadata on the page and confirm the saved values remain after refresh.
8. Use the back action or board link to return to the board.
```

- [ ] **Step 4: Commit the validation fixes if any were needed**

```bash
git add BE FE
git commit -m "fix: polish task details comments flow"
```

Only run this step if build/lint/manual validation required follow-up fixes.

---

## Spec Coverage Check

- Dedicated task route: covered in Task 5 and Task 6.
- Task details page with task metadata and comments: covered in Task 5.
- Comment create/edit/delete with simple permissions: covered in Task 2 and Task 5.
- Board-member access and author-only mutation: covered in Task 2.
- Reuse existing task editing behavior on the new page: covered in Task 4 and Task 5.
- Keep changes scoped and avoid unrelated feature work: enforced by file structure and task boundaries.
- No automated test additions: honored throughout the plan. Validation is build/lint/manual only.

## Placeholder Scan

- No `TODO`, `TBD`, or “similar to” references remain.
- All tasks list exact file paths.
- All code-editing tasks include concrete code snippets or target signatures.

## Type Consistency Check

- Backend names are consistent around `AuthorUserId`, `CreatedAt`, and `UpdatedAt`.
- Frontend names are consistent around `TaskDetails`, `TaskComment`, `getBoardTaskDetails`, `createTaskComment`, `updateTaskComment`, and `deleteTaskComment`.
- Route shape is consistently `/app/:boardId/tasks/:taskId`.
