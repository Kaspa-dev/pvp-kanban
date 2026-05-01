import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { BoardWorkflowStatusKey } from "../utils/boards";

const STATUS_LABELS: Record<BoardWorkflowStatusKey, string> = {
  todo: "To Do",
  inProgress: "In Progress",
  inReview: "In Review",
  done: "Done",
  backlog: "Staging",
};

interface BoardStatusBadgeProps {
  statusKey: BoardWorkflowStatusKey;
}

export function BoardStatusBadge({ statusKey }: BoardStatusBadgeProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const badgeClassName = currentTheme.badge[statusKey] ?? currentTheme.badge.todo;
  const label = STATUS_LABELS[statusKey] ?? STATUS_LABELS.todo;

  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold text-white dark:text-black ${badgeClassName}`}>
      {label}
    </span>
  );
}
