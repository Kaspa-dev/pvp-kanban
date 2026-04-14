import { endOfWeek, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { Card } from "./cards";
import { Label } from "./labels";

export type TaskQuickFilter = "all" | "assigned" | "due";
export type BacklogStageFilter = "all" | "waiting" | "queued";

export interface TaskWorkspaceFilters {
  searchQuery: string;
  quickFilter: TaskQuickFilter;
  selectedLabelIds: number[];
}

export interface BacklogWorkspaceFilters extends TaskWorkspaceFilters {
  stageFilter: BacklogStageFilter;
}

export const DEFAULT_TASK_WORKSPACE_FILTERS: TaskWorkspaceFilters = {
  searchQuery: "",
  quickFilter: "all",
  selectedLabelIds: [],
};

export const DEFAULT_BACKLOG_WORKSPACE_FILTERS: BacklogWorkspaceFilters = {
  ...DEFAULT_TASK_WORKSPACE_FILTERS,
  stageFilter: "all",
};

export function filterCardsForWorkspace<T extends Card>(
  cards: T[],
  labels: Label[],
  filters: TaskWorkspaceFilters,
  currentUserId: number | null,
): T[] {
  return cards.filter((card) => {
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim().toLowerCase();
      const matchesSearch =
        card.title.toLowerCase().includes(query) ||
        card.labelIds.some((labelId) => {
          const label = labels.find((item) => item.id === labelId);
          return label?.name.toLowerCase().includes(query);
        });

      if (!matchesSearch) {
        return false;
      }
    }

    if (filters.selectedLabelIds.length > 0) {
      const matchesLabels = card.labelIds.some((labelId) => filters.selectedLabelIds.includes(labelId));
      if (!matchesLabels) {
        return false;
      }
    }

    if (filters.quickFilter === "assigned" && card.assigneeUserId !== currentUserId) {
      return false;
    }

    if (filters.quickFilter === "due") {
      if (!card.dueDate) {
        return false;
      }

      const dueDate = parseISO(card.dueDate);
      const weekInterval = {
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 }),
      };

      if (!isWithinInterval(dueDate, weekInterval)) {
        return false;
      }
    }

    return true;
  });
}

export function filterBacklogCards<T extends Card>(
  cards: T[],
  labels: Label[],
  filters: BacklogWorkspaceFilters,
  currentUserId: number | null,
): T[] {
  const locallyFilteredCards = filterCardsForWorkspace(cards, labels, filters, currentUserId);

  if (filters.stageFilter === "waiting") {
    return locallyFilteredCards.filter((card) => !card.isQueued);
  }

  if (filters.stageFilter === "queued") {
    return locallyFilteredCards.filter((card) => card.isQueued);
  }

  return locallyFilteredCards;
}
