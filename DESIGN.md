# Design System

## Typography

The product uses five font families with strict roles. Body text inherits the global font, so do not add local font classes unless an element needs one of the non-body roles.

### Manrope: Primary UI

Manrope is the default app font. Use it for body copy, labels, inputs, helper text, button text, card body text, settings forms, modal content, navbar utility text, and sidebar utility text.

Implementation rule:
- Prefer inheritance from `body`.
- Use `font-body-ui` only when a component must explicitly reset back to the primary UI font.

### Roboto Condensed: Product Chrome

Roboto Condensed is the structured app voice. Use it for page titles, workspace tabs, toolbar labels, sidebar primary labels, table headers, modal titles, panel titles, and settings section headings.

Implementation rule:
- Use `font-ui-condensed`.
- Keep letter spacing at `0` or a small positive value such as `tracking-[0.01em]`.

### IBM Plex Mono: Operational Metadata

IBM Plex Mono is for calm, precise task mechanics. Use it for due dates, story points, timestamps, character counters, numeric summaries, level/XP values, compact counters, and keyboard shortcuts.

Implementation rule:
- Use `font-due-date`.
- Do not use Tailwind `font-mono` for product metadata.

### Space Grotesk: Display Accent

Space Grotesk is a sparse display accent. Use it for the board-list welcome headline, premium empty states, and kanban column titles.

Implementation rule:
- Use `font-display-accent` for one-off display moments.
- Keep `font-kanban-column-title` for kanban column headings.
- Do not use this font for dense forms, routine controls, or normal page sections.

### JetBrains Mono: System Signal

JetBrains Mono is for the UI speaking like a system. Use it for WIP limit messages, draft status codes, diagnostics, planning-poker state labels, hard caps, and technical preview/readout blocks.

Implementation rule:
- Use `font-system-signal`.
- `font-kanban-limit-message` is kept for kanban limit warnings.
- Avoid using this for normal metadata where IBM Plex Mono is calmer.

## Product Style Direction

The product should feel like a refined Kanban workspace: focused, tactile, technical enough for project work, but still warm and easy to scan. The polished reference surfaces are the Projects page, create/edit board modals, navbar, navbar profile popover, board workspace, board sidebar, board settings, and create/edit/remove task flows.

Core direction:
- Use glass chrome for persistent shell elements such as the navbar, board sidebar, and workspace tab bar.
- Use soft neutral depth for large content surfaces, with restrained borders and shadows instead of heavy card stacking.
- Use the active theme accent for intent, selection, focus, active states, and primary actions.
- Prefer flat management layouts with separators, spacing, and section rhythm over nested cards.
- Keep task metadata compact and operational: due dates, status, points, limits, counters, and keycaps should feel precise.
- Avoid generic white-card dashboards, decorative icon blocks that do not add information, and card-within-card layouts unless the nested surface is interactive content.

## Layout And Surfaces

Use the workspace shell as the default page foundation for logged-in product pages. Prefer `getWorkspaceSurfaceStyles(...)` for page background, glass headers, sidebar glass, elevated panels, and shared control surfaces.

Layout rules:
- Main workspace content should use the shared wide rhythm: `mx-auto w-full max-w-[1850px]`.
- Page backgrounds should use subtle radial or blurred theme-accent blobs rather than flat color.
- Hero panels may be elevated and atmospheric, like the Projects page welcome panel, but routine management content should stay flatter.
- Settings and dense management pages should be separated by headings, margins, dividers, and collapsible sections, not stacked inner cards.
- Scrollable regions should preserve content rhythm with `CustomScrollArea`; avoid hiding needed scrollbars or clipping shadows from dropdowns and popovers.
- Empty states should sit near the top of their container when the list is large; do not force users to scroll to the middle to discover that nothing was found.

Surface rules:
- Use `currentTheme.cardBg`, `currentTheme.bgSecondary`, `currentTheme.border`, and workspace surface helpers instead of hard-coded one-off surfaces.
- In light mode, form controls and picker popovers should still have a distinct input surface; they should not blend into modal or page backgrounds.
- In dark mode, use neutral zinc/input surfaces and soft white glows carefully; avoid adding heavy shadows where a glow or border is enough.
- Popovers/dropdowns should use the same surface family as the trigger that opened them.

## Navigation And Workspace Chrome

Navbar:
- Keep the navbar glassy, compact, and persistent. It should use `workspaceSurface.glassHeaderClassName` and `workspaceSurface.glassHeaderStyle`.
- Navbar utility controls should use `UtilityIconButton` with tooltips, consistent icon sizing, accent hover states, and accessible labels.
- The profile chip should keep real user identity content unchanged; XP and progress effects should layer around it, not replace its text.
- The profile popover should use the LevelProgressCard-style glow surface without grid decoration, with theme accent glows and a clean border.

Board workspace chrome:
- Workspace tabs should be visible as product navigation, not page cards. Active tabs use the primary gradient and white text; inactive tabs use neutral text plus subtle accent hover.
- Keyboard hints such as `Q`, `E`, and `R` should use compact keycap styling and `font-due-date`.
- Refresh/help/settings actions should stay in the top chrome and use `UtilityIconButton`, not custom button variants.

Sidebar:
- The board sidebar should remain glassy, narrow, and utility-focused.
- Primary sidebar actions, such as creating tasks and labels, use gradient action buttons with small icon motion.
- Utility/sidebar settings actions use `UtilityIconButton`; expanded state may include text, collapsed state should be icon-only.
- Bottom actions should be structurally bottom-aligned with footer/auto spacing, not merely separated by a divider.

## Buttons, Inputs, And Selects

Primary actions:
- Use gradient buttons for the main page or workflow action: create project, create task, start queue, launch/open planning poker, save changes.
- Primary buttons should use theme gradient classes, white text in light mode, dark readable text only when required for contrast, rounded-xl corners, subtle shine overlays where already used, hover scale, and focus rings from `currentTheme.focus`.
- Disabled primary buttons keep their shape and surface but reduce opacity, remove hover scale, and use `cursor-not-allowed`.

Secondary and utility actions:
- Modal secondary actions should use `getSecondaryModalActionButtonClassName(...)`.
- Icon-only or compact chrome actions should use `UtilityIconButton` rather than local custom button styling.
- Destructive actions should not become loud red by default unless the user is confirming irreversible work; routine remove/clear/delete utility actions should usually match the neutral utility style.

Inputs and selects:
- Text inputs and textareas should use `getNativeInputFieldClassName(...)` or the matching local pattern: border-2, rounded-xl, input surface, focus ring, `focus:border-transparent`, and 300ms transition.
- Select-like triggers, filter chips, due date buttons, label pickers, assignee pickers, story point inputs, and toolbar controls should use `getInputLikeControlClassName(...)` or the matching input-like border/halo behavior.
- Hover effects on input-like controls should use the predefined subtle outer halo, not a random background color jump.
- Placeholder and idle icon colors should use neutral muted theme text; selected/value icons may light up with the theme accent.
- Dropdown content should align in width with its trigger when it is part of a form control, have a consistent vertical gap, cast enough shadow to separate from modal content, and remain internally scrollable when long.

Filter and select menus:
- `WorkspaceToolbarSelect` is the reference for sort/page-size style.
- `WorkspaceFilterChip` is the reference for quick filters.
- Selected menu rows use theme accent background/text. Unselected rows use neutral card/input background and accent hover.
- Do not add explanatory text or inline creation UI inside selection-only dropdowns.

## Forms And Modals

Modal frame:
- Use `FormModalFrame` for task create/edit style forms when possible.
- Board modals and task modals should use rounded modal shells, a fixed header/footer rhythm, scrollable body content, and `UtilityIconButton` for close actions.
- Footer actions should be full-width pairs on small screens and balanced side-by-side actions on larger screens.

Form composition:
- Group fields into semantic sections with a concise section title row, a subtle accent icon, and optional help tooltip.
- Avoid verbose helper copy. Helper text should explain limits, constraints, or consequences.
- Required markers are red. Required errors should use red borders and concise inline text matching the edit board modal style.
- Character counters and numeric limits should use `font-due-date` and muted text.
- Textareas should always define a min height and max height appropriate to the context.
- Board identity controls should reuse `BoardIdentityPicker` and `BoardLogo` patterns.

Members and user search:
- Use `UserSearchPicker`, `BoardMemberListItem`, `AppAvatar`, and identicon/avatar patterns consistently.
- Hide user emails in normal display rows unless a search result genuinely needs disambiguation.
- Member sections should show counts near the title in accent text, and owner rows must appear protected.
- User picker lists should use the same input surface for trigger/search and dropdown content.

Task form controls:
- Use shared task controls for assignee, due date, labels, priority, type, and story points.
- Assignee and due date picker utility actions such as Clear, Change, or Assign to me should use subtle utility button styling.
- Priority, type, and story point chips should share input-like borders, less-rounded corners, focus rings, and hover halos instead of unrelated background-only hover states.
- Selected chips use the theme accent or semantic priority color and must maintain readable contrast in both light and dark modes.

## Board Work Surfaces

Kanban columns:
- Columns use soft neutral panels with rounded-2xl corners, subtle borders, and dedicated header surfaces.
- Column titles use the kanban title font role and should remain centered in board columns.
- Column task counts and limits use compact technical metadata. Limit meters should be thin, segmented, and theme-aware.
- Drag/drop previews use accent border/ring states and subtle insertion indicators, not large layout jumps.

Kanban cards:
- Cards are compact, tactile work objects with a clear priority accent, neutral surface, rounded-lg corners, and hover elevation.
- Priority accents reserve a consistent max width; lower priorities are visually thinner and centered in that reserved space.
- Story points sit in the top-right with reserved space so labels and title content do not overlap.
- Due dates should use the shared `TaskDueDateBadge` everywhere; no separate due-date badge implementations.
- Card utility actions such as return to backlog, edit, and delete stay hidden until hover or focus-within.
- Resting metadata may be positioned for scanability, but it must be removed from interaction flow when hover actions appear.

Tables and list-like task views:
- List, backlog, and history views use a toolbar/filter row, then a clean table/list surface with reserved height for pagination stability.
- Table header alignment should match column meaning: priority, due date, status, and assignee centered; text-heavy columns left aligned.
- Row content follows the same alignment rules as headers.
- Table row hover should use a neutral shade shift, not a strong accent wash.
- Status chips should use `BoardStatusBadge`; label displays should use `LabelBadge` or `TaskLabelSummary`.
- Assignee display and reassignment should use the shared `TaskAssigneeControl` and `AssigneePopover` path.

Staging and backlog flow:
- Staging should read as a two-region workflow: staging tasks and queue batch, separated by dividers and spacing.
- Planning poker session state should be minimalist and one-row when possible: highlighted session title, compact stats, utility buttons, and no nested cards.
- Queue actions use the same gradient primary action language as the rest of the workspace.

Empty, loading, and error states:
- Prefer skeletons or reserved-height placeholders over plain loading text when the final dimensions are known.
- Empty states should be informative, compact, and placed where users naturally look first.
- Page-level load errors stay separate from action toasts; do not mix validation messages into global toasts.

## Settings And Management Pages

Board settings is the reference for page-content management UI:
- Render settings as workspace page content, not as a modal and not as a tab.
- Use collapsible sections with centered chevron utility buttons, subtle section icons, and concise descriptions.
- Keep sections visually flat. Use dividers, spacing, and rows instead of nested cards.
- Use section names that describe the object being managed, such as Board Identity, Board Columns, and Manage Team Access.
- Put page-level Save and Reset actions at the bottom; do not save individual fields independently.
- Disable Save until something changed or until validation allows saving.
- Show backend save failures through the global corner toast, while keeping field validation inline.
- Column-limit settings should use status chips, clear header labels, compact helper text, and input validation that states usable ranges plainly.

## Feedback, Hints, And Motion

Toasts and action feedback:
- Use the Radix toast system for reusable success/error action messages.
- Show only the most recent toast. Do not stack validation messages.
- Toasts should be minimal utility cards: neutral solid surface, restrained shadow, right-side close button, accent carried by icon/text only, and readable light/dark contrast.
- Success/error copy should be custom where the frontend owns the action, or surfaced from API errors where the backend provides a useful user-facing message.

Hints and tooltips:
- Important icon-only buttons need tooltips and aria labels.
- Inline help icons should be subtle and explain constraints or consequences, not repeat the visible label.
- Coachmarks should point at stable surfaces and avoid covering essential controls.
- Recurring hints should support the feature without turning the UI into instructional clutter.

Motion:
- Use motion to clarify cause and effect: hover elevation, icon rotation, dropdown appearance, drag/drop insertion, XP pulse, and active state changes.
- Keep common transitions around 200-300ms for controls and up to 500ms for modal/action polish.
- Avoid laggy layout-heavy animation; prefer transform, opacity, shadows, and gradients.
- Respect reduced-motion preferences for larger motion effects.
- Hover/focus interactions must be keyboard accessible, not mouse-only.

## Review Checklist

- Typography follows the role rules above.
- New logged-in pages start from the workspace surface system before inventing local shells.
- Persistent chrome uses glass navbar/sidebar patterns and shared utility buttons.
- Primary actions use theme gradients; secondary and utility actions use the shared modal/action helpers.
- Inputs, selects, pickers, and chips use the shared input-like border, focus ring, hover halo, and control surface behavior.
- Dropdowns align with their trigger, have enough shadow, and scroll internally when content is long.
- Forms use section rhythm, concise helper copy, red required/error states, and character or limit counters where useful.
- Task metadata reuses shared status, label, assignee, due-date, priority, and story-point components.
- Management pages avoid nested cards and rely on dividers, spacing, rows, and collapsible sections.
- Loading states reserve realistic space; empty states are placed near the top of large containers.
- Toasts are reserved for action success/failure, not validation.
- Light and dark mode both preserve contrast, accent behavior, hover states, and focus visibility.
- Before fixing unpolished pages such as My Tasks, task page, or profile page, use this guide and prefer existing shared primitives over new styling patterns.
