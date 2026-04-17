import { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Bug,
  CalendarDays,
  CheckSquare,
  Edit,
  FileText,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { AssigneePopover } from "./AssigneePopover";
import { OverflowTooltip } from "./OverflowTooltip";
import { Label } from "../utils/labels";
import { getPriorityIndicator } from "../utils/priorityColors";
import {
  BacklogStageFilter,
  BoardTaskListPage,
  BoardTaskSortDirection,
  BoardTaskSortKey,
  Card,
  getBoardTaskPage,
  Priority,
  TaskAssignee,
  TaskQuickFilter,
  TaskType,
} from "../utils/cards";
import { PriorityBadge } from "./PriorityBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { CustomScrollArea } from "./CustomScrollArea";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import {
  BacklogWorkspaceFilters,
  TaskWorkspaceFilters,
} from "../utils/taskWorkspaceFilters";
import { TaskLabelSummary } from "./TaskLabelSummary";
import { TaskIndexHeaderCell } from "./TaskIndexHeaderCell";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./ui/table";

type ListCard = Card & {
  priority?: Priority;
  taskType?: TaskType;
};

type SortState = {
  key: BoardTaskSortKey | null;
  direction: BoardTaskSortDirection | null;
};

const TASKS_PER_PAGE = 10;
const TASK_INDEX_ROW_HEIGHT_REM = 3.75;
const TASK_INDEX_HEADER_HEIGHT_REM = 3;
const EMPTY_TASK_PAGE: BoardTaskListPage = {
  items: [],
  page: 1,
  pageSize: TASKS_PER_PAGE,
  totalItems: 0,
  totalPages: 0,
};

function buildPaginationItems(totalPages: number, currentPage: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalizedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items: Array<number | "ellipsis"> = [];
  normalizedPages.forEach((page, index) => {
    if (index > 0 && page - normalizedPages[index - 1] > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

function getResultsSummaryText(page: number, pageSize: number, totalItems: number): string {
  if (totalItems === 0) {
    return "Showing 0 of 0 tasks";
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `Showing ${start}-${end} of ${totalItems} tasks`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(target.closest("[contenteditable='true']"))
  );
}

interface ListViewProps {
  mode: "active" | "backlog";
  boardId: number;
  taskDataVersion: number;
  refreshToken: number;
  onRefreshingChange?: (isRefreshing: boolean) => void;
  filters: TaskWorkspaceFilters | BacklogWorkspaceFilters;
  onFiltersChange: (filters: TaskWorkspaceFilters | BacklogWorkspaceFilters) => void;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void | Promise<void>;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void | Promise<void>;
  onAddToQueue?: (cardId: number) => void | Promise<void>;
  onRemoveFromQueue?: (cardId: number) => void | Promise<void>;
  availableAssignees: TaskAssignee[];
  labels: Label[];
  onCreateTask?: () => void;
}

export function ListView({
  mode,
  boardId,
  taskDataVersion,
  refreshToken,
  onRefreshingChange,
  filters,
  onFiltersChange,
  onAssigneeChange,
  onDelete,
  onEdit,
  onMoveToBacklog,
  onAddToQueue,
  onRemoveFromQueue,
  availableAssignees,
  labels,
  onCreateTask,
}: ListViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const isBacklogMode = mode === "backlog";
  const [pendingRowIds, setPendingRowIds] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = TASKS_PER_PAGE;
  const [taskPage, setTaskPage] = useState<BoardTaskListPage>(EMPTY_TASK_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState("");

  const workspaceWidthClassName = "mx-auto w-full max-w-[1850px]";
  const selectedLabelKey = [...filters.selectedLabelIds].sort((left, right) => left - right).join(",");
  const stageFilter = isBacklogMode ? (filters as BacklogWorkspaceFilters).stageFilter : "all";
  const paginationItems = useMemo(
    () => buildPaginationItems(Math.max(taskPage.totalPages, 1), taskPage.page),
    [taskPage.page, taskPage.totalPages],
  );
  const missingRowCount = Math.max(0, TASKS_PER_PAGE - taskPage.items.length);
  const reservedTableMinHeight =
    missingRowCount > 0
      ? `calc(${TASK_INDEX_HEADER_HEIGHT_REM + TASKS_PER_PAGE * TASK_INDEX_ROW_HEIGHT_REM}rem + 2px)`
      : undefined;
  const hasActiveFilters =
    filters.searchQuery.length > 0 ||
    filters.quickFilter !== "all" ||
    filters.selectedLabelIds.length > 0 ||
    (isBacklogMode && stageFilter !== "all");

  useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();
    if (normalizedSearch === filters.searchQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onFiltersChange({
        ...filters,
        searchQuery: normalizedSearch,
      });
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters, onFiltersChange, searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.quickFilter, filters.searchQuery, selectedLabelKey, stageFilter, sortState.direction, sortState.key]);

  useEffect(() => {
    if (!Number.isFinite(boardId)) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setIsLoading(true);
    setLoadError("");
    onRefreshingChange?.(true);

    void getBoardTaskPage(boardId, {
      scope: isBacklogMode ? "backlog" : "active",
      q: filters.searchQuery,
      quickFilter: filters.quickFilter,
      labelIds: filters.selectedLabelIds,
      stageFilter: isBacklogMode ? (filters as BacklogWorkspaceFilters).stageFilter : undefined,
      sort: sortState.key ?? undefined,
      direction: sortState.direction ?? undefined,
      page: currentPage,
      pageSize,
      signal: controller.signal,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setTaskPage(response);
        setHasLoadedOnce(true);
        if (response.page !== currentPage) {
          setCurrentPage(response.page);
        }
      })
      .catch((error) => {
        if (!isActive || isAbortError(error)) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load tasks right now.";
        setLoadError(message);
        setHasLoadedOnce(true);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsLoading(false);
        onRefreshingChange?.(false);
      });

    return () => {
      isActive = false;
      controller.abort();
      onRefreshingChange?.(false);
    };
  }, [
    boardId,
    currentPage,
    filters.quickFilter,
    filters.searchQuery,
    isBacklogMode,
    onRefreshingChange,
    pageSize,
    refreshToken,
    selectedLabelKey,
    sortState.direction,
    sortState.key,
    stageFilter,
    taskDataVersion,
  ]);

  useEffect(() => {
    const totalPages = Math.max(taskPage.totalPages, 1);

    const handlePaginationKeybind = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableKeyboardTarget(event.target)
      ) {
        return;
      }

      const key = event.key;
      if (key !== "Tab" && key !== "Shift") {
        return;
      }

      const activeElement = document.activeElement;
      const isDocumentLevelFocus =
        activeElement === document.body || activeElement === document.documentElement;

      if (!isDocumentLevelFocus) {
        return;
      }

      event.preventDefault();

      if (key === "Shift" && taskPage.page > 1) {
        setCurrentPage((page) => Math.max(page - 1, 1));
        return;
      }

      if (key === "Tab" && taskPage.page < totalPages) {
        setCurrentPage((page) => Math.min(page + 1, totalPages));
      }
    };

    window.addEventListener("keydown", handlePaginationKeybind);
    return () => {
      window.removeEventListener("keydown", handlePaginationKeybind);
    };
  }, [taskPage.page, taskPage.totalPages]);

  const setQuickFilter = (quickFilter: TaskQuickFilter) => onFiltersChange({ ...filters, quickFilter });
  const setSelectedLabelIds = (selectedLabelIds: number[]) => onFiltersChange({ ...filters, selectedLabelIds });
  const setStageFilter = (nextStageFilter: BacklogStageFilter) => {
    if (!isBacklogMode) {
      return;
    }

    onFiltersChange({
      ...(filters as BacklogWorkspaceFilters),
      stageFilter: nextStageFilter,
    });
  };

  const toggleSelectedLabelId = (labelId: number) => {
    if (filters.selectedLabelIds.includes(labelId)) {
      setSelectedLabelIds(filters.selectedLabelIds.filter((value) => value !== labelId));
      return;
    }

    setSelectedLabelIds([...filters.selectedLabelIds, labelId]);
  };

  const clearCurrentFilters = () => {
    setSearchInput("");
    if (isBacklogMode) {
      onFiltersChange({
        ...(filters as BacklogWorkspaceFilters),
        searchQuery: "",
        quickFilter: "all",
        selectedLabelIds: [],
        stageFilter: "all",
      });
      return;
    }

    onFiltersChange({
      ...filters,
      searchQuery: "",
      quickFilter: "all",
      selectedLabelIds: [],
    });
  };

  const toggleSort = (key: BoardTaskSortKey) => {
    setSortState((current) => {
      if (current.key !== key) {
        return { key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }

      return { key: null, direction: null };
    });
  };

  const runRowAction = async (cardId: number, action: () => void | Promise<void>) => {
    setPendingRowIds((current) => (current.includes(cardId) ? current : [...current, cardId]));
    try {
      await Promise.resolve(action());
    } finally {
      setPendingRowIds((current) => current.filter((value) => value !== cardId));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      todo: { label: "To Do", className: currentTheme.badge.todo },
      inProgress: { label: "In Progress", className: currentTheme.badge.inProgress },
      inReview: { label: "In Review", className: currentTheme.badge.inReview },
      done: { label: "Done", className: currentTheme.badge.done },
      backlog: { label: "Staging", className: currentTheme.badge.backlog },
    };

    const statusInfo = statusMap[status] || statusMap.todo;

    return (
      <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold text-white ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getQueueBadge = (isQueued: boolean) => (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${
        isQueued
          ? `${currentTheme.primaryBg} ${currentTheme.primaryText} border ${currentTheme.primaryBorder}`
          : `${currentTheme.bgSecondary} ${currentTheme.textMuted} border ${currentTheme.border}`
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
        return { icon: <FileText className="h-3.5 w-3.5" />, label: "Story" };
      case "bug":
        return { icon: <Bug className="h-3.5 w-3.5" />, label: "Bug" };
      case "task":
        return { icon: <CheckSquare className="h-3.5 w-3.5" />, label: "Task" };
      case "spike":
        return { icon: <Lightbulb className="h-3.5 w-3.5" />, label: "Spike" };
      default:
        return null;
    }
  };

  const toolbarLabelClassName = `text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`;
  const toolbarControlClassName = `h-11 rounded-xl border ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text}`;
  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;
  const iconActionButtonClassName = `${currentTheme.textMuted} hover:${currentTheme.text} inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/[0.05]" : "hover:bg-slate-100"}`;
  const rowTextActionButtonClassName = `inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${currentTheme.focus} ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"} hover:${currentTheme.text}`;
  const tableSectionTitleClassName = `text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`;
  const taskIndexHeaderTextClassName = currentTheme.textSecondary;
  const taskIndexHeaderActiveTextClassName = currentTheme.text;
  const taskIndexHeaderHoverClassName = `hover:${currentTheme.text}`;
  const taskIndexDividerClassName = "";

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className={`${workspaceWidthClassName} flex flex-col px-8 py-6 lg:px-10 xl:px-12`}>
        <div className="shrink-0" data-coachmark={isBacklogMode ? "backlog-header" : "list-header"}>
          <div className="flex items-center justify-between gap-4">
            <h1 className={`font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              {isBacklogMode ? "Backlog" : "List"}
            </h1>
            {onCreateTask && isBacklogMode && (
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
          <p className={`mt-2 text-base ${currentTheme.textMuted}`}>
            {isBacklogMode
              ? "Review upcoming work, stage ready tasks into the queue, and keep the backlog prepared for what comes next."
              : "Scan active board work in one place, then sort and filter it to focus on what needs attention right now."}
          </p>
        </div>

        <div
          className={`mt-6 border-y ${currentTheme.border} py-4`}
          data-coachmark={isBacklogMode ? "backlog-filters" : "list-filters"}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="flex min-w-0 flex-col gap-2 xl:flex-[1.25]">
              <span className={toolbarLabelClassName}>Search tasks</span>
              <div className="relative min-w-0 flex-1">
                <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by task title or label"
                  className={`${toolbarControlClassName} w-full pl-10 pr-4 text-sm placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2`}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex flex-col gap-2">
                <span className={toolbarLabelClassName}>Quick filters</span>
                <div className="flex flex-wrap items-center gap-2 xl:min-h-11">
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

              {isBacklogMode && (
                <div className="flex flex-col gap-2">
                  <span className={toolbarLabelClassName}>Queue</span>
                  <div className="flex flex-wrap items-center gap-2 xl:min-h-11">
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
              )}

              <div className="flex min-w-0 flex-col gap-2 xl:w-72 xl:flex-none">
                <span className={toolbarLabelClassName}>Labels</span>
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button
                      type="button"
                      className={`${toolbarControlClassName} flex w-full items-center justify-between px-3 text-left text-sm`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Tag className={`h-4 w-4 shrink-0 ${filters.selectedLabelIds.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                        <span className="truncate">
                          {filters.selectedLabelIds.length > 0 ? `${filters.selectedLabelIds.length} labels selected` : "Filter by labels"}
                        </span>
                      </span>
                      <span className={`text-xs ${currentTheme.textMuted}`}>Labels</span>
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      sideOffset={10}
                      align="start"
                      className={`z-50 w-72 rounded-xl border p-3 shadow-lg ${currentTheme.cardBg} ${currentTheme.border}`}
                    >
                      <div className="mb-3 px-1">
                        <h4 className={toolbarLabelClassName}>Filter by labels</h4>
                      </div>

                      <div className={`border ${currentTheme.border}`}>
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
                                    <OverflowTooltip
                                      text={label.name}
                                      className="min-w-0 flex-1 truncate text-sm font-medium"
                                      tooltipClassName="max-w-none whitespace-nowrap"
                                    />
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

            <div className="xl:ml-auto xl:pt-[1.625rem]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={clearCurrentFilters}
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-all ${
                      hasActiveFilters
                        ? `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                        : `${currentTheme.bg} ${currentTheme.textMuted} ${currentTheme.border}`
                    }`}
                    disabled={!hasActiveFilters}
                  >
                    <span>Clear</span>
                    <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Esc</kbd>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {isBacklogMode ? "Reset backlog filters" : "Reset list filters"}
                </TooltipContent>
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
                    className="inline-flex h-7 items-center gap-2 rounded-full px-3 text-xs font-semibold text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    <OverflowTooltip
                      text={label.name}
                      className="max-w-[10rem] truncate"
                      tooltipClassName="max-w-none whitespace-nowrap"
                    />
                    <span aria-hidden="true">x</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6" data-coachmark={isBacklogMode ? "backlog-table" : "list-table"}>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className={tableSectionTitleClassName}>
              {isBacklogMode ? "Backlog tasks" : "Active board tasks"}
            </span>
            <span className={`text-xs ${currentTheme.textSecondary}`}>
              {getResultsSummaryText(taskPage.page, taskPage.pageSize, taskPage.totalItems)}
            </span>
          </div>

          <div
            className={`rounded-lg border ${currentTheme.border}`}
            style={reservedTableMinHeight ? { minHeight: reservedTableMinHeight } : undefined}
          >
            <Table className="min-w-[1120px] table-fixed border-collapse">
              <TableHeader className={isDarkMode ? "bg-white/[0.025]" : "bg-black/[0.015]"}>
                <TableRow className={`border-b-2 ${currentTheme.border} hover:bg-transparent`}>
                  <TaskIndexHeaderCell
                    label="Priority"
                    align="center"
                    widthClassName="w-36"
                    dividerClassName={taskIndexDividerClassName}
                    sortDirection={sortState.key === "priority" ? sortState.direction : null}
                    onSort={() => toggleSort("priority")}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                  <TaskIndexHeaderCell
                    label="Title"
                    widthClassName="w-[26rem]"
                    dividerClassName={taskIndexDividerClassName}
                    sortDirection={sortState.key === "title" ? sortState.direction : null}
                    onSort={() => toggleSort("title")}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                  <TaskIndexHeaderCell
                    label={isBacklogMode ? "Queue" : "Status"}
                    align="center"
                    widthClassName="w-36"
                    dividerClassName={taskIndexDividerClassName}
                    sortDirection={sortState.key === (isBacklogMode ? "readiness" : "status") ? sortState.direction : null}
                    onSort={() => toggleSort(isBacklogMode ? "readiness" : "status")}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                  <TaskIndexHeaderCell
                    label="Labels"
                    widthClassName="w-[18rem]"
                    dividerClassName={taskIndexDividerClassName}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                  <TaskIndexHeaderCell
                    label="Assignee"
                    align="center"
                    widthClassName="w-36"
                    dividerClassName={taskIndexDividerClassName}
                    sortDirection={sortState.key === "assignee" ? sortState.direction : null}
                    onSort={() => toggleSort("assignee")}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                  <TaskIndexHeaderCell
                    label="Story Points"
                    align="center"
                    widthClassName="w-36"
                    dividerClassName={taskIndexDividerClassName}
                    sortDirection={sortState.key === "storyPoints" ? sortState.direction : null}
                    onSort={() => toggleSort("storyPoints")}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                  <TaskIndexHeaderCell
                    label=""
                    align="right"
                    widthClassName={isBacklogMode ? "w-[17rem]" : "w-40"}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                </TableRow>
              </TableHeader>
              <TableBody className={`align-top ${taskPage.items.length > 0 && missingRowCount > 0 ? "[&_tr:last-child]:border-b" : ""}`}>
                {taskPage.items.length === 0 && !isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className={`px-6 py-16 text-center ${currentTheme.textMuted}`}>
                      {loadError || "No tasks match the current filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {taskPage.items.map((card) => {
                      const cardLabels = getCardLabels(card.labelIds);
                      const taskTypeDisplay = getTaskTypeDisplay(card.taskType);
                      const priorityIndicator = getPriorityIndicator(card.priority);
                      const formattedDueDate = card.dueDate ? format(parseISO(card.dueDate), "MMM d") : null;
                      const isRowPending = pendingRowIds.includes(card.id);
                      const isLastVisibleRow = card.id === taskPage.items[taskPage.items.length - 1]?.id;
                      const shouldDropBottomBorder = isLastVisibleRow && missingRowCount === 0;

                      return (
                        <TableRow
                          key={card.id}
                          aria-busy={isRowPending}
                          className={`h-[3.75rem] border-b ${shouldDropBottomBorder ? "last:border-b-0" : ""} ${currentTheme.border} transition-colors hover:${currentTheme.bgSecondary} ${isRowPending ? "opacity-55" : ""}`}
                        >
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            {card.priority ? (
                              <div className="flex items-center justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      <PriorityBadge priority={card.priority} isDarkMode={isDarkMode} variant="table" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" sideOffset={8}>
                                    {priorityIndicator?.tooltip || card.priority}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="sr-only">No priority</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            <div className="flex min-w-0 flex-col gap-1.5">
                              {(taskTypeDisplay || formattedDueDate) && (
                                <div className={`flex flex-wrap items-center gap-3 text-xs ${currentTheme.textMuted}`}>
                                  {taskTypeDisplay && (
                                    <span className="inline-flex items-center gap-1.5">
                                      {taskTypeDisplay.icon}
                                      <span>{taskTypeDisplay.label}</span>
                                    </span>
                                  )}
                                  {formattedDueDate && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <CalendarDays className="h-3.5 w-3.5" />
                                      <span>{formattedDueDate}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                              <OverflowTooltip
                                text={card.title}
                                className={`block max-w-full truncate text-[15px] font-semibold ${currentTheme.text}`}
                                tooltipClassName="max-w-none whitespace-nowrap"
                              />
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            <div className="flex items-center justify-center">
                              {isBacklogMode ? getQueueBadge(Boolean(card.isQueued)) : getStatusBadge(card.status)}
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            <div className="flex min-h-8 items-center">
                              {cardLabels.length > 0 ? (
                                <TaskLabelSummary labels={cardLabels} maxVisible={3} />
                              ) : (
                                <span className="sr-only">No labels</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            <div className={`flex items-center justify-center ${isRowPending ? "pointer-events-none" : ""}`}>
                              <AssigneePopover
                                currentAssignee={card.assignee}
                                onAssigneeChange={(newAssignee) => void runRowAction(card.id, () => onAssigneeChange(card.id, newAssignee))}
                                availableAssignees={availableAssignees}
                              />
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            {card.storyPoints ? (
                              <div className="flex items-center justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`inline-flex items-center gap-1.5 text-sm font-medium ${currentTheme.textMuted}`}>
                                      <Zap className="h-4 w-4" />
                                      <span>{card.storyPoints}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8}>{card.storyPoints} story points</TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="sr-only">No story points</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-4 align-middle">
                            <div className="flex flex-nowrap items-center justify-end gap-1.5">
                              {isRowPending ? (
                                <span className={`inline-flex h-8 w-8 items-center justify-center ${currentTheme.primaryText}`}>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </span>
                              ) : (
                                <>
                                  {isBacklogMode && onAddToQueue && !card.isQueued && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => void runRowAction(card.id, () => onAddToQueue(card.id))}
                                          className={rowTextActionButtonClassName}
                                        >
                                          Add to Queue
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" sideOffset={8}>Stage task in the queue batch</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {isBacklogMode && onRemoveFromQueue && card.isQueued && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => void runRowAction(card.id, () => onRemoveFromQueue(card.id))}
                                          className={rowTextActionButtonClassName}
                                        >
                                          Back to Staging
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" sideOffset={8}>Return task to staging</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {!isBacklogMode && onMoveToBacklog && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => void runRowAction(card.id, () => onMoveToBacklog(card.id))}
                                          className={iconActionButtonClassName}
                                          type="button"
                                        >
                                          <Undo2 className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" sideOffset={8}>Move to staging</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {onEdit && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button onClick={() => onEdit(card.id)} className={iconActionButtonClassName} type="button">
                                          <Edit className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" sideOffset={8}>Edit task</TooltipContent>
                                    </Tooltip>
                                  )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={() => onDelete(card.id, card.title)} className={iconActionButtonClassName} type="button">
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={8}>Delete task</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 border-t ${currentTheme.border} pt-4`}>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <kbd className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Shift</kbd>
            <span className={`text-xs ${currentTheme.textMuted}`}>Previous page</span>
            <kbd className={`ml-2 rounded-md border px-2 py-1 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Tab</kbd>
            <span className={`text-xs ${currentTheme.textMuted}`}>Next page</span>
          </div>
          <div className="ml-auto">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={taskPage.page === 1}
                    className={`${
                      taskPage.page === 1
                        ? "pointer-events-none opacity-50"
                        : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg} border ${currentTheme.border}`
                    }`}
                    onClick={(event) => {
                      event.preventDefault();
                      if (taskPage.page > 1) {
                        setCurrentPage((page) => page - 1);
                      }
                    }}
                  />
                </PaginationItem>

                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === taskPage.page}
                        className={
                          item === taskPage.page
                            ? `border ${currentTheme.primaryBorder} ${currentTheme.primaryBg} ${currentTheme.primaryText} shadow-sm`
                            : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg}`
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          if (item !== taskPage.page) {
                            setCurrentPage(item);
                          }
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={taskPage.page >= Math.max(taskPage.totalPages, 1)}
                    className={`${
                      taskPage.page >= Math.max(taskPage.totalPages, 1)
                        ? "pointer-events-none opacity-50"
                        : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg} border ${currentTheme.border}`
                    }`}
                    onClick={(event) => {
                      event.preventDefault();
                      if (taskPage.page < Math.max(taskPage.totalPages, 1)) {
                        setCurrentPage((page) => page + 1);
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
