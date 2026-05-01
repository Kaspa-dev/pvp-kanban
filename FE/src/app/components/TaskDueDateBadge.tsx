import { CalendarDays } from "lucide-react";
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

interface TaskDueDateBadgeProps {
  dueDate?: string | null;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function getTaskDueDateDisplay(dueDate?: string | null) {
  if (!dueDate) {
    return null;
  }

  const parsedDueDate = parseISO(dueDate);
  if (!isValid(parsedDueDate)) {
    return null;
  }

  const formattedDate = format(parsedDueDate, "MMM d");
  const dayOffset = differenceInCalendarDays(parsedDueDate, new Date());
  const displayText = (() => {
    if (dayOffset < 0) {
      return `Overdue ${Math.abs(dayOffset)}d`;
    }

    if (dayOffset === 0) {
      return "Due today";
    }

    if (dayOffset === 1) {
      return "Due tomorrow";
    }

    if (dayOffset <= 7) {
      return `Due in ${dayOffset}d`;
    }

    return formattedDate;
  })();

  return {
    dayOffset,
    displayText,
    tooltipText: displayText !== formattedDate ? `${displayText} (${formattedDate})` : formattedDate,
  };
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
      ? "font-semibold text-rose-600"
      : dueDateDisplay.dayOffset === 0
        ? "text-orange-600 underline decoration-orange-400/70 underline-offset-2"
        : dueDateDisplay.dayOffset <= 7
          ? "text-amber-600"
          : currentTheme.textMuted;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium", toneClassName, className)}>
          <CalendarDays className={cn("h-3.5 w-3.5", iconClassName)} />
          <span className={textClassName}>{dueDateDisplay.displayText}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>{dueDateDisplay.tooltipText}</TooltipContent>
    </Tooltip>
  );
}
