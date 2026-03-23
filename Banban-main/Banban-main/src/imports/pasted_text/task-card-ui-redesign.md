Redesign the task card UI to improve visual hierarchy and make task metadata easier to understand.

Current problem:
Task type, priority, labels, assignee and other elements look too similar and create visual clutter.

Implement the following improvements:

1. Priority Stripe

Add a thin vertical stripe on the left side of the task card that represents priority.

Stripe rules:

width: 4–6px

full card height

slightly rounded corners

Priority colors:

Critical → red

High → orange

Medium → blue

Low → gray

This stripe should make it easy to quickly identify important tasks.

2. Priority Indicator

Next to the task type, show a small priority indicator:

Example:

🔴 High
🟠 Medium
🔵 Low
⚫ Critical

Add tooltip on hover explaining the priority.

3. Task Type

Replace the large colored badges with a smaller icon + label.

Examples:

Story → 📖 Story
Task → ✓ Task
Bug → 🐞 Bug
Spike → ⚡ Spike

Display it above the task title in a subtle style.

4. Task Title

The title should be the most visible element.

larger font

bold

clear spacing

5. Labels

Keep labels as colored pills but reduce their size so they do not dominate the card.

Example:

[UI] [Security] [Backend]

6. Bottom Row

Create a clean metadata row at the bottom containing:

Assignee avatar

Story points (⚡ icon + number)

Edit icon

Example layout:

[M] ⚡ 8 ✏️

7. Hover Interaction

Improve card interaction:

card slightly lifts on hover

stronger shadow

smooth animation

8. Drag & Drop

Make the entire card draggable so users can drag tasks from anywhere on the card.

9. Dark Mode Support

Ensure the new layout works correctly in both light and dark mode with strong text contrast and visible icons.

Do not change task functionality — only improve the UI layout and readability.