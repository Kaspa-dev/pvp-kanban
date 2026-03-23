Restructure this project management app so the task flow and sprint logic are clear, correct, and consistent across the entire product.

The app should follow a proper Agile / Scrum-style workflow:

Backlog = all unscheduled tasks
Sprint = tasks selected for the current work cycle
Board = active sprint tasks shown in kanban columns
List = the same active sprint tasks shown in table/list form
History = completed work, sprint summaries, and past activity
Main objective

Fix the product structure so users clearly understand where tasks live, how they move, and what each tab is for.

The UI should communicate this workflow clearly:

Create task in Backlog → move task into Sprint → start Sprint → task appears in Board and List → complete work → move finished work into History when sprint is completed

Required product logic
1. Backlog

Backlog should be the place where users:

create new tasks
store all unscheduled work
review future work
prioritize tasks
prepare tasks before sprint planning

Backlog must show only tasks that are not assigned to the active sprint.

Backlog should support:

create task
edit task
assign priority
assign labels
assign story points
assign assignee
move task into sprint
2. Sprint planning logic

Create clear sprint planning behavior.

Users should be able to:

create or view the current sprint
move tasks from backlog into the sprint
remove tasks from sprint back into backlog
see sprint metadata:
sprint name
sprint start date
sprint end date
duration
task count
story point count
start the sprint

Before a sprint is started, sprint tasks should exist in a planned state, separate from backlog.

3. Board

Board must show only active sprint tasks.

Board should:

display tasks that belong to the currently active sprint
organize them by status:
To Do
In Progress
In Review
Done
support drag and drop between statuses
clearly indicate that this is the active sprint workspace

If there is no active sprint, Board should not show backlog tasks.
Instead, it should show an empty state such as:

No active sprint
Start a sprint from Backlog planning to begin work
4. List

List should show the same task scope as Board, but in a table or list format.

That means:

if Board shows active sprint tasks,
List should also show active sprint tasks,
only in a structured table view for scanning, sorting, and editing.

List is not a separate workflow stage.
It is an alternative view of the same active sprint tasks.

List should support:

sorting
filtering
quick edit
viewing assignee, labels, priority, status, and story points
bulk-friendly task scanning
5. History

History should show completed work and past sprint information.

History should include:

completed tasks
completed sprints
sprint summary
total completed story points
activity or task completion timeline

History should not behave like active work management.
It should feel like an archive or completed work summary.

6. Task movement rules

Make task movement clear and consistent:

New tasks are created in Backlog
Tasks in Backlog are unscheduled
When selected for a sprint, they move into Sprint planning
When sprint starts, those tasks become visible in Board and List
During sprint execution, tasks move between statuses in Board
When sprint is completed, finished tasks move into History
Tasks removed from sprint before or during planning go back to Backlog
UX requirements
Navigation meaning

Clarify the purpose of each top navigation item:

Board = active sprint kanban
List = active sprint table
Backlog = unscheduled tasks and sprint planning
History = completed work and sprint history

Make this distinction obvious through layout, labels, headings, and empty states.

Empty states

Add clear empty states:

no backlog tasks
no sprint selected
no active sprint
no tasks in sprint
no completed work in history

Empty states should help users understand what to do next.

Screen hierarchy

Use page titles, subtitles, and helper text to explain the current context:

Backlog should explain that tasks are waiting to be planned
Board should explain that it contains active sprint work
List should explain that it is a structured view of active sprint tasks
History should explain that it contains completed work and summaries
Consistency

Keep Board and List visually connected as two views of the same dataset.
Backlog must feel like planning space.
History must feel like completed/archive space.

UI expectations

Refine the screens so the product structure feels intentional and easy to understand.

Use clear page titles and section descriptions
Show sprint status clearly
Show whether a sprint is planned, active, or completed
Improve flow clarity more than decoration
Prioritize usability, hierarchy, and product logic
Important

Do not treat Board, List, and Backlog as random separate pages.
They must be connected through one clear sprint workflow.

Do not show backlog tasks in Board when there is no active sprint.
Do not make List behave like a separate unrelated task database.
List must reflect the same active sprint task set as Board.

Expected result

The app should feel like a properly structured sprint-based task management product with a clear workflow:

users collect work in Backlog
plan tasks into a Sprint
start the Sprint
execute tasks in Board or List
review completed work in History

The final design should make this process intuitive, consistent, and obvious.