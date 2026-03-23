Improve the task card design to create a clearer visual hierarchy between priority, task type, labels, assignee, and story points.

Current issue:
Task type, priority, labels and other metadata look too similar and visually clutter the card.

Requirements:

1. Priority indicator (left stripe)

Replace the current priority badge with a thin colored stripe on the left side of the task card.

Example:

▌ Design new landing page

Priority colors:

Critical → red

High → orange

Medium → blue

Low → gray

The stripe should be:

4–6px wide

full card height

slightly rounded

This should make priority instantly visible.

2. Task Type redesign

Replace the current large badge with a small icon + subtle label.

Examples:

📖 Story
🐞 Bug
✓ Task
⚡ Spike

Display it above the task title in a subtle style.

3. Labels

Keep labels as colored pills, but make them slightly smaller so they do not compete with the task title.

Example:

[UI] [Security]
4. Assignee

Show assignee only as a small avatar circle instead of text.

Example:

[M]
5. Story Points

Keep story points as:

⚡ 8

Display them in the bottom row with the assignee.

6. Final task card layout

Example structure:

▌ 📖 Story

Implement authentication

[Security] [Backend]

👤 Mantas       ⚡ 8
7. Improve spacing

Increase space between title and metadata

Ensure the title is the most prominent element

Metadata should look secondary

8. Maintain compatibility

Ensure the new design works in:

Board view

Backlog view

List view

Light mode

Dark mode

Do not change task functionality, only improve the UI layout.