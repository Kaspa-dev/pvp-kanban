Restructure the sprint workflow in this project management app so it follows a proper sprint planning and sprint execution model.

The current logic is incorrect because tasks appear to be started individually inside the sprint area.
That should be removed.

Correct sprint workflow

The app must work like this:

Users create tasks in Backlog
Backlog stores all tasks that are not yet part of an active sprint
Users can select multiple backlog tasks and add them into a planned sprint
Inside sprint planning, users can configure the sprint:
sprint name
sprint start date
sprint end date
sprint duration
optional sprint goal
Users can review and edit the sprint before starting it
When the user clicks Start Sprint, the entire sprint starts at once
All tasks inside that sprint become the active sprint tasks
The Board page must then show the tasks from the newly started sprint
The List page should show the same active sprint tasks in table format
Previous sprint results and completed work should move to History
Fix the current issue

Do not allow each task to have its own separate start action inside the sprint area.
Do not make sprint execution work task-by-task.
The sprint should be started only once, as a whole unit.

Remove the current per-task start pattern and replace it with a proper sprint planning flow.

Required product structure
Backlog

Backlog should:

store unscheduled tasks
allow task creation
allow task editing
allow task prioritization
allow selecting multiple tasks for a sprint
allow moving selected tasks into sprint planning

Backlog is not the active work area.
It is the task pool for future work.

Sprint Planning

Create a clear sprint planning area inside the Backlog page or as a dedicated planning section.

Sprint Planning should:

contain the selected tasks for the next sprint
show sprint configuration fields:
sprint name
start date
end date
duration
optional sprint goal
allow adding tasks from backlog
allow removing tasks back to backlog
allow editing sprint details before launch
show summary information such as:
number of tasks
total story points
planned dates

This should feel like preparing a sprint before execution.

Start Sprint action

There must be one clear Start Sprint action for the entire sprint.

When clicked:

the sprint becomes active
all tasks inside it move into active sprint execution
the Board page updates to show these sprint tasks
the List page shows the same tasks in list/table view
the sprint planning state becomes the active sprint
Board

Board should show only the tasks from the currently active sprint.

It should:

organize active sprint tasks by status
support kanban workflow:
To Do
In Progress
In Review
Done

If there is no active sprint, show an empty state instead of backlog tasks.

List

List should show the same active sprint tasks as Board, but in a structured table format.

History

History should store previous sprint results.

When a new sprint starts or when a sprint is completed, old sprint information and completed work should be placed in History.

History should include:

previous sprint name
sprint dates
completed tasks
completed story points
summary of finished work

History should feel like a completed sprint archive, not an active work area.

Task and sprint behavior rules
Before sprint starts
tasks live in Backlog
selected tasks can be added into a planned sprint
sprint details can be edited
nothing should appear on Board yet unless there is already an active sprint
After sprint starts
all tasks from that planned sprint appear on Board
all tasks from that planned sprint appear in List
backlog keeps only tasks that were not included in the sprint
Old sprint handling

When a new sprint becomes active:

previous sprint data should be archived into History
completed tasks and sprint summaries should be preserved in History
the new sprint becomes the source of truth for Board and List
UX requirements
Make sprint planning feel separate from task execution
Use clear headings and labels:
Backlog
Planned Sprint
Active Sprint
History
Make it obvious that sprint setup happens before sprint execution
Show one global Start Sprint button for the sprint, not one per task
Use empty states where needed to explain the workflow
Important

Do not keep the current logic where each task in the sprint area has its own start action.
That is incorrect.

The sprint must behave as one planned container of tasks that starts as a whole.

Expected result

The final product should support this clear workflow:

tasks are created in Backlog
selected tasks are added into a planned sprint
the sprint is configured and edited
the user starts the sprint once
all sprint tasks appear in Board and List
older sprint results are stored in History

The interface should make this process obvious, structured, and easy to use.