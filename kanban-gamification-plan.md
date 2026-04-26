# PVP Gamification Roadmap

This document revamps the previous gamification draft so it matches the actual PVP product, codebase, and infrastructure.

PVP already presents itself as a Kanban product with playful progression, but today the implementation is still lightweight:

- Frontend: React + TypeScript + Vite
- Backend: ASP.NET Core + EF Core + MySQL
- Auth: JWT + refresh tokens
- Realtime: SignalR is already in use for planning poker
- Gamification today: derived XP and level summary only

The goal of this roadmap is to evolve that existing foundation into a real gamification subsystem without pretending the platform already has event sourcing, achievements, or leaderboard infrastructure.

---

## 1. Product Intent

Gamification in PVP should reinforce real Kanban work, not distract from it.

It should:

- reward meaningful completion and planning activity
- stay readable in compact board UI
- remain accessible across themes, contrast modes, and screen readers
- avoid rewarding actions the platform cannot reliably verify
- grow in phases without forcing a major architecture rewrite up front

Core progression model:

```text
Verified work -> XP events -> Progress summary -> Levels -> Badges -> Prestige
```

This order matters. XP events are the foundation. Everything else should build on them.

---

## 2. Current State In The Codebase

The current implementation is not a full gamification system yet. It is a thin derived-progress layer.

### What already exists

- `GET /api/users/me/progress` returns `xp`, `level`, and `tasksCompleted`
- XP is currently derived from completed assigned tasks only
- Current rule is:

```text
XP = sum(storyPoints * 10) for tasks where:
- task.AssigneeId == current user
- task.Status.Title == "done"
```

- The current 15-level ladder already exists in both frontend and backend
- The profile page already shows progress, XP, current level, and next-level progress
- The board toolbar already shows the user subtitle as `Level X`
- The history view already summarizes completed task XP totals from story points
- The app already uses identicon-style avatars through `AppAvatar` and Facehash
- Planning poker is already implemented with backend services, API endpoints, and SignalR

### What does not exist yet

- no `XpEvent` or equivalent event ledger table
- no leaderboard API
- no board leaderboard widget
- no badge or achievement tables
- no prestige persistence
- no server-owned gamification summary endpoint beyond the simple progress endpoint
- no server-stored gamification preference
- no comment-based gamification workflow
- no task activity log or audit history that could support "helpful review" or "unblocker" scoring
- no background worker, event bus, or outbox infrastructure for async gamification processing

### Important implementation constraints

- The frontend and backend both currently own level thresholds, which creates drift risk
- The backend already owns task creation and task status transitions, so that is the right place to award XP
- User preferences persisted on the server currently only cover coachmarks
- `settings.gamification` is currently local-only UI state, not a durable product preference
- `OrganizationalUnit` exists in the schema, but team-centric product flows are not yet surfaced enough to support team leaderboards as a first-class feature
- Planning poker is persisted and realtime, so it can contribute to badges and stats, but not every live room action should award XP

---

## 3. Design Principles For This Roadmap

### 3.1 Reward only what the platform can verify

The previous draft rewarded behavior such as "constructive comments," "helping unblock tasks," and "reviewing helpfully." Those are not currently reliable product events in PVP.

The production roadmap should therefore focus on actions PVP can verify now:

- task completed
- task completed before due date
- task completed with higher priority
- task completed with story-point-backed effort
- planning poker participation milestones
- planning poker recommendation application milestones
- board recent XP accumulation

The roadmap should not treat these as core XP sources yet:

- comments
- constructive reviews
- unblock actions
- spam-sensitive micro-actions

Those can be revisited only after the product has proper APIs, moderation rules, and event capture for them.

### 3.2 Backend is the source of truth

The backend must own:

- level thresholds
- level names
- lifetime XP
- current level
- current XP within level
- XP needed for next level
- weekly XP
- monthly XP
- prestige state

The frontend should render those values, not infer them independently from local tables.

### 3.3 Compact UI stays compact

Boards, cards, and member chips already operate in dense layouts. Gamification cannot make those surfaces noisy.

Rule of thumb:

- compact surfaces show status cues only
- expanded surfaces show exact numbers

### 3.4 Every repeatable reward needs anti-abuse rules

Gamification should not be attached to any task mutation unless the system can deduplicate and reverse it safely.

---

## 4. Target Architecture

The correct long-term architecture for PVP gamification is an event-backed model, not a single derived integer on the user.

### 4.1 Core entities

#### `XpEvent`

This becomes the ledger that supports progression, leaderboards, badge triggers, and audits.

Suggested fields:

```text
XpEvent
- Id
- UserId
- BoardId
- TaskId nullable
- PlanningPokerSessionId nullable
- PlanningPokerSessionTaskId nullable
- Type
- XpAmount
- AwardKey
- ReversesXpEventId nullable
- SourceSnapshotJson nullable
- CreatedAtUtc
```

Notes:

- `AwardKey` should be unique and used for dedupe
- `ReversesXpEventId` allows reopen/reversal behavior without deleting history
- `SourceSnapshotJson` is optional but useful for audits and future balancing

#### `UserProgressSnapshot` or `UserGamificationSummary`

This does not need to be persisted first. It can be projected from XP events.

Suggested response shape:

```text
UserGamificationSummary
- LifetimeXp
- CurrentLevel
- CurrentLevelName
- CurrentLevelXp
- XpForNextLevel
- XpRemainingForNextLevel
- WeeklyXp
- MonthlyXp
- TasksCompleted
- Prestige
- UnlockedBadgeCount
```

#### `BadgeDefinition`

```text
BadgeDefinition
- Id
- Key
- Name
- Description
- Category
- Tier nullable
- IsActive
```

#### `UserBadge`

```text
UserBadge
- Id
- UserId
- BadgeDefinitionId
- UnlockedAtUtc
- ProgressValue nullable
```

#### Optional `PrestigeTier`

Prestige can begin as a simple integer on a summary projection. A dedicated table is optional unless prestige needs separate theming metadata.

---

## 5. XP Rules For The Real Product

The original plan was too broad for the current platform. The practical roadmap should define XP rules around the task lifecycle PVP actually owns today.

### 5.1 Core XP event types

Initial supported event types:

```text
TASK_COMPLETED
TASK_COMPLETED_EARLY
TASK_COMPLETED_PRIORITY_BONUS
PLANNING_POKER_APPLIED_RECOMMENDATION
BADGE_UNLOCKED
TASK_COMPLETION_REVERSED
```

Later, but not core v1:

```text
PLANNING_POKER_PARTICIPATION_MILESTONE
PRESTIGE_REACHED
```

### 5.2 Completion awarding rule

XP should be awarded from backend task update flows when a task transitions:

```text
non-done -> done
```

only if:

- the task has an assignee
- the credited user is the assignee
- the transition is real, not a repeated save
- the reward has not already been awarded for the same completion state

### 5.3 Base progression remains story-point-driven

PVP already uses story points across:

- task create/edit flows
- history summaries
- planning poker recommendation application

So the default progression should remain story-point-driven.

Recommended base rule:

```text
Base XP = storyPoints * 10
```

This preserves existing product behavior and reduces surprise.

### 5.4 Verifiable bonuses

Safe early bonuses:

- due date bonus if the task is completed on or before due date
- priority bonus for `high` or `critical`
- planning poker recommendation application badge/stat hooks

These should be implemented as separate XP event types, not hidden math inside one total.

### 5.5 What not to award in v1

Do not award direct XP yet for:

- task creation
- comments
- attachments
- backlog queueing
- drag-and-drop between workflow columns
- planning poker voting itself
- planning poker room presence

These are either too spam-prone or not yet backed by durable activity semantics.

---

## 6. Levels, Ranks, And Prestige

### 6.1 Keep the existing 15-level ladder first

The codebase already has:

- a 15-level XP table
- a 15-name rank ladder

The roadmap should preserve that as the first visible progression system rather than abruptly replacing it with a new 50-level design.

Benefits:

- consistent with current UI
- less migration risk
- easier to keep FE and BE aligned

### 6.2 Remove FE/BE drift

Today both layers own level data. That should be removed.

Target rule:

- backend owns thresholds and naming
- frontend renders server summary

The frontend may keep purely visual helpers, but it should not be the canonical source of level math.

### 6.3 Prestige is a later wrapper

Prestige should exist in the roadmap, but not as an immediate replacement for the existing level system.

Recommended initial prestige rule:

```text
After reaching the top visible level and crossing the configured prestige threshold:
- prestige increments
- lifetime XP remains intact
- visible level ladder continues to reset within the same 15-level progression model
```

Prestige should be phase 4 work, after:

- XP events exist
- summary projection exists
- badges exist
- compact avatar treatment exists

---

## 7. Leaderboards

Leaderboards should be event-windowed, not lifetime-total-based.

### 7.1 Supported scopes

Initial supported scope:

- per-board

Deferred:

- per-team leaderboard

Reason:

- the database has `OrganizationalUnit`
- the product does not yet expose enough team-centric workflow for a full team leaderboard experience
- board context is the most meaningful and least noisy competitive scope for PVP right now

### 7.2 Supported time ranges

Initial supported ranges:

- this week
- this month

These should be computed from `XpEvent.CreatedAtUtc`, not from lifetime XP.

### 7.3 Recommended API

```text
GET /api/gamification/leaderboards?range=week|month&boardId=
```

Response should include:

```text
BoardLeaderboardResponse
- boardId
- range
- topUsers
- currentUserEntry nullable

LeaderboardEntry
- UserId
- Username
- DisplayName
- Level
- Prestige
- Xp
- Rank
```

Rules:

- `topUsers` should contain only the top 3 users for that board and time range
- `currentUserEntry` should always be included when the current user has rankable XP in that board and range
- `currentUserEntry` should still be returned even if the current user is already in the top 3, because the sidebar should show the current user's place and XP in a dedicated row below the ranked entries
- the API must enforce board access rules the same way board endpoints already do

### 7.4 Where leaderboard UI belongs

Recommended surfacing:

- board sidebar: weekly top 3 contributors
- board sidebar: monthly top 3 contributors
- collapsed sidebar: show only rank numbers and user identicons for the top 3 entries
- expanded sidebar: show rank, identicon, display name, and XP for the top 3 entries
- below each expanded leaderboard block, show the current user's place and XP for that same range in a dedicated row
- if the current user has no XP for that range, show them as unranked with `0 XP`

Do not introduce a global rankings page or full leaderboard table in this phase.

---

## 8. Badges And Achievements

Badges are a strong fit for PVP, but only after the event foundation exists.

### 8.1 Good early badge categories

Badges should align with real product behavior:

- completion badges
- consistency badges
- planning badges
- board participation badges

Examples:

```text
Finisher I, II, III
- complete 10 / 50 / 150 tasks

Closer
- complete a critical-priority task

On Time
- complete 10 tasks before due date

Estimator
- apply 10 planning poker recommendations

Consistent
- earn XP in 5 separate days
```

### 8.2 Badges that should wait

Do not make these core until the product supports them explicitly:

- reviewer badges
- unblocker badges
- comment-quality badges
- collaboration-quality badges

These depend on richer activity models than the app currently has.

### 8.3 Recommended API

```text
GET /api/users/me/badges
```

Optional later:

```text
GET /api/users/{id}/badges
```

Badge responses should be read-only projections from durable data.

---

## 9. Planning Poker Integration

Planning poker is already a real subsystem in PVP, so the roadmap should acknowledge it.

### 9.1 How planning poker should contribute

Planning poker should contribute through:

- milestone badges
- stats
- optional low-frequency XP hooks tied to persisted recommendation application

### 9.2 What should not happen

Planning poker should not become an easy XP farm.

Do not award notable XP for:

- joining a room
- staying connected
- casting votes repeatedly
- refreshing or reconnecting

### 9.3 Safe integration points

Good integration points:

- a badge for applying planning poker recommendations
- a badge for participating in a certain number of completed estimation rounds
- optional tiny XP for host-confirmed recommendation application, if product testing supports it

Planning poker must rely on persisted entities such as:

- session
- session task
- applied recommendation

not transient SignalR presence.

---

## 10. Avatar And UI Strategy

PVP already uses Facehash-based avatars through `AppAvatar`. That visual identity should remain intact.

### 10.1 Compact surfaces

Compact surfaces should show:

- identicon
- subtle prestige or rank ring
- optional tiered border treatment

Compact surfaces should not show:

- raw XP numbers
- multi-line rank text
- crowded badges

Examples:

- task cards
- board member chips
- toolbar profile area

### 10.2 Expanded surfaces

Expanded surfaces can show:

- current level
- level name
- lifetime XP
- weekly XP
- monthly XP
- prestige
- recent badges

Examples:

- profile page
- avatar hover card
- member details surfaces

### 10.3 Accessibility rules

Do not rely only on color to show prestige or status.

Use combinations of:

- border thickness
- ring count
- corner pattern
- iconography
- readable text in expanded views

Example progression:

```text
Prestige 0 -> plain ring
Prestige 1 -> bronze ring
Prestige 2 -> double ring
Prestige 3 -> accented segmented ring
Prestige 4+ -> stronger visual treatment
```

Any hover-card or profile representation must stay keyboard reachable and screen-reader understandable.

---

## 11. Anti-Abuse Rules

This section should only contain rules the current platform can actually implement.

### 11.1 Deduplication

Every rewardable action must generate an `AwardKey`.

Examples:

```text
task-complete:{taskId}:{userId}
task-complete-early:{taskId}:{userId}
task-complete-priority:{taskId}:{userId}:{priority}
```

That key must be unique per reward condition.

### 11.2 Reversal

If a previously completed task is moved out of `done`, the system should not silently forget the prior event.

Recommended behavior:

- create a reversal event instead of deleting the original event

Example:

```text
TASK_COMPLETED -> +80 XP
TASK_COMPLETION_REVERSED -> -80 XP
```

This preserves auditability and keeps weekly/monthly windows honest.

### 11.3 Ownership rules

Completion XP should:

- credit the assignee only
- award nothing if the task has no assignee
- not award reporter-only progress

This matches current product semantics better than guessing collaborative credit splits.

### 11.4 Repeated-action caps

For any future repeatable non-completion actions, the roadmap should require caps before launch.

Examples:

- daily cap
- per-task cap
- per-session cap

But those caps are future-facing and should not block v1 completion-based XP.

---

## 12. APIs And Data Contracts

### 12.1 Replace the narrow progress endpoint over time

Current:

```text
GET /api/users/me/progress
-> xp, level, tasksCompleted
```

Target:

```text
GET /api/users/me/gamification-summary
```

Recommended response:

```json
{
  "lifetimeXp": 1840,
  "currentLevel": 9,
  "currentLevelName": "Agile Champion",
  "currentLevelXp": 560,
  "xpForNextLevel": 460,
  "xpRemainingForNextLevel": 120,
  "weeklyXp": 180,
  "monthlyXp": 620,
  "tasksCompleted": 23,
  "prestige": 0,
  "unlockedBadgeCount": 4
}
```

The current endpoint can remain temporarily for compatibility, but the roadmap should treat the richer summary endpoint as the destination.

### 12.2 Leaderboards API

```text
GET /api/gamification/leaderboards?range=week|month&boardId=
```

### 12.3 Badges API

```text
GET /api/users/me/badges
```

### 12.4 Optional board summary endpoint

If board widgets need lighter payloads than the full leaderboard:

```text
GET /api/boards/{boardId}/gamification-summary
```

This can power:

- board sidebar cards
- board info modal summaries
- quick contributor snapshots

---

## 13. Preferences And Settings

Today the gamification toggle is local UI state only.

That is acceptable for cosmetic display preferences, but the roadmap should be explicit about it.

### Option A: keep it cosmetic

If the setting only hides gamification UI, keep it local and describe it that way.

### Option B: make it durable

If the product wants gamification visibility to follow the user across devices, add it to `UserPreferencesDto`.

Suggested addition:

```text
UserPreferencesDto
- CoachmarksEnabled
- CompletedFlows
- GamificationEnabled
```

Recommendation:

- make this durable only if the product truly wants a persistent user preference
- do not imply server persistence while it remains local-only

---

## 14. Delivery Phases

This roadmap should be delivered in phases that match the actual infrastructure gaps.

### Phase 1: Event Ledger And Authoritative Progress

Implement:

- `XpEvent` table
- completion award rules in backend task update flows
- reversal events on reopen
- backend-owned level thresholds and names
- `GET /api/users/me/gamification-summary`
- FE update so profile and board use server summary instead of duplicated level math

Success criteria:

- XP is no longer derived ad hoc from the tasks table alone
- FE and BE level drift is removed
- progress is still story-point-driven and familiar

### Phase 2: Leaderboards

Implement:

- per-board weekly leaderboard
- per-board monthly leaderboard
- board-access-safe leaderboard queries
- board sidebar leaderboard widget
- top 3 users by XP for each board range
- current user's place and XP shown below each board range list
- collapsed sidebar presentation with rank numbers and identicons only
- expanded sidebar presentation with rank, identicon, display name, and XP

Success criteria:

- rankings use event timestamps
- lifetime XP does not drive leaderboard placement
- the collapsed sidebar stays visually compact
- the expanded sidebar shows readable weekly and monthly detail without turning into a full rankings page

### Phase 3: Badges And Achievement History

Implement:

- `BadgeDefinition`
- `UserBadge`
- badge unlock projection rules
- profile badge display
- achievement history surface
- planning poker milestone badges

Success criteria:

- badges are powered by durable event data or persisted planning poker facts
- no badge relies on transient socket state

### Phase 4: Prestige And Advanced Presentation

Implement:

- prestige persistence
- avatar ring/border treatment
- richer hover cards
- optional prestige-themed surfaces
- future team leaderboards only if team workflows become product-visible

Success criteria:

- prestige enriches long-term identity without cluttering compact UI
- accessibility remains intact

---

## 15. Testing And Validation

The roadmap should require verification at both backend and frontend levels.

### Backend validation

- XP is awarded only on valid `non-done -> done` transitions
- repeated save operations do not duplicate awards
- reopen creates reversal behavior correctly
- weekly and monthly leaderboard windows are computed from XP event timestamps
- board leaderboard results are filtered by board membership access
- weekly and monthly board responses return exactly the top 3 entries plus the current user's placement block
- planning poker badge conditions depend on persisted session facts

### Frontend validation

- profile renders authoritative summary values from backend data
- board toolbar level display uses backend-owned progression data
- compact avatar treatments remain readable in light and dark themes
- hover cards and profile surfaces provide readable textual context
- gamification visuals do not rely only on color
- keyboard and screen-reader access remain intact

### Product validation

- users understand why they earned XP
- leaderboard placement feels fair
- planning poker does not become a farming shortcut
- the system rewards delivery and estimation, not busywork

---

## 16. Final Product Direction

The correct gamification direction for PVP is not a giant all-at-once feature drop.

It is a layered system:

```text
Phase 1:
verified XP ledger + authoritative progress

Phase 2:
per-board recent-activity leaderboards

Phase 3:
badges and achievement history

Phase 4:
prestige and richer presentation
```

This keeps the current product promise intact while grounding every step in what the application actually supports today.

---

## 17. Final Recommendation

The revised implementation strategy should be:

- keep story points as the backbone of progression
- move progression authority to the backend
- build on an XP event ledger rather than derived totals alone
- support per-board leaderboards before considering global or team leaderboards
- use planning poker as a milestone source, not an XP exploit
- keep avatars visually compact and accessible
- treat prestige as later-stage polish, not day-one complexity

In short:

```text
Keep the current PVP gamification spirit.
Replace the generic assumptions.
Build the system on durable, verifiable product events.
```
