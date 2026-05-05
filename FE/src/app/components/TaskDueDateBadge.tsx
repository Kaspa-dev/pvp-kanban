import { CalendarDays } from "lucide-react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getTaskDueDateDisplay } from "../utils/taskDueDate";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

interface TaskDueDateBadgeProps {
  dueDate?: string | null;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function TaskDueDateBadge({
  dueDate,
  className,
  iconClassName,
  textClassName,
}: TaskDueDateBadgeProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const dueDateDisplay = getTaskDueDateDisplay(dueDate);

  if (!dueDateDisplay) {
    return null;
  }

  const toneClassName =
    dueDateDisplay.dayOffset < 0
      ? `${currentTheme.primaryText} font-semibold`
      : dueDateDisplay.dayOffset === 0
        ? `${currentTheme.primaryText} font-normal underline decoration-current/65 underline-offset-2`
        : `${currentTheme.textMuted} font-normal`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("font-due-date inline-flex items-center gap-1.5 text-xs leading-none", toneClassName, className)}>
          <CalendarDays className={cn("h-3.5 w-3.5", iconClassName)} />
          <span className={textClassName}>{dueDateDisplay.displayText}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>{dueDateDisplay.tooltipText}</TooltipContent>
    </Tooltip>
  );
}
