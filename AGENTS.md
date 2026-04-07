# AGENTS.md

*** 

# Your role
You are a full-stack software engineer.

- You have profound expertise in working with .NET Core, TypeScript and React technologies.
- You are contributing to the development of a web application for end users.

***

# The project

## About the project
The application being developed is a project managmenet system, similar to tools like Jira, Trello, etc., but not necessarily a copy.

The application is designed for working under Kanban guidelines.

Application's primary intended qualities (and exact features that fulfill them) are as follows:
1. Notable accessibility:
  - Keyboard navigation
  - Screen reader compatibility
  - Multi-browser and multi-device accessibility
  - Clear action error and success messages
  - Hints:
    - Inline hints next to buttons and input fields
    - Tooltips on mouse hover
    - Input placeholders
    - Short helper descriptions below or near UI components
    - Global recurring corner tips
  - Error tolerance:
    - Ability to undo actions
    - Action confirmations
  - Customizable UI:
    - Themes,
    - Colors
    - Font size


Application's primary intended features are as follows:
1. Project management Kanban boards:
  - Users can create boards and assign other users as members. The user who created the board is the only one who can manage the latter, e.g., change the board's name, delete the board, add new members. Users can interact with the board right after they are included as a member. Users are added by typing in their username.
  - Board members can create new tasks in the backlog. Tasks can be assigned names, priorities, story points, etc.
  - Board members can create new sprints in the backlog. Sprints are assigned names and duration ranges.
  - A new sprint can be started if there's no ongoing sprint.
  - There's an ability to finish the sprint.
  - Board members can manage tasks status (e.g., In review, Done, etc.)
2. Planning poker:
  - When in the board's backlog page, a user can create a planning poker session.
  - When a session is created, a unique URL is created, which the member can copy and share with other members.
  - The session is fully **LIVE** and users can vote on task points according to the rules of planning poker.
  - Tasks that have an assigned amount of task points are not shown in the game.
3. Gamification:
  - Users earn XP points by finishing tasks
  - Users gain levels and badges respectively after amassing certain amounts of XP points
  - Global and per-team leaderboard showing XP points and levels.
4. Single unified window to view tasks assigned to the user and boards that the user belongs to

## Project structure

This workspace contains a full-stack application:
- Frontend project is located at `FE/`. It uses React, with code written in TypeScript, and bundled with Vite. Tailwins CSS is used for styling and Radix UI for components.
- Backend project is located at `BE/`. .NET Core is used.
- MySQL server launched via docker-compose. 

## Common Commands

### Frontend
Run from `FE/`:
```powershell
npm install
npm run dev
npm run build
npm run lint
```

### Backend
Run from `BE/`:
```powershell
dotnet restore
dotnet build
dotnet ef database update
dotnet run
```
### Database
Run from `BE/`:
```powershell
docker-compose up -d
docker-compose down
```

***

# Rules

## Working Agreements

### Frontend application
- Use existing tools (Tailwind CSS for styling and Radix UI based components) where applicable.
- Prefer existing project patterns over introducing new UI/styling libraries.
- Prefer matching existing UI style of the surrounding code.
- Reuse and extend current components before creating new ones.
- Treat `FE/src/app/components/ui/` as shared primitives. Prefer adjusting higher-level feature components first unless the primitive itself is the problem.
- Ensure all interactive elements are keyboard accessible.
- Provide meaningful labels for screen readers (aria-label, aria-* where needed).
- Avoid relying solely on color to convey meaning.
- Keep styling consistent with existing Tailwind patterns (utility-first, minimal custom CSS).

### Backend application
- When modifying backend endpoints, update corresponding frontend API calls.
- Do not commit secrets. Backend local credentials belong in `BE/.env`.
- Keep backend API, DTOs, and frontend client expectations aligned when changing request or response shapes.
- If you add EF model changes, create a migration and verify startup migration behavior in `BE/Program.cs`.

## General
- Keep changes scoped to the feature or bug being addressed.
- Prefer small, focused edits over broad refactors unless the task explicitly calls for restructuring.
- Avoid unnecessary abstractions or premature optimization.
- Do not introduce new architecture patterns unless required by the task.

## Validation Expectations
- For frontend-only changes, aim to run `npm run build` and `npm run lint` in `FE/`.
- For backend-only changes, aim to run `dotnet build` in `BE/`.
- For API or schema changes, verify the backend starts cleanly and that the affected frontend flow still works.
- If a command cannot be run, note that clearly in the handoff.

