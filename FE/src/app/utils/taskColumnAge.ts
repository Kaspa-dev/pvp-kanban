import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { TaskStatus } from "./cards";

export type TaskColumnAgeTone = "fresh" | "stuck" | "stale";

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Staging",
  todo: "To Do",
  inProgress: "In Progress",
  inReview: "In Review",
  done: "Done",
};

function getDurationLabel(dayCount: number) {
  if (dayCount >= 7) {
    const weekCount = Math.floor(dayCount / 7);
    return {
      compact: `${weekCount}w`,
      long: `${weekCount} ${weekCount === 1 ? "week" : "weeks"}`,
    };
  }

  return {
    compact: `${dayCount}d`,
    long: `${dayCount} ${dayCount === 1 ? "day" : "days"}`,
  };
}

function getTone(dayCount: number): TaskColumnAgeTone {
  if (dayCount >= 7) {
    return "stale";
  }

  if (dayCount >= 3) {
    return "stuck";
  }

  return "fresh";
}

export function getTaskColumnAgeDisplay(
  statusEnteredAtUtc?: string | null,
  status?: TaskStatus,
  now = new Date(),
) {
  if (!statusEnteredAtUtc || !status) {
    return null;
  }

  const enteredAt = parseISO(statusEnteredAtUtc);
  if (!isValid(enteredAt)) {
    return null;
  }

  const dayCount = differenceInCalendarDays(now, enteredAt);
  if (dayCount < 1) {
    return null;
  }

  const duration = getDurationLabel(dayCount);
  const statusLabel = STATUS_LABELS[status] ?? status;

  return {
    dayCount,
    tone: getTone(dayCount),
    displayText: `${duration.compact} here`,
    tooltipText: `In ${statusLabel} for ${duration.long}`,
  };
}
