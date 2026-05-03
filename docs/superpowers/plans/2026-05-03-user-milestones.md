# User Milestones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated user milestones system with backend milestone persistence, a current-user milestones API, a profile summary entry point, and a protected milestones page reachable from the profile.

**Architecture:** Add a small milestone domain alongside the existing gamification service: static milestone definitions in code, persistent per-user unlock records in the database, and a focused service that computes progress from trusted product data and records one-time unlocks. Surface that service through `UsersController`, then add a frontend milestone client plus a new protected page at `/app/profile/milestones`, while keeping the existing profile page lightweight with a summary card and navigation action.

**Tech Stack:** ASP.NET Core, Entity Framework Core, MySQL migrations, React, TypeScript, React Router, Tailwind CSS, existing profile/theme utilities, existing authenticated API helpers.

---

## File Structure

### Backend

- Create: `BE/Models/UserMilestone.cs`
  Persist one unlocked milestone per user and milestone key.
- Modify: `BE/Models/User.cs`
  Add navigation for user milestone records.
- Modify: `BE/Data/AppDbContext.cs`
  Register `UserMilestones`, configure uniqueness and indexes, and map the new relation.
- Create: `BE/DTOs/MilestoneDtos.cs`
  Define milestone item and summary response contracts for `GET /api/users/me/milestones`.
- Create: `BE/Services/IUserMilestoneService.cs`
  Define the read/evaluate contract used by controllers and backend action flows.
- Create: `BE/Services/UserMilestoneService.cs`
  Hold the static milestone catalog, compute progress from trusted data, and record one-time unlocks.
- Modify: `BE/Program.cs`
  Register the milestone service in DI.
- Modify: `BE/Controllers/UsersController.cs`
  Add the current-user milestone endpoint.
- Modify: `BE/Controllers/BoardsController.cs`
  Invoke milestone evaluation from board creation, membership invites, comment creation, and planning poker session creation.
- Modify: `BE/Services/GamificationService.cs`
  Invoke milestone evaluation when a task first transitions to done.
- Create: `BE/Migrations/<timestamp>_AddUserMilestones.cs`
  Persist the user milestone table.
- Modify: `BE/Migrations/AppDbContextModelSnapshot.cs`
  Keep the EF snapshot aligned.

### Frontend

- Create: `FE/src/app/utils/milestones.ts`
  Add milestone types, normalization, API fetch helpers, and empty-state defaults.
- Modify: `FE/src/app/App.tsx`
  Register the protected milestones page route.
- Modify: `FE/src/app/pages/Profile.tsx`
  Load milestone summary data, render a summary card, and link to the full milestones page.
- Create: `FE/src/app/pages/ProfileMilestones.tsx`
  Build the dedicated milestones page.
- Create: `FE/src/app/components/profile/MilestoneSummaryCard.tsx`
  Render the compact milestone preview for the profile page.
- Create: `FE/src/app/components/profile/MilestoneSection.tsx`
  Render grouped milestone sections on the dedicated page.
- Create: `FE/src/app/components/profile/MilestoneCard.tsx`
  Render a single milestone with status, progress text, and unlock date.

### Verification

- Modify: any files above only if build/lint/manual verification exposes defects.

This repository does not currently contain an automated backend or frontend test project. The implementation should stay scoped to production code plus build/lint/manual verification rather than introducing a fresh test harness in the same feature branch.

---

### Task 1: Add User Milestone Persistence

**Files:**
- Create: `BE/Models/UserMilestone.cs`
- Modify: `BE/Models/User.cs`
- Modify: `BE/Data/AppDbContext.cs`
- Create: `BE/Migrations/<timestamp>_AddUserMilestones.cs`
- Modify: `BE/Migrations/AppDbContextModelSnapshot.cs`

- [ ] **Step 1: Create the milestone persistence model**

Create `BE/Models/UserMilestone.cs` with this entity:

```csharp
namespace BE.Models;

public class UserMilestone
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string MilestoneKey { get; set; } = string.Empty;
    public int ProgressValue { get; set; }
    public DateTime UnlockedAtUtc { get; set; }

    public User User { get; set; } = null!;
}
```

- [ ] **Step 2: Add the navigation collection to the user model**

Append this property to `BE/Models/User.cs` near the other user-owned collections:

```csharp
public ICollection<UserMilestone> Milestones { get; set; } = new List<UserMilestone>();
```

- [ ] **Step 3: Register the new DbSet and EF mapping**

Add this property to `BE/Data/AppDbContext.cs` near `XpEvents`:

```csharp
public DbSet<UserMilestone> UserMilestones => Set<UserMilestone>();
```

Then add this mapping block after the `XpEvent` configuration:

```csharp
modelBuilder.Entity<UserMilestone>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.MilestoneKey).IsRequired().HasMaxLength(128);
    entity.Property(e => e.ProgressValue).IsRequired();
    entity.Property(e => e.UnlockedAtUtc).IsRequired();
    entity.HasIndex(e => new { e.UserId, e.MilestoneKey }).IsUnique();
    entity.HasIndex(e => new { e.UserId, e.UnlockedAtUtc });

    entity.HasOne(e => e.User)
        .WithMany(u => u.Milestones)
        .HasForeignKey(e => e.UserId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

- [ ] **Step 4: Generate the EF migration**

Run:

```powershell
dotnet ef migrations add AddUserMilestones
```

from:

```powershell
C:\Users\Kaspa\Desktop\kanban\pvp-kanban\BE
```

Expected result:
- A new migration file appears under `BE/Migrations/`
- `AppDbContextModelSnapshot.cs` includes the `UserMilestones` entity

- [ ] **Step 5: Review the generated migration for the intended schema**

The migration should create a table equivalent to:

```csharp
migrationBuilder.CreateTable(
    name: "UserMilestones",
    columns: table => new
    {
        Id = table.Column<int>(type: "int", nullable: false)
            .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
        UserId = table.Column<int>(type: "int", nullable: false),
        MilestoneKey = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false),
        ProgressValue = table.Column<int>(type: "int", nullable: false),
        UnlockedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
    },
    constraints: table =>
    {
        table.PrimaryKey("PK_UserMilestones", x => x.Id);
        table.ForeignKey(
            name: "FK_UserMilestones_Users_UserId",
            column: x => x.UserId,
            principalTable: "Users",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);
    });
```

and create a unique index equivalent to:

```csharp
migrationBuilder.CreateIndex(
    name: "IX_UserMilestones_UserId_MilestoneKey",
    table: "UserMilestones",
    columns: new[] { "UserId", "MilestoneKey" },
    unique: true);
```

- [ ] **Step 6: Commit**

```bash
git add BE/Models/UserMilestone.cs BE/Models/User.cs BE/Data/AppDbContext.cs BE/Migrations
git commit -m "feat: add user milestone persistence"
```

### Task 2: Add Milestone DTOs And Service Skeleton

**Files:**
- Create: `BE/DTOs/MilestoneDtos.cs`
- Create: `BE/Services/IUserMilestoneService.cs`
- Create: `BE/Services/UserMilestoneService.cs`
- Modify: `BE/Program.cs`

- [ ] **Step 1: Add the milestone response DTOs**

Create `BE/DTOs/MilestoneDtos.cs` with:

```csharp
namespace BE.DTOs;

public class UserMilestoneDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string IconKey { get; set; } = string.Empty;
    public int TargetValue { get; set; }
    public int CurrentValue { get; set; }
    public bool IsUnlocked { get; set; }
    public DateTime? UnlockedAtUtc { get; set; }
    public int SortOrder { get; set; }
}

public class UserMilestoneSummaryDto
{
    public int UnlockedCount { get; set; }
    public int TotalCount { get; set; }
    public List<UserMilestoneDto> RecentUnlocked { get; set; } = new();
    public List<UserMilestoneDto> Upcoming { get; set; } = new();
}

public class UserMilestonesResponseDto
{
    public UserMilestoneSummaryDto Summary { get; set; } = new();
    public List<UserMilestoneDto> Milestones { get; set; } = new();
}
```

- [ ] **Step 2: Define the milestone service contract**

Create `BE/Services/IUserMilestoneService.cs` with:

```csharp
using BE.DTOs;

namespace BE.Services;

public interface IUserMilestoneService
{
    Task<UserMilestonesResponseDto> GetUserMilestonesAsync(int userId, CancellationToken cancellationToken);
    Task EvaluateTaskCompletionMilestonesAsync(int userId, CancellationToken cancellationToken);
    Task EvaluateBoardCreatedMilestonesAsync(int userId, CancellationToken cancellationToken);
    Task EvaluateBoardMemberInviteMilestonesAsync(int userId, CancellationToken cancellationToken);
    Task EvaluateCommentCreatedMilestonesAsync(int userId, CancellationToken cancellationToken);
    Task EvaluatePlanningPokerCreatedMilestonesAsync(int userId, CancellationToken cancellationToken);
}
```

- [ ] **Step 3: Add the service skeleton and static catalog**

Create `BE/Services/UserMilestoneService.cs` with this initial structure:

```csharp
using BE.Data;
using BE.DTOs;
using BE.Models;
using Microsoft.EntityFrameworkCore;

namespace BE.Services;

public class UserMilestoneService(AppDbContext context) : IUserMilestoneService
{
    private readonly AppDbContext _context = context;

    private static readonly MilestoneDefinition[] Definitions =
    [
        new("first-task-completed", "First Task Completed", "Complete your first task.", "tasks", "check-circle-2", 1, 10, MilestoneProgressType.TaskCompletions),
        new("tasks-completed-10", "10 Tasks Completed", "Complete ten tasks.", "tasks", "check-check", 10, 20, MilestoneProgressType.TaskCompletions),
        new("tasks-completed-25", "25 Tasks Completed", "Complete twenty-five tasks.", "tasks", "list-checks", 25, 30, MilestoneProgressType.TaskCompletions),
        new("tasks-completed-50", "50 Tasks Completed", "Complete fifty tasks.", "tasks", "trophy", 50, 40, MilestoneProgressType.TaskCompletions),
        new("first-board-created", "First Board Created", "Create your first board.", "boards", "layout-dashboard", 1, 50, MilestoneProgressType.BoardsCreated),
        new("boards-created-5", "5 Boards Created", "Create five boards.", "boards", "folder-kanban", 5, 60, MilestoneProgressType.BoardsCreated),
        new("first-member-invited", "First Member Invited", "Invite your first teammate to a board.", "collaboration", "user-plus", 1, 70, MilestoneProgressType.BoardMembersInvited),
        new("members-invited-5", "5 Members Invited", "Invite five teammates to boards you own.", "collaboration", "users", 5, 80, MilestoneProgressType.BoardMembersInvited),
        new("first-comment-posted", "First Comment Posted", "Post your first task comment.", "collaboration", "message-square", 1, 90, MilestoneProgressType.CommentsAuthored),
        new("comments-posted-25", "25 Comments Posted", "Write twenty-five task comments.", "collaboration", "messages-square", 25, 100, MilestoneProgressType.CommentsAuthored),
        new("first-planning-poker-session-created", "First Planning Poker Session Created", "Start your first planning poker session.", "planningPoker", "cards", 1, 110, MilestoneProgressType.PlanningPokerSessionsCreated),
        new("planning-poker-sessions-created-5", "5 Planning Poker Sessions Created", "Start five planning poker sessions.", "planningPoker", "sparkles", 5, 120, MilestoneProgressType.PlanningPokerSessionsCreated),
    ];

    public Task<UserMilestonesResponseDto> GetUserMilestonesAsync(int userId, CancellationToken cancellationToken)
        => throw new NotImplementedException();

    public Task EvaluateTaskCompletionMilestonesAsync(int userId, CancellationToken cancellationToken)
        => throw new NotImplementedException();

    public Task EvaluateBoardCreatedMilestonesAsync(int userId, CancellationToken cancellationToken)
        => throw new NotImplementedException();

    public Task EvaluateBoardMemberInviteMilestonesAsync(int userId, CancellationToken cancellationToken)
        => throw new NotImplementedException();

    public Task EvaluateCommentCreatedMilestonesAsync(int userId, CancellationToken cancellationToken)
        => throw new NotImplementedException();

    public Task EvaluatePlanningPokerCreatedMilestonesAsync(int userId, CancellationToken cancellationToken)
        => throw new NotImplementedException();

    private enum MilestoneProgressType
    {
        TaskCompletions,
        BoardsCreated,
        BoardMembersInvited,
        CommentsAuthored,
        PlanningPokerSessionsCreated,
    }

    private sealed record MilestoneDefinition(
        string Key,
        string Title,
        string Description,
        string Category,
        string IconKey,
        int TargetValue,
        int SortOrder,
        MilestoneProgressType ProgressType);
}
```

- [ ] **Step 4: Register the new service**

Add this line to `BE/Program.cs` next to the existing scoped services:

```csharp
builder.Services.AddScoped<IUserMilestoneService, UserMilestoneService>();
```

- [ ] **Step 5: Commit**

```bash
git add BE/DTOs/MilestoneDtos.cs BE/Services/IUserMilestoneService.cs BE/Services/UserMilestoneService.cs BE/Program.cs
git commit -m "feat: add milestone service contracts"
```

### Task 3: Implement Milestone Progress Queries And Unlock Logic

**Files:**
- Modify: `BE/Services/UserMilestoneService.cs`

- [ ] **Step 1: Add read helpers for existing unlocks and source progress**

In `BE/Services/UserMilestoneService.cs`, replace the `NotImplementedException` body approach with these helper signatures:

```csharp
private async Task<Dictionary<string, UserMilestone>> GetUnlockedMilestonesAsync(int userId, CancellationToken cancellationToken)
{
    return await _context.UserMilestones
        .Where(item => item.UserId == userId)
        .ToDictionaryAsync(item => item.MilestoneKey, cancellationToken);
}

private async Task<int> GetProgressValueAsync(int userId, MilestoneProgressType progressType, CancellationToken cancellationToken)
{
    return progressType switch
    {
        MilestoneProgressType.TaskCompletions => await _context.XpEvents
            .CountAsync(item => item.UserId == userId && item.Type == "TASK_COMPLETED" && item.XpAmount > 0, cancellationToken),
        MilestoneProgressType.BoardsCreated => await _context.Boards
            .CountAsync(item => item.CreatorId == userId, cancellationToken),
        MilestoneProgressType.BoardMembersInvited => await _context.BoardMemberships
            .CountAsync(item => item.Board.CreatorId == userId && item.UserId != userId, cancellationToken),
        MilestoneProgressType.CommentsAuthored => await _context.Comments
            .CountAsync(item => item.AuthorUserId == userId, cancellationToken),
        MilestoneProgressType.PlanningPokerSessionsCreated => await _context.PlanningPokerSessions
            .CountAsync(item => item.HostUserId == userId, cancellationToken),
        _ => 0,
    };
}
```

- [ ] **Step 2: Add the visible definition helper**

Add this helper below the progress query method:

```csharp
private static IEnumerable<MilestoneDefinition> GetVisibleDefinitions()
{
    return Definitions;
}
```

- [ ] **Step 3: Implement the response projection**

Add this `GetUserMilestonesAsync` implementation:

```csharp
public async Task<UserMilestonesResponseDto> GetUserMilestonesAsync(int userId, CancellationToken cancellationToken)
{
    Dictionary<string, UserMilestone> unlocked = await GetUnlockedMilestonesAsync(userId, cancellationToken);
    List<UserMilestoneDto> milestones = new();

    foreach (MilestoneDefinition definition in GetVisibleDefinitions().OrderBy(item => item.SortOrder))
    {
        int currentValue = await GetProgressValueAsync(userId, definition.ProgressType, cancellationToken);
        bool isUnlocked = unlocked.TryGetValue(definition.Key, out UserMilestone? unlockedRecord);

        milestones.Add(new UserMilestoneDto
        {
            Key = definition.Key,
            Title = definition.Title,
            Description = definition.Description,
            Category = definition.Category,
            IconKey = definition.IconKey,
            TargetValue = definition.TargetValue,
            CurrentValue = Math.Min(currentValue, definition.TargetValue),
            IsUnlocked = isUnlocked,
            UnlockedAtUtc = unlockedRecord?.UnlockedAtUtc,
            SortOrder = definition.SortOrder,
        });
    }

    List<UserMilestoneDto> recentUnlocked = milestones
        .Where(item => item.IsUnlocked)
        .OrderByDescending(item => item.UnlockedAtUtc)
        .Take(2)
        .ToList();

    List<UserMilestoneDto> upcoming = milestones
        .Where(item => !item.IsUnlocked)
        .OrderBy(item => item.Category)
        .ThenBy(item => item.SortOrder)
        .Take(2)
        .ToList();

    return new UserMilestonesResponseDto
    {
        Summary = new UserMilestoneSummaryDto
        {
            UnlockedCount = milestones.Count(item => item.IsUnlocked),
            TotalCount = milestones.Count,
            RecentUnlocked = recentUnlocked,
            Upcoming = upcoming,
        },
        Milestones = milestones,
    };
}
```

- [ ] **Step 4: Add the common evaluate-and-insert helper**

Append this helper set to `BE/Services/UserMilestoneService.cs`:

```csharp
private async Task EvaluateAsync(int userId, MilestoneProgressType progressType, CancellationToken cancellationToken)
{
    int currentValue = await GetProgressValueAsync(userId, progressType, cancellationToken);
    List<string> unlockedKeys = await _context.UserMilestones
        .Where(item => item.UserId == userId)
        .Select(item => item.MilestoneKey)
        .ToListAsync(cancellationToken);

    DateTime unlockedAtUtc = DateTime.UtcNow;
    List<UserMilestone> newUnlocks = GetVisibleDefinitions()
        .Where(item => item.ProgressType == progressType)
        .Where(item => currentValue >= item.TargetValue)
        .Where(item => !unlockedKeys.Contains(item.Key))
        .Select(item => new UserMilestone
        {
            UserId = userId,
            MilestoneKey = item.Key,
            ProgressValue = currentValue,
            UnlockedAtUtc = unlockedAtUtc,
        })
        .ToList();

    if (newUnlocks.Count == 0)
    {
        return;
    }

    _context.UserMilestones.AddRange(newUnlocks);
    await _context.SaveChangesAsync(cancellationToken);
}
```

Then implement the interface methods as thin wrappers:

```csharp
public Task EvaluateTaskCompletionMilestonesAsync(int userId, CancellationToken cancellationToken)
    => EvaluateAsync(userId, MilestoneProgressType.TaskCompletions, cancellationToken);

public Task EvaluateBoardCreatedMilestonesAsync(int userId, CancellationToken cancellationToken)
    => EvaluateAsync(userId, MilestoneProgressType.BoardsCreated, cancellationToken);

public Task EvaluateBoardMemberInviteMilestonesAsync(int userId, CancellationToken cancellationToken)
    => EvaluateAsync(userId, MilestoneProgressType.BoardMembersInvited, cancellationToken);

public Task EvaluateCommentCreatedMilestonesAsync(int userId, CancellationToken cancellationToken)
    => EvaluateAsync(userId, MilestoneProgressType.CommentsAuthored, cancellationToken);

public Task EvaluatePlanningPokerCreatedMilestonesAsync(int userId, CancellationToken cancellationToken)
    => EvaluateAsync(userId, MilestoneProgressType.PlanningPokerSessionsCreated, cancellationToken);
```

- [ ] **Step 5: Commit**

```bash
git add BE/Services/UserMilestoneService.cs
git commit -m "feat: implement milestone progress and unlock logic"
```

### Task 4: Expose The Current-User Milestones API

**Files:**
- Modify: `BE/Controllers/UsersController.cs`

- [ ] **Step 1: Inject the milestone service into the controller**

Add a field:

```csharp
private readonly IUserMilestoneService _userMilestoneService;
```

Extend the constructor signature:

```csharp
public UsersController(
    AppDbContext context,
    IOptions<AuthOptions> authOptions,
    IGamificationService gamificationService,
    IUserMilestoneService userMilestoneService)
```

and assign it:

```csharp
_userMilestoneService = userMilestoneService;
```

- [ ] **Step 2: Add the current-user milestone endpoint**

Insert this action below `GetMyGamificationSummary`:

```csharp
[HttpGet("me/milestones")]
public async Task<ActionResult<UserMilestonesResponseDto>> GetMyMilestones(CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out int userId))
    {
        return Unauthorized();
    }

    UserMilestonesResponseDto response = await _userMilestoneService.GetUserMilestonesAsync(userId, cancellationToken);
    return Ok(response);
}
```

- [ ] **Step 3: Commit**

```bash
git add BE/Controllers/UsersController.cs
git commit -m "feat: add current-user milestones api"
```

### Task 5: Hook Milestone Evaluation Into Existing Product Actions

**Files:**
- Modify: `BE/Services/GamificationService.cs`
- Modify: `BE/Controllers/BoardsController.cs`

- [ ] **Step 1: Evaluate task completion milestones from the existing done transition**

Update `BE/Services/GamificationService.cs` to inject `IUserMilestoneService`:

```csharp
public class GamificationService(AppDbContext context, IUserMilestoneService userMilestoneService) : IGamificationService
{
    private readonly AppDbContext _context = context;
    private readonly IUserMilestoneService _userMilestoneService = userMilestoneService;
```

Then, inside `AwardCompletionEventsAsync`, after adding XP events, append:

```csharp
await _userMilestoneService.EvaluateTaskCompletionMilestonesAsync(assigneeUserId, cancellationToken);
```

Keep this call after the `task.AssigneeId` null guard so only real assignees are evaluated.

- [ ] **Step 2: Evaluate board-created milestones after new board creation**

In `BE/Controllers/BoardsController.cs`, inject `IUserMilestoneService` alongside the existing services, then add this after the board is saved in the create-board action:

```csharp
await _userMilestoneService.EvaluateBoardCreatedMilestonesAsync(userId, cancellationToken);
```

- [ ] **Step 3: Evaluate member-invite milestones only when new members are actually added**

In the board update action where memberships are reconciled, collect new added members:

```csharp
int addedMemberCount = 0;
```

Increment when a new `BoardMembership` is created:

```csharp
addedMemberCount += 1;
```

After `SaveChangesAsync`, gate the evaluation:

```csharp
if (addedMemberCount > 0)
{
    await _userMilestoneService.EvaluateBoardMemberInviteMilestonesAsync(userId, cancellationToken);
}
```

- [ ] **Step 4: Evaluate comment and planning poker milestones from existing creation flows**

In the task-comment create action, after `_context.SaveChangesAsync(cancellationToken);`, add:

```csharp
await _userMilestoneService.EvaluateCommentCreatedMilestonesAsync(userId, cancellationToken);
```

In the planning poker session create action, after the session has been created successfully, add:

```csharp
await _userMilestoneService.EvaluatePlanningPokerCreatedMilestonesAsync(userId, cancellationToken);
```

- [ ] **Step 5: Commit**

```bash
git add BE/Services/GamificationService.cs BE/Controllers/BoardsController.cs
git commit -m "feat: evaluate milestones from product actions"
```

### Task 6: Add Frontend Milestone API Utilities

**Files:**
- Create: `FE/src/app/utils/milestones.ts`

- [ ] **Step 1: Create milestone types and helpers**

Create `FE/src/app/utils/milestones.ts` with:

```ts
import { apiJson } from "./auth";

export type MilestoneCategory = "tasks" | "boards" | "collaboration" | "planningPoker" | "sprints";

interface ApiMilestone {
  key: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  iconKey: string;
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAtUtc?: string | null;
  sortOrder: number;
}

interface ApiMilestoneSummary {
  unlockedCount: number;
  totalCount: number;
  recentUnlocked: ApiMilestone[];
  upcoming: ApiMilestone[];
}

interface ApiMilestonesResponse {
  summary: ApiMilestoneSummary;
  milestones: ApiMilestone[];
}

export interface Milestone extends ApiMilestone {
  unlockedAtUtc: string | null;
}

export interface MilestoneSummary {
  unlockedCount: number;
  totalCount: number;
  recentUnlocked: Milestone[];
  upcoming: Milestone[];
}

export interface MilestonesResponse {
  summary: MilestoneSummary;
  milestones: Milestone[];
}

function normalizeMilestone(milestone: ApiMilestone): Milestone {
  return {
    ...milestone,
    unlockedAtUtc: milestone.unlockedAtUtc ?? null,
  };
}

function normalizeMilestonesResponse(response: ApiMilestonesResponse): MilestonesResponse {
  return {
    summary: {
      unlockedCount: response.summary.unlockedCount,
      totalCount: response.summary.totalCount,
      recentUnlocked: response.summary.recentUnlocked.map(normalizeMilestone),
      upcoming: response.summary.upcoming.map(normalizeMilestone),
    },
    milestones: response.milestones.map(normalizeMilestone),
  };
}

export async function fetchCurrentUserMilestones(): Promise<MilestonesResponse> {
  const response = await apiJson<ApiMilestonesResponse>(
    "/api/users/me/milestones",
    { method: "GET" },
    "Unable to load your milestones right now.",
  );

  return normalizeMilestonesResponse(response);
}

export function getDefaultMilestonesResponse(): MilestonesResponse {
  return {
    summary: {
      unlockedCount: 0,
      totalCount: 0,
      recentUnlocked: [],
      upcoming: [],
    },
    milestones: [],
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add FE/src/app/utils/milestones.ts
git commit -m "feat: add frontend milestone client"
```

### Task 7: Add Profile Summary UI And Milestones Route

**Files:**
- Modify: `FE/src/app/App.tsx`
- Modify: `FE/src/app/pages/Profile.tsx`
- Create: `FE/src/app/components/profile/MilestoneSummaryCard.tsx`

- [ ] **Step 1: Register the protected milestones page route**

In `FE/src/app/App.tsx`, import the new page and add:

```tsx
<Route
  path="/app/profile/milestones"
  element={
    <ProtectedRoute>
      <ProfileMilestones />
    </ProtectedRoute>
  }
/>
```

immediately after the existing `/app/profile` route.

- [ ] **Step 2: Create the compact milestone summary component**

Create `FE/src/app/components/profile/MilestoneSummaryCard.tsx` with a prop shape like:

```tsx
import { ArrowRight, Milestone as MilestoneIcon, Trophy } from "lucide-react";
import { Link } from "react-router";
import { MilestonesResponse } from "../../utils/milestones";

interface MilestoneSummaryCardProps {
  milestones: MilestonesResponse;
  isLoading: boolean;
  cardClassName: string;
  themeClasses: {
    border: string;
    bg: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    primary: string;
    primaryText: string;
    primaryBg: string;
  };
}
```

Render:

```tsx
<section className={cardClassName}>
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${themeClasses.textMuted}`}>Milestones</p>
      <h2 className={`mt-3 text-3xl font-semibold tracking-tight ${themeClasses.text}`}>Rewards & Progress</h2>
      <p className={`mt-2 text-sm leading-6 ${themeClasses.textMuted}`}>
        See what you have unlocked and what is next.
      </p>
    </div>
    <div className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${themeClasses.primary} text-white shadow-md`}>
      <MilestoneIcon className="h-5 w-5" />
    </div>
  </div>

  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <div className={`rounded-[1.5rem] border p-4 ${themeClasses.border} ${themeClasses.bg}`}>
      <p className={`text-xs font-medium ${themeClasses.textMuted}`}>Unlocked</p>
      <p className={`mt-2 text-2xl font-semibold ${themeClasses.text}`}>
        {isLoading ? "..." : `${milestones.summary.unlockedCount} / ${milestones.summary.totalCount}`}
      </p>
    </div>
    <div className={`rounded-[1.5rem] border p-4 ${themeClasses.border} ${themeClasses.bg}`}>
      <p className={`text-xs font-medium ${themeClasses.textMuted}`}>Next up</p>
      <p className={`mt-2 text-sm font-semibold ${themeClasses.text}`}>
        {isLoading ? "Loading..." : milestones.summary.upcoming[0]?.title ?? "Start earning milestones"}
      </p>
    </div>
  </div>

  <Link
    to="/app/profile/milestones"
    className={`mt-6 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${themeClasses.primaryBg} ${themeClasses.primaryText}`}
  >
    <Trophy className="h-4 w-4" />
    View all milestones
    <ArrowRight className="h-4 w-4" />
  </Link>
</section>
```

- [ ] **Step 3: Load milestone summary on the profile page**

In `FE/src/app/pages/Profile.tsx`, add:

```tsx
import { fetchCurrentUserMilestones, getDefaultMilestonesResponse } from "../utils/milestones";
import { MilestoneSummaryCard } from "../components/profile/MilestoneSummaryCard";
```

Add local state:

```tsx
const [milestones, setMilestones] = useState(() => getDefaultMilestonesResponse());
const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
```

Add a `useEffect` next to the gamification summary loader:

```tsx
useEffect(() => {
  if (!user) {
    return;
  }

  let isActive = true;

  const loadMilestones = async () => {
    setIsLoadingMilestones(true);
    try {
      const response = await fetchCurrentUserMilestones();
      if (isActive) {
        setMilestones(response);
      }
    } catch {
      if (isActive) {
        setMilestones(getDefaultMilestonesResponse());
      }
    } finally {
      if (isActive) {
        setIsLoadingMilestones(false);
      }
    }
  };

  void loadMilestones();

  return () => {
    isActive = false;
  };
}, [user]);
```

- [ ] **Step 4: Place the summary card on the profile page**

In the lower content area of `Profile.tsx`, add:

```tsx
<MilestoneSummaryCard
  milestones={milestones}
  isLoading={isLoadingMilestones}
  cardClassName={sectionShellClassName}
  themeClasses={{
    border: currentTheme.border,
    bg: currentTheme.bgSecondary,
    text: currentTheme.text,
    textMuted: currentTheme.textMuted,
    textSecondary: currentTheme.textSecondary,
    primary: currentTheme.primary,
    primaryText: currentTheme.primaryText,
    primaryBg: currentTheme.primaryBg,
  }}
/>
```

Place it beside or below the existing preferences/security sections rather than inside the hero card so the profile page stays readable.

- [ ] **Step 5: Commit**

```bash
git add FE/src/app/App.tsx FE/src/app/pages/Profile.tsx FE/src/app/components/profile/MilestoneSummaryCard.tsx
git commit -m "feat: add profile milestone summary and route"
```

### Task 8: Build The Dedicated Milestones Page

**Files:**
- Create: `FE/src/app/pages/ProfileMilestones.tsx`
- Create: `FE/src/app/components/profile/MilestoneSection.tsx`
- Create: `FE/src/app/components/profile/MilestoneCard.tsx`

- [ ] **Step 1: Create the reusable milestone card**

Create `FE/src/app/components/profile/MilestoneCard.tsx` with:

```tsx
import { format } from "date-fns";
import { CheckCircle2, Lock, Trophy } from "lucide-react";
import { Milestone } from "../../utils/milestones";

interface MilestoneCardProps {
  milestone: Milestone;
  themeClasses: {
    border: string;
    bg: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    primaryBg: string;
    primaryText: string;
  };
}

export function MilestoneCard({ milestone, themeClasses }: MilestoneCardProps) {
  const isUnlocked = milestone.isUnlocked;

  return (
    <article className={`rounded-[1.5rem] border p-5 ${themeClasses.border} ${themeClasses.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${themeClasses.textMuted}`}>
            {milestone.category}
          </p>
          <h3 className={`mt-2 text-lg font-semibold ${themeClasses.text}`}>{milestone.title}</h3>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isUnlocked ? `${themeClasses.primaryBg} ${themeClasses.primaryText}` : `${themeClasses.border} ${themeClasses.textSecondary}`}`}>
          {isUnlocked ? "Unlocked" : "In Progress"}
        </div>
      </div>

      <p className={`mt-3 text-sm leading-6 ${themeClasses.textSecondary}`}>{milestone.description}</p>

      <div className={`mt-4 text-sm ${themeClasses.text}`}>
        {isUnlocked ? (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Earned {milestone.unlockedAtUtc ? format(new Date(milestone.unlockedAtUtc), "MMM d, yyyy") : "recently"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {milestone.currentValue} / {milestone.targetValue}
          </span>
        )}
      </div>

      {!isUnlocked && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className={themeClasses.textMuted}>Progress</span>
            <span className={themeClasses.textSecondary}>{milestone.currentValue} / {milestone.targetValue}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full ${themeClasses.primaryBg}`}
              style={{ width: `${Math.min(100, Math.round((milestone.currentValue / Math.max(1, milestone.targetValue)) * 100))}%` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Create the grouped section component**

Create `FE/src/app/components/profile/MilestoneSection.tsx` with:

```tsx
import { Milestone } from "../../utils/milestones";
import { MilestoneCard } from "./MilestoneCard";

interface MilestoneSectionProps {
  title: string;
  description: string;
  milestones: Milestone[];
  emptyMessage: string;
  themeClasses: {
    border: string;
    bg: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    primaryBg: string;
    primaryText: string;
  };
}

export function MilestoneSection({ title, description, milestones, emptyMessage, themeClasses }: MilestoneSectionProps) {
  return (
    <section className={`rounded-[2rem] border p-8 ${themeClasses.border} ${themeClasses.bg}`}>
      <div className="mb-6">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${themeClasses.textMuted}`}>{title}</p>
        <p className={`mt-2 text-sm leading-6 ${themeClasses.textSecondary}`}>{description}</p>
      </div>

      {milestones.length === 0 ? (
        <div className={`rounded-[1.5rem] border border-dashed p-5 text-sm ${themeClasses.textMuted}`}>
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {milestones.map((milestone) => (
            <MilestoneCard key={milestone.key} milestone={milestone} themeClasses={themeClasses} />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Create the milestones page shell**

Create `FE/src/app/pages/ProfileMilestones.tsx` with a structure parallel to the existing profile page:

```tsx
const [milestonesResponse, setMilestonesResponse] = useState(() => getDefaultMilestonesResponse());
const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState("");
```

Load data with:

```tsx
const response = await fetchCurrentUserMilestones();
setMilestonesResponse(response);
```

Group the data with:

```tsx
const unlocked = milestonesResponse.milestones.filter((item) => item.isUnlocked);
const inProgress = milestonesResponse.milestones.filter((item) => !item.isUnlocked && item.currentValue > 0);
const comingUp = milestonesResponse.milestones.filter((item) => !item.isUnlocked && item.currentValue === 0);
```

Render:

```tsx
<main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
  <header>{/* back to profile, title, summary totals */}</header>
  <MilestoneSection title="Unlocked" description="Milestones you have already earned." milestones={unlocked} emptyMessage="No milestones unlocked yet." themeClasses={themeClasses} />
  <MilestoneSection title="In Progress" description="Milestones that are already moving forward." milestones={inProgress} emptyMessage="Complete a few actions to start filling this section." themeClasses={themeClasses} />
  <MilestoneSection title="Coming Up" description="Milestones waiting for their first qualifying action." milestones={comingUp} emptyMessage="You have already started every visible milestone." themeClasses={themeClasses} />
</main>
```

Handle loading and error with:

```tsx
if (isLoading) {
  return <AuthStatusScreen title="Loading milestones..." />;
}
```

and:

```tsx
{loadError && (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {loadError}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add FE/src/app/pages/ProfileMilestones.tsx FE/src/app/components/profile/MilestoneSection.tsx FE/src/app/components/profile/MilestoneCard.tsx
git commit -m "feat: add dedicated milestones page"
```

### Task 9: Backend And Frontend Verification

**Files:**
- Modify: any files above only if verification exposes defects

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
- The Vite build completes successfully
- ESLint exits with code `0`

- [ ] **Step 3: Manually verify the milestone flows**

Check this exact flow:

```text
1. Log in and open the profile page.
2. Confirm the profile shows a milestone summary card and a "View all milestones" action.
3. Open the dedicated milestones page and confirm the sections render as Unlocked, In Progress, and Coming Up.
4. Complete a task assigned to the current user and confirm the task milestone count advances.
5. Create a board and confirm board-created milestones advance.
6. Invite a new member to a board you own and confirm collaboration milestone progress advances.
7. Post a task comment and confirm comment milestone progress advances.
8. Create a planning poker session and confirm planning poker milestone progress advances.
9. Reopen and re-complete a task, then confirm previously unlocked milestones are not duplicated.
```

- [ ] **Step 4: Commit the follow-up fixes if verification required them**

```bash
git add BE FE
git commit -m "fix: polish user milestone experience"
```

Only run this step if build/lint/manual verification exposed real defects that required code changes.

---

## Spec Coverage Check

- Dedicated milestone page reachable from profile: covered in Task 7 and Task 8.
- Unlocked, in-progress, and coming-up milestone states: covered in Task 3 and Task 8.
- Broad first-release categories: task, board, collaboration, and planning poker are implemented in Task 3 and Task 5.
- One-time permanent unlock behavior: covered in Task 1 and Task 3 through the unique database index and unlock guard.
- Backend endpoint with summary and milestone items: covered in Task 2 and Task 4.
- Profile summary card instead of an overloaded profile page: covered in Task 7.
- Clear verification for duplicate prevention and manual user flows: covered in Task 9.

## Placeholder Scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- All tasks list exact file paths.
- Code-editing tasks include concrete code blocks or exact signatures to add.
- The plan stays aligned with the actual Kanban feature set and does not include sprint-specific work.

## Type Consistency Check

- Backend naming is consistent around `UserMilestone`, `UserMilestonesResponseDto`, and `IUserMilestoneService`.
- Frontend naming is consistent around `Milestone`, `MilestonesResponse`, `fetchCurrentUserMilestones`, and `ProfileMilestones`.
- Route shape is consistently `/app/profile/milestones`.
