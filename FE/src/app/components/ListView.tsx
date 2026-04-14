import { useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Trash2,
  Zap,
  Edit,
  FileText,
  Bug,
  Lightbulb,
  CheckSquare,
  CalendarDays,
  Undo2,
  Search,
  Tag,
  Plus,
} from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { Label } from "../utils/labels";
import { getPriorityIndicator } from "../utils/priorityColors";
import { Card, Priority, TaskAssignee, TaskType } from "../utils/cards";
import { format, parseISO } from "date-fns";
import { PriorityBadge } from "./PriorityBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { CustomScrollArea } from "./CustomScrollArea";
import {
  BacklogWorkspaceFilters,
  TaskWorkspaceFilters,
  filterBacklogCards,
  filterCardsForWorkspace,
} from "../utils/taskWorkspaceFilters";

type ListCard = Card & {
  priority?: Priority;
  taskType?: TaskType;
};

interface ListViewProps {
  mode: "active" | "backlog";
  cards: ListCard[];
  filters: TaskWorkspaceFilters | BacklogWorkspaceFilters;
  onFiltersChange: (filters: TaskWorkspaceFilters | BacklogWorkspaceFilters) => void;
  currentUserId: number | null;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
  onCreateTask?: () => void;
}

export function ListView({
  mode,
  cards,
  filters,
  onFiltersChange,
  currentUserId,
  onAssigneeChange,
  onDelete,
  onEdit,
  onMoveToBacklog,
  availableAssignees,
  labels,
  onCreateTask,
}: ListViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const isBacklogMode = mode === "backlog";

  const filteredCards = useMemo(
    () =>
      isBacklogMode
        ? filterBacklogCards(cards, labels, filters as BacklogWorkspaceFilters, currentUserId)
        : filterCardsForWorkspace(cards, labels, filters as TaskWorkspaceFilters, currentUserId),
    [cards, currentUserId, filters, isBacklogMode, labels],
  );

  const filterResultsLabel = isBacklogMode
    ? `${filteredCards.length} of ${cards.length} backlog tasks shown`
    : `${filteredCards.length} of ${cards.length} active tasks shown`;

  const setSearchQuery = (searchQuery: string) => onFiltersChange({ ...filters, searchQuery });
  const setQuickFilter = (quickFilter: TaskWorkspaceFilters["quickFilter"]) => onFiltersChange({ ...filters, quickFilter });
  const setSelectedLabelIds = (selectedLabelIds: number[]) => onFiltersChange({ ...filters, selectedLabelIds });
  const setStageFilter = (stageFilter: BacklogWorkspaceFilters["stageFilter"]) => {
    if (!isBacklogMode) {
      return;
    }

    onFiltersChange({ ...(filters as BacklogWorkspaceFilters), stageFilter });
  };
  const toggleSelectedLabelId = (labelId: number) => {
    if (filters.selectedLabelIds.includes(labelId)) {
      setSelectedLabelIds(filters.selectedLabelIds.filter((value) => value !== labelId));
      return;
    }

    setSelectedLabelIds([...filters.selectedLabelIds, labelId]);
  };
  const resetBacklogFilters = () => {
    setSearchQuery("");
    setQuickFilter("all");
    setSelectedLabelIds([]);
    setStageFilter("all");
  };
  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      todo: { label: "To Do", className: currentTheme.badge.todo },
      inProgress: { label: "In Progress", className: currentTheme.badge.inProgress },
      inReview: { label: "In Review", className: currentTheme.badge.inReview },
      done: { label: "Done", className: currentTheme.badge.done },
      backlog: { label: "Staging", className: currentTheme.badge.backlog },
    };

    const statusInfo = statusMap[status] || statusMap.todo;

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getQueueStateBadge = (isQueued: boolean) => (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        isQueued
          ? `bg-gradient-to-r ${currentTheme.primary} text-white`
          : `${currentTheme.badge.backlog} text-white`
      }`}
    >
      {isQueued ? "Queued" : "Waiting"}
    </span>
  );

  const getCardLabels = (labelIds: number[]) =>
    labelIds
      .map((labelId) => labels.find((label) => label.id === labelId))
      .filter((label): label is Label => label !== undefined);

  const getTaskTypeDisplay = (taskType?: TaskType) => {
    switch (taskType) {
      case "story":
        return { icon: <FileText className="w-3.5 h-3.5" />, label: "Story" };
      case "bug":
        return { icon: <Bug className="w-3.5 h-3.5" />, label: "Bug" };
      case "task":
        return { icon: <CheckSquare className="w-3.5 h-3.5" />, label: "Task" };
      case "spike":
        return { icon: <Lightbulb className="w-3.5 h-3.5" />, label: "Spike" };
      default:
        return null;
    }
  };

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className="flex w-full flex-col gap-6 px-8 py-6 lg:px-10 xl:px-12">
        {isBacklogMode ? (
          <>
            <div className="shrink-0">
              <div className="mb-2 flex items-center justify-between gap-4">
                <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Backlog</h1>
                {onCreateTask && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={onCreateTask}
                        className={`${primaryActionButtonClassName} gap-2 px-5 py-3 text-[15px] font-semibold`}
                        type="button"
                      >
                        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                          <span>New Task</span>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>Create a new backlog task</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className={`text-base ${currentTheme.textMuted}`}>
                Review everything waiting in backlog, narrow it with focused filters, and keep queued work visible before it moves forward.
              </p>
            </div>

            <div className={`rounded-xl border ${currentTheme.border} ${currentTheme.bgSecondary} px-4 py-4`}>
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end">
                <div className="flex min-w-0 flex-col gap-2 2xl:min-w-0 2xl:flex-[1.35]">
                  <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Search tasks</span>
                  <div className="relative min-w-0 flex-1">
                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      value={filters.searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by task title or label"
                      className={`h-11 w-full rounded-xl border ${currentTheme.inputBorder} ${currentTheme.inputBg} pl-10 pr-4 text-sm ${currentTheme.text} placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:gap-4">
                  <div className="flex min-w-0 flex-col gap-2 2xl:flex-none">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Quick filters
                    </p>
                    <div className="flex flex-wrap items-center gap-2 2xl:min-h-11">
                      {[
                        { id: "all" as const, label: "All tasks" },
                        { id: "assigned" as const, label: "Assigned to me" },
                        { id: "due" as const, label: "Due this week" },
                      ].map((filter) => {
                        const isActive = filters.quickFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => setQuickFilter(filter.id)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                              isActive
                                ? `${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`
                                : `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                            }`}
                            aria-pressed={isActive}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 2xl:flex-none">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Queue state
                    </p>
                    <div className="flex flex-wrap items-center gap-2 2xl:min-h-11">
                      {[
                        { id: "all" as const, label: "All" },
                        { id: "waiting" as const, label: "Waiting" },
                        { id: "queued" as const, label: "Queued" },
                      ].map((filter) => {
                        const isActive = (filters as BacklogWorkspaceFilters).stageFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => setStageFilter(filter.id)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                              isActive
                                ? `${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`
                                : `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                            }`}
                            aria-pressed={isActive}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 2xl:w-72 2xl:flex-none">
                    <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Labels</span>
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm ${currentTheme.border} ${currentTheme.inputBg} ${currentTheme.text}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Tag className={`h-4 w-4 shrink-0 ${filters.selectedLabelIds.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                            <span className="truncate">
                              {filters.selectedLabelIds.length > 0 ? `${filters.selectedLabelIds.length} labels selected` : "Filter by labels"}
                            </span>
                          </span>
                          <span className={`text-xs ${currentTheme.textMuted}`}>Open</span>
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          sideOffset={10}
                          align="start"
                          className={`z-50 w-72 rounded-2xl border p-3 shadow-2xl ${currentTheme.cardBg} ${currentTheme.border}`}
                        >
                          <div className="mb-3 px-1">
                            <h4 className={`text-xs font-bold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                              Filter By Labels
                            </h4>
                          </div>

                          <div className={`rounded-2xl border p-1 ${currentTheme.border}`}>
                            {labels.length === 0 ? (
                              <div className={`px-4 py-4 text-sm ${currentTheme.textMuted}`}>
                                No labels available yet.
                              </div>
                            ) : (
                              <CustomScrollArea viewportClassName="max-h-64 py-1 pr-1">
                                <div className="space-y-1">
                                  {labels.map((label) => {
                                    const isSelected = filters.selectedLabelIds.includes(label.id);

                                    return (
                                      <button
                                        key={label.id}
                                        type="button"
                                        onClick={() => toggleSelectedLabelId(label.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                          isSelected
                                            ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                                            : `${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-50"}`
                                        }`}
                                      >
                                        <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{label.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </CustomScrollArea>
                            )}
                          </div>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </div>
                </div>

                <div className="2xl:ml-auto 2xl:pt-[1.625rem]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={resetBacklogFilters}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-all ${
                          filters.searchQuery || filters.quickFilter !== "all" || filters.selectedLabelIds.length > 0 || (filters as BacklogWorkspaceFilters).stageFilter !== "all"
                            ? `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                            : `${currentTheme.bg} ${currentTheme.textMuted} ${currentTheme.border}`
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span>Clear</span>
                          <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Esc</kbd>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>Reset backlog filters</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {filters.selectedLabelIds.length > 0 && (
                <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-4 ${currentTheme.border}`}>
                  {filters.selectedLabelIds.map((labelId) => {
                    const label = labels.find((item) => item.id === labelId);
                    if (!label) {
                      return null;
                    }

                    return (
                      <button
                        key={labelId}
                        type="button"
                        onClick={() => toggleSelectedLabelId(labelId)}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                        style={{ backgroundColor: label.color }}
                      >
                        <span className="max-w-[10rem] truncate">{label.name}</span>
                        <span aria-hidden="true">x</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${currentTheme.border}`}>
                <p className={`text-xs ${currentTheme.textSecondary}`}>
                  {filterResultsLabel}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0">
              <div className="mb-2 flex items-center justify-between gap-4">
                <h1 className={`text-3xl font-bold ${currentTheme.text}`}>List</h1>
              </div>
              <p className={`text-base ${currentTheme.textMuted}`}>
                Scan every task already out of staging, then narrow the list with focused search and quick filters.
              </p>
            </div>

            <div className={`rounded-xl border ${currentTheme.border} ${currentTheme.bgSecondary} px-4 py-4`}>
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end">
                <div className="flex min-w-0 flex-col gap-2 2xl:min-w-0 2xl:flex-[1.35]">
                  <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Search tasks</span>
                  <div className="relative min-w-0 flex-1">
                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      value={filters.searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by task title or label"
                      className={`h-11 w-full rounded-xl border ${currentTheme.inputBorder} ${currentTheme.inputBg} pl-10 pr-4 text-sm ${currentTheme.text} placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:gap-4">
                  <div className="flex min-w-0 flex-col gap-2 2xl:flex-none">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Quick filters
                    </p>
                    <div className="flex flex-wrap items-center gap-2 2xl:min-h-11">
                      {[
                        { id: "all" as const, label: "All tasks" },
                        { id: "assigned" as const, label: "Assigned to me" },
                        { id: "due" as const, label: "Due this week" },
                      ].map((filter) => {
                        const isActive = filters.quickFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => setQuickFilter(filter.id)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                              isActive
                                ? `${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`
                                : `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                            }`}
                            aria-pressed={isActive}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 2xl:w-72 2xl:flex-none">
                    <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Labels</span>
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm ${currentTheme.border} ${currentTheme.inputBg} ${currentTheme.text}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Tag className={`h-4 w-4 shrink-0 ${filters.selectedLabelIds.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                            <span className="truncate">
                              {filters.selectedLabelIds.length > 0 ? `${filters.selectedLabelIds.length} labels selected` : "Filter by labels"}
                            </span>
                          </span>
                          <span className={`text-xs ${currentTheme.textMuted}`}>Open</span>
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          sideOffset={10}
                          align="start"
                          className={`z-50 w-72 rounded-2xl border p-3 shadow-2xl ${currentTheme.cardBg} ${currentTheme.border}`}
                        >
                          <div className="mb-3 px-1">
                            <h4 className={`text-xs font-bold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                              Filter By Labels
                            </h4>
                          </div>

                          <div className={`rounded-2xl border p-1 ${currentTheme.border}`}>
                            {labels.length === 0 ? (
                              <div className={`px-4 py-4 text-sm ${currentTheme.textMuted}`}>
                                No labels available yet.
                              </div>
                            ) : (
                              <CustomScrollArea viewportClassName="max-h-64 py-1 pr-1">
                                <div className="space-y-1">
                                  {labels.map((label) => {
                                    const isSelected = filters.selectedLabelIds.includes(label.id);

                                    return (
                                      <button
                                        key={label.id}
                                        type="button"
                                        onClick={() => toggleSelectedLabelId(label.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                          isSelected
                                            ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                                            : `${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-50"}`
                                        }`}
                                      >
                                        <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{label.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </CustomScrollArea>
                            )}
                          </div>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </div>
                </div>

                <div className="2xl:ml-auto 2xl:pt-[1.625rem]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setQuickFilter("all");
                          setSelectedLabelIds([]);
                        }}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-all ${
                          filters.searchQuery || filters.quickFilter !== "all" || filters.selectedLabelIds.length > 0
                            ? `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                            : `${currentTheme.bg} ${currentTheme.textMuted} ${currentTheme.border}`
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span>Clear</span>
                          <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Esc</kbd>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>Reset list filters</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {filters.selectedLabelIds.length > 0 && (
                <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-4 ${currentTheme.border}`}>
                  {filters.selectedLabelIds.map((labelId) => {
                    const label = labels.find((item) => item.id === labelId);
                    if (!label) {
                      return null;
                    }

                    return (
                      <button
                        key={labelId}
                        type="button"
                        onClick={() => toggleSelectedLabelId(labelId)}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                        style={{ backgroundColor: label.color }}
                      >
                        <span className="max-w-[10rem] truncate">{label.name}</span>
                        <span aria-hidden="true">x</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${currentTheme.border}`}>
                <p className={`text-xs ${currentTheme.textSecondary}`}>
                  {filterResultsLabel}
                </p>
              </div>
            </div>
          </>
        )}

        <div className={`${currentTheme.cardBg} rounded-[28px] border-2 ${currentTheme.border} shadow-sm overflow-hidden`}>
          <div className={`border-b px-6 py-4 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>
                  {isBacklogMode ? "Backlog Tasks" : "List View"}
                </h3>
                <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
                  {isBacklogMode
                    ? "Queued and waiting tasks stay together here so backlog grooming is easier."
                    : "A structured table for tasks that have already left staging."}
                </p>
              </div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>{filterResultsLabel}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`${currentTheme.bgSecondary} border-b-2 ${currentTheme.border}`}>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted} w-32`}>
                    Priority
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                    Title
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                    {isBacklogMode ? "Queue State" : "Status"}
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                    Labels
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                    Assignee
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                    Story Points
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${currentTheme.border}`}>
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`px-6 py-16 text-center ${currentTheme.textMuted}`}>
                      {cards.length === 0
                        ? isBacklogMode
                          ? "No backlog tasks yet."
                          : "No active workflow tasks yet."
                        : "No tasks match the current filters."}
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => {
                    const cardLabels = getCardLabels(card.labelIds);
                    const taskTypeDisplay = getTaskTypeDisplay(card.taskType);
                    const priorityIndicator = getPriorityIndicator(card.priority);
                    const formattedDueDate = card.dueDate ? format(parseISO(card.dueDate), "MMM d") : null;

                    return (
                      <tr key={card.id} className={`transition-colors hover:${currentTheme.bgSecondary}`}>
                        <td className="px-6 py-4 align-top">
                          {card.priority ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <PriorityBadge priority={card.priority} isDarkMode={isDarkMode} compact />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" sideOffset={8}>
                                {priorityIndicator?.tooltip || card.priority}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={`${currentTheme.textMuted} text-sm`}>-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex min-w-[18rem] flex-col gap-1.5">
                            {(taskTypeDisplay || formattedDueDate) && (
                              <div className={`flex flex-wrap items-center gap-2 ${currentTheme.textMuted}`}>
                                {taskTypeDisplay && (
                                  <div className="flex items-center gap-1.5">
                                    {taskTypeDisplay.icon}
                                    <span className="text-xs font-medium">{taskTypeDisplay.label}</span>
                                  </div>
                                )}
                                {formattedDueDate && (
                                  <div className="flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">{formattedDueDate}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className={`font-bold text-[15px] ${currentTheme.text}`}>{card.title}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          {isBacklogMode ? getQueueStateBadge(Boolean(card.isQueued)) : getStatusBadge(card.status)}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex min-w-[12rem] flex-wrap gap-1.5">
                            {cardLabels.length > 0 ? (
                              cardLabels.map((label) => (
                                <span
                                  key={label.id}
                                  className="rounded-md px-2 py-0.5 text-xs font-medium text-white"
                                  style={{ backgroundColor: label.color }}
                                >
                                  {label.name}
                                </span>
                              ))
                            ) : (
                              <span className={`${currentTheme.textMuted} text-sm`}>-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <AssigneePopover
                            currentAssignee={card.assignee}
                            onAssigneeChange={(newAssignee) => onAssigneeChange(card.id, newAssignee)}
                            availableAssignees={availableAssignees}
                          />
                        </td>
                        <td className="px-6 py-4 align-top">
                          {card.storyPoints ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`flex items-center gap-1.5 font-medium ${currentTheme.textSecondary}`}>
                                  <Zap className="w-4 h-4" />
                                  <span className="text-sm">{card.storyPoints}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>{card.storyPoints} story points</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={`${currentTheme.textMuted} text-sm`}>-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2">
                            {!isBacklogMode && onMoveToBacklog && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => onMoveToBacklog(card.id)}
                                    className={`${currentTheme.textMuted} hover:${currentTheme.primaryText} p-2 rounded-lg transition-all ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                    type="button"
                                  >
                                    <Undo2 className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>Move to staging</TooltipContent>
                              </Tooltip>
                            )}
                            {onEdit && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => onEdit(card.id)}
                                    className={`${currentTheme.textMuted} hover:${currentTheme.primaryText} p-2 rounded-lg transition-all ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                    type="button"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>Edit task</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onDelete(card.id, card.title)}
                                  className={`text-red-500 hover:text-red-700 p-2 rounded-lg transition-all ${isDarkMode ? "hover:bg-red-950" : "hover:bg-red-50"}`}
                                  type="button"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>Delete task</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
