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

## Review Checklist

- Default text should inherit Manrope.
- Page titles, modal titles, tabs, and table headers should use Roboto Condensed.
- Dates, points, XP, counters, and keycaps should use IBM Plex Mono.
- System messages and compact diagnostic labels should use JetBrains Mono.
- Space Grotesk should appear only in high-impact display moments.
- Avoid negative letter spacing in product UI.
- Avoid adding explicit font classes to every body-text element.
