import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

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
