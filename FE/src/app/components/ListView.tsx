import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Bug,
  Check,
  ChevronDown,
  CheckSquare,
  Edit,
  FileText,
  Flag,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Shapes,
  Tag,
  Trash2,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { OverflowTooltip } from "./OverflowTooltip";
import { Label } from "../utils/labels";
import { getPriorityColor, getPriorityIndicator, PRIORITY_COLORS } from "../utils/priorityColors";
import {
  BacklogStageFilter,
  BoardTaskListPage,
  BoardTaskSortDirection,
  BoardTaskSortKey,
  getBoardTaskPage,
  PriorityFilterValue,
  TaskAssignee,
  TaskQuickFilter,
  TaskType,
  TaskTypeFilterValue,
} from "../utils/cards";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { CustomScrollArea } from "./CustomScrollArea";
import {
  BacklogWorkspaceFilters,
  TaskWorkspaceFilters,
} from "../utils/taskWorkspaceFilters";
import { TaskLabelSummary } from "./TaskLabelSummary";
import { BoardStatusBadge } from "./BoardStatusBadge";
import { LabelBadge } from "./LabelBadge";
import { TaskIndexHeaderCell } from "./TaskIndexHeaderCell";
import { TaskDueDateBadge } from "./TaskDueDateBadge";
import { TaskColumnAgeBadge } from "./TaskColumnAgeBadge";
import { getTaskColumnAgeDisplay } from "../utils/taskColumnAge";
import { getTaskDueDateDisplay } from "../utils/taskDueDate";
import { TaskAssigneeControl } from "./TaskAssigneeControl";
import { TaskAssigneeFilterPopover } from "./TaskAssigneeFilterPopover";
import { AppAvatar } from "./AppAvatar";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./ui/table";
import { getIconActionButtonClassName } from "./iconActionButtonStyles";
import { getInputLikeControlClassName, getNativeInputFieldClassName } from "./inputLikeControlStyles";
import { WorkspaceClearButton, WorkspaceFilterChip } from "./WorkspaceFilterChip";
import { WorkspacePaginationFooter } from "./WorkspacePaginationFooter";
import { getWorkspaceControlSurfaceClassName } from "../utils/workspaceSurfaceStyles";

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
const PRIORITY_FILTER_OPTIONS: PriorityFilterValue[] = ["low", "medium", "high", "critical", "none"];
const TASK_TYPE_FILTER_OPTIONS: TaskTypeFilterValue[] = ["story", "task", "bug", "spike", "none"];

function getPriorityFilterSummary(selectedPriorities: PriorityFilterValue[]): string {
  if (selectedPriorities.length === 0) {
    return "Priority";
  }

  if (selectedPriorities.length === 1) {
    const [priority] = selectedPriorities;
    return priority === "none" ? "No priority" : `${PRIORITY_COLORS[priority].label} priority`;
  }

  return `${selectedPriorities.length} priorities selected`;
}

function getTaskTypeLabel(taskType: TaskType): string {
  switch (taskType) {
    case "story":
      return "Story";
    case "bug":
      return "Bug";
    case "task":
      return "Task";
    case "spike":
      return "Spike";
    default:
      return taskType;
  }
}

function getTaskTypeFilterSummary(selectedTaskTypes: TaskTypeFilterValue[]): string {
  if (selectedTaskTypes.length === 0) {
    return "Task Type";
  }

  if (selectedTaskTypes.length === 1) {
    const [taskType] = selectedTaskTypes;
    return taskType === "none" ? "No task type" : getTaskTypeLabel(taskType);
  }

  return `${selectedTaskTypes.length} task types selected`;
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
  mode: "active" | "backlog" | "history";
  boardId: number;
  taskDataVersion: number;
  refreshToken: number;
  onRefreshingChange?: (isRefreshing: boolean) => void;
  filters: TaskWorkspaceFilters | BacklogWorkspaceFilters;
  onFiltersChange: (filters: TaskWorkspaceFilters | BacklogWorkspaceFilters) => void;
  onOpen?: (cardId: number) => void;
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
  onOpen,
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
  const isHistoryMode = mode === "history";
  const [pendingRowIds, setPendingRowIds] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = TASKS_PER_PAGE;
  const [taskPage, setTaskPage] = useState<BoardTaskListPage>(EMPTY_TASK_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isLabelFilterOpen, setIsLabelFilterOpen] = useState(false);
  const [isPriorityFilterOpen, setIsPriorityFilterOpen] = useState(false);
  const [isTaskTypeFilterOpen, setIsTaskTypeFilterOpen] = useState(false);

  const workspaceWidthClassName = "mx-auto w-full max-w-[1850px]";
  const filterSearchQuery = filters.searchQuery;
  const filterQuickFilter = filters.quickFilter;
  const selectedPriorities = filters.selectedPriorities ?? [];
  const selectedTaskTypes = filters.selectedTaskTypes ?? [];
  const selectedAssigneeUserIds = filters.selectedAssigneeUserIds ?? [];
  const selectedLabelKey = [...filters.selectedLabelIds].sort((left, right) => left - right).join(",");
  const selectedAssigneeKey = [...selectedAssigneeUserIds].sort((left, right) => left - right).join(",");
  const selectedPriorityKey = [...selectedPriorities].sort().join(",");
  const selectedTaskTypeKey = [...selectedTaskTypes].sort().join(",");
  const stageFilter = isBacklogMode ? (filters as BacklogWorkspaceFilters).stageFilter : "all";
  const taskIndexFilterKey = [
    filterQuickFilter,
    filterSearchQuery,
    selectedLabelKey,
    selectedAssigneeKey,
    selectedPriorityKey,
    selectedTaskTypeKey,
    stageFilter,
  ].join("|");
  const missingRowCount = Math.max(0, TASKS_PER_PAGE - taskPage.items.length);
  const reservedTableMinHeight =
    missingRowCount > 0
      ? `calc(${TASK_INDEX_HEADER_HEIGHT_REM + TASKS_PER_PAGE * TASK_INDEX_ROW_HEIGHT_REM}rem + 2px)`
      : undefined;
  const disablePaginationFooter =
    taskPage.items.length === 0 || Math.max(taskPage.totalPages, 1) <= 1;
  const hasActiveFilters =
    filterSearchQuery.length > 0 ||
    filterQuickFilter !== "all" ||
    filters.selectedLabelIds.length > 0 ||
    selectedAssigneeUserIds.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedTaskTypes.length > 0 ||
    (isBacklogMode && stageFilter !== "all");

  useEffect(() => {
    setSearchInput(filterSearchQuery);
  }, [filterSearchQuery]);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();
    if (normalizedSearch === filterSearchQuery) {
      setIsSearchDebouncing(false);
      return;
    }

    setIsSearchDebouncing(true);
    const timeoutId = window.setTimeout(() => {
      onFiltersChange({
        ...filters,
        searchQuery: normalizedSearch,
      });
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filterSearchQuery, filters, onFiltersChange, searchInput]);

  useEffect(() => {
    onRefreshingChange?.(isLoading || isSearchDebouncing);
  }, [isLoading, isSearchDebouncing, onRefreshingChange]);

  useEffect(() => {
    return () => {
      onRefreshingChange?.(false);
    };
  }, [onRefreshingChange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortState.direction, sortState.key, taskIndexFilterKey]);

  useEffect(() => {
    if (!Number.isFinite(boardId)) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;
    const selectedLabelIdsForRequest = selectedLabelKey
      ? selectedLabelKey.split(",").map((labelId) => Number(labelId))
      : [];
    const selectedPrioritiesForRequest = selectedPriorityKey
      ? selectedPriorityKey.split(",") as PriorityFilterValue[]
      : [];
    const selectedTaskTypesForRequest = selectedTaskTypeKey
      ? selectedTaskTypeKey.split(",") as TaskTypeFilterValue[]
      : [];

    setIsLoading(true);
    setLoadError("");
    void getBoardTaskPage(boardId, {
      scope: isBacklogMode ? "backlog" : isHistoryMode ? "history" : "active",
      q: filterSearchQuery,
      quickFilter: filterQuickFilter,
      labelIds: selectedLabelIdsForRequest,
      assigneeUserIds: selectedAssigneeKey
        ? selectedAssigneeKey.split(",").map((assigneeUserId) => Number(assigneeUserId))
        : [],
      priorities: selectedPrioritiesForRequest,
      taskTypes: selectedTaskTypesForRequest,
      stageFilter: isBacklogMode ? stageFilter : undefined,
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
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    boardId,
    currentPage,
    filterQuickFilter,
    filterSearchQuery,
    isBacklogMode,
    isHistoryMode,
    pageSize,
    refreshToken,
    selectedLabelKey,
    selectedAssigneeKey,
    selectedPriorityKey,
    selectedTaskTypeKey,
    stageFilter,
    taskIndexFilterKey,
    sortState.direction,
    sortState.key,
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
  const setSelectedAssigneeUserIds = (selectedAssigneeUserIds: number[]) =>
    onFiltersChange({ ...filters, selectedAssigneeUserIds });
  const setSelectedPriorities = (nextSelectedPriorities: PriorityFilterValue[]) =>
    onFiltersChange({ ...filters, selectedPriorities: nextSelectedPriorities });
  const setSelectedTaskTypes = (nextSelectedTaskTypes: TaskTypeFilterValue[]) =>
    onFiltersChange({ ...filters, selectedTaskTypes: nextSelectedTaskTypes });
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

  const toggleSelectedPriority = (priority: PriorityFilterValue) => {
    setCurrentPage(1);
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter((value) => value !== priority));
      return;
    }

    setSelectedPriorities([...selectedPriorities, priority]);
  };

  const toggleSelectedTaskType = (taskType: TaskTypeFilterValue) => {
    setCurrentPage(1);
    if (selectedTaskTypes.includes(taskType)) {
      setSelectedTaskTypes(selectedTaskTypes.filter((value) => value !== taskType));
      return;
    }

    setSelectedTaskTypes([...selectedTaskTypes, taskType]);
  };

  const clearCurrentFilters = () => {
    setSearchInput("");
    if (isBacklogMode) {
      onFiltersChange({
        ...(filters as BacklogWorkspaceFilters),
        searchQuery: "",
        quickFilter: "all",
        selectedLabelIds: [],
        selectedAssigneeUserIds: [],
        selectedPriorities: [],
        selectedTaskTypes: [],
        stageFilter: "all",
      });
      return;
    }

    onFiltersChange({
      ...filters,
      searchQuery: "",
      quickFilter: "all",
      selectedLabelIds: [],
      selectedAssigneeUserIds: [],
      selectedPriorities: [],
      selectedTaskTypes: [],
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
  const listSearchInputClassName = getNativeInputFieldClassName(currentTheme, {
    surfaceClassName: getWorkspaceControlSurfaceClassName(),
  });
  const labelFilterTriggerSurfaceClassName = getWorkspaceControlSurfaceClassName();
  const labelFilterTriggerClassName = getInputLikeControlClassName(currentTheme, {
    surfaceClassName: labelFilterTriggerSurfaceClassName,
  });
  const labelFilterChipClassName = "max-w-[12rem] px-3 py-1.5 text-xs font-semibold shadow-sm";
  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;
  const iconActionButtonClassName = getIconActionButtonClassName(currentTheme);
  const rowTextActionButtonClassName = `inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${currentTheme.focus} ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"} hover:${currentTheme.text}`;
  const taskRowHoverClassName = isDarkMode ? "hover:bg-white/[0.035]" : "hover:bg-slate-100/70";
  const taskIndexHeaderTextClassName = currentTheme.textSecondary;
  const taskIndexHeaderActiveTextClassName = currentTheme.text;
  const taskIndexHeaderHoverClassName = `hover:${currentTheme.text}`;
  const taskIndexDividerClassName = "";
  const searchTooltipText = isBacklogMode
    ? "Search backlog tasks by title or by the labels attached to them."
    : isHistoryMode
      ? "Search completed tasks by title or by the labels attached to them."
      : "Search active tasks by title or by the labels attached to them.";
  const labelFilterTooltipText = isBacklogMode
    ? "Filter backlog tasks by one or more board labels."
    : isHistoryMode
      ? "Filter completed tasks by one or more board labels."
      : "Filter active tasks by one or more board labels.";
  const priorityFilterTooltipText = isBacklogMode
    ? "Filter backlog tasks by priority, including tasks without a priority."
    : isHistoryMode
      ? "Filter completed tasks by priority, including tasks without a priority."
      : "Filter active tasks by priority, including tasks without a priority.";
  const taskTypeFilterTooltipText = isBacklogMode
    ? "Filter backlog tasks by task type, including tasks without a type."
    : isHistoryMode
      ? "Filter completed tasks by task type, including tasks without a type."
      : "Filter active tasks by task type, including tasks without a type.";
  const headerCoachmark = isBacklogMode ? "backlog-header" : isHistoryMode ? "history-header" : "list-header";
  const filterCoachmark = isBacklogMode ? "backlog-filters" : "list-filters";
  const tableCoachmark = isBacklogMode ? "backlog-table" : isHistoryMode ? "history-list" : "list-table";
  const pageTitle = isBacklogMode ? "Backlog" : isHistoryMode ? "History" : "List";
  const pageDescription = isBacklogMode
    ? "Review upcoming work, stage ready tasks into the queue, and keep the backlog prepared for what comes next."
    : isHistoryMode
      ? "Review completed board work in one place, then sort and filter it to revisit what has already been delivered."
      : "Scan active board work in one place, then sort and filter it to focus on what needs attention right now.";
  const tableLabel = isBacklogMode ? "Backlog tasks" : isHistoryMode ? "Completed board tasks" : "Active board tasks";
  const clearFiltersTooltip = isBacklogMode ? "Reset backlog filters" : isHistoryMode ? "Reset history filters" : "Reset list filters";
  const quickFilterOptions = [
    {
      id: "all" as const,
      label: isHistoryMode ? "All completed" : "All tasks",
      tooltip: isHistoryMode ? "Show every completed task in this view" : "Show every task in this view",
    },
    { id: "assigned" as const, label: "Assigned to me", tooltip: "Show only tasks assigned to you" },
    { id: "due" as const, label: "Due this week", tooltip: "Show tasks due within the next 7 days" },
    { id: "overdue" as const, label: "Overdue", tooltip: "Show tasks with due dates before today" },
  ];
  const assigneeFilterTooltipText = isBacklogMode
    ? "Filter backlog tasks by one or more assigned board members."
    : isHistoryMode
      ? "Filter completed tasks by one or more assigned board members."
      : "Filter active tasks by one or more assigned board members.";

  return (
    <div className={`${currentTheme.bgSecondary} h-full overflow-auto`}>
      <div className={`${workspaceWidthClassName} flex flex-col px-8 py-6 lg:px-10 xl:px-12`}>
        <div className="shrink-0" data-coachmark={headerCoachmark}>
          <div className="flex items-center justify-between gap-4">
            <h1 className={`font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              {pageTitle}
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
            {pageDescription}
          </p>
        </div>

        <div
          className={`mt-6 border-t ${currentTheme.border} py-4`}
          data-coachmark={filterCoachmark}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="flex w-full max-w-[48rem] min-w-0 flex-col gap-2 xl:flex-none">
              <span className={toolbarLabelClassName}>Search tasks</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative min-w-0 flex-1">
                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search by task title or label"
                      className={`h-11 w-full pl-10 pr-4 text-sm placeholder:${currentTheme.textMuted} ${listSearchInputClassName}`}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {searchTooltipText}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end xl:justify-end">
                <div className="flex flex-col gap-2">
                  <span className={toolbarLabelClassName}>Quick filters</span>
                  <div className="flex flex-wrap items-center gap-2 xl:min-h-11">
                  {quickFilterOptions.map((filter) => {
                    const isActive = filters.quickFilter === filter.id;
                    return (
                      <WorkspaceFilterChip
                        key={filter.id}
                        label={filter.label}
                        isActive={isActive}
                        onClick={() => setQuickFilter(filter.id)}
                        tooltip={filter.tooltip}
                      />
                    );
                  })}
                </div>
              </div>

              {isBacklogMode && (
                <div className="flex flex-col gap-2">
                  <span className={toolbarLabelClassName}>Queue</span>
                  <div className="flex flex-wrap items-center gap-2 xl:min-h-11">
                    {[
                      { id: "all" as const, label: "All", tooltip: "Show every backlog task" },
                      { id: "waiting" as const, label: "Waiting", tooltip: "Show backlog tasks not yet queued" },
                      { id: "queued" as const, label: "Queued", tooltip: "Show backlog tasks already staged in the queue" },
                    ].map((filter) => {
                      const isActive = (filters as BacklogWorkspaceFilters).stageFilter === filter.id;
                      return (
                        <WorkspaceFilterChip
                          key={filter.id}
                          label={filter.label}
                          isActive={isActive}
                          onClick={() => setStageFilter(filter.id)}
                          tooltip={filter.tooltip}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-4 md:grid-cols-2 xl:flex xl:items-end">
                <div className="flex min-w-0 flex-col gap-2 xl:w-56">
                  <span className={toolbarLabelClassName}>Priority</span>
                  <Popover.Root open={isPriorityFilterOpen} onOpenChange={setIsPriorityFilterOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Popover.Trigger asChild>
                          <button
                            type="button"
                            className={`flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm shadow-none ${currentTheme.text} ${labelFilterTriggerClassName} hover:!bg-white dark:hover:!bg-input/30 ${
                              isPriorityFilterOpen ? `border-transparent ring-2 ${currentTheme.ring}` : ""
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Flag className={`h-4 w-4 shrink-0 ${selectedPriorities.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                              <span className={`truncate ${selectedPriorities.length === 0 ? currentTheme.textMuted : currentTheme.text}`}>
                                {getPriorityFilterSummary(selectedPriorities)}
                              </span>
                            </span>
                            <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
                          </button>
                        </Popover.Trigger>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        {priorityFilterTooltipText}
                      </TooltipContent>
                    </Tooltip>
                    <Popover.Portal>
                      <Popover.Content
                        sideOffset={8}
                        align="start"
                        className={`z-50 w-64 overflow-hidden rounded-xl border p-1 ${currentTheme.border} ${currentTheme.cardBg} shadow-xl animate-in fade-in zoom-in-95 duration-200`}
                      >
                        <div className={`space-y-1 rounded-lg ${currentTheme.cardBg}`}>
                          {PRIORITY_FILTER_OPTIONS.map((priority) => {
                            const isSelected = selectedPriorities.includes(priority);
                            const priorityValue = priority === "none" ? null : priority;
                            const label = priorityValue ? `${PRIORITY_COLORS[priorityValue].label} priority` : "No priority";
                            const chipClassName = priorityValue && isDarkMode
                              ? "text-gray-900"
                              : "text-white";

                            return (
                              <button
                                key={priority}
                                type="button"
                                onClick={() => toggleSelectedPriority(priority)}
                                aria-pressed={isSelected}
                                className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                  isSelected
                                    ? `${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`
                                    : `${currentTheme.cardBg} ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`
                                }`}
                              >
                                {priorityValue === null ? (
                                  <span>{label}</span>
                                ) : (
                                  <span
                                    className={`inline-flex h-7 items-center rounded-xl px-3 text-xs font-semibold ${chipClassName}`}
                                    style={{ backgroundColor: getPriorityColor(priorityValue, isDarkMode) }}
                                  >
                                    {label}
                                  </span>
                                )}
                                {isSelected && <Check className="h-4 w-4 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </div>

              <div className="flex min-w-0 flex-col gap-2 xl:w-56">
                <span className={toolbarLabelClassName}>Task Type</span>
                <Popover.Root open={isTaskTypeFilterOpen} onOpenChange={setIsTaskTypeFilterOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          className={`flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm shadow-none ${currentTheme.text} ${labelFilterTriggerClassName} hover:!bg-white dark:hover:!bg-input/30 ${
                            isTaskTypeFilterOpen ? `border-transparent ring-2 ${currentTheme.ring}` : ""
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Shapes className={`h-4 w-4 shrink-0 ${selectedTaskTypes.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                            <span className={`truncate ${selectedTaskTypes.length === 0 ? currentTheme.textMuted : currentTheme.text}`}>
                              {getTaskTypeFilterSummary(selectedTaskTypes)}
                            </span>
                          </span>
                          <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
                        </button>
                      </Popover.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      {taskTypeFilterTooltipText}
                    </TooltipContent>
                  </Tooltip>
                  <Popover.Portal>
                    <Popover.Content
                      sideOffset={8}
                      align="start"
                      className={`z-50 w-64 overflow-hidden rounded-xl border p-1 ${currentTheme.border} ${currentTheme.cardBg} shadow-xl animate-in fade-in zoom-in-95 duration-200`}
                    >
                      <div className={`space-y-1 rounded-lg ${currentTheme.cardBg}`}>
                        {TASK_TYPE_FILTER_OPTIONS.map((taskType) => {
                          const isSelected = selectedTaskTypes.includes(taskType);
                          const taskTypeDisplay = taskType === "none" ? null : getTaskTypeDisplay(taskType);
                          const label = taskType === "none" ? "No task type" : taskTypeDisplay?.label ?? getTaskTypeLabel(taskType);

                          return (
                            <button
                              key={taskType}
                              type="button"
                              onClick={() => toggleSelectedTaskType(taskType)}
                              aria-pressed={isSelected}
                              className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? `${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`
                                  : `${currentTheme.cardBg} ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`
                              }`}
                            >
                              <span className="inline-flex min-w-0 items-center gap-2">
                                {taskTypeDisplay?.icon}
                                <span>{label}</span>
                              </span>
                              {isSelected && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              <div className="flex min-w-0 flex-col gap-2 xl:w-72">
                <span className={toolbarLabelClassName}>Assignee</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <TaskAssigneeFilterPopover
                        boardId={boardId}
                        availableAssignees={availableAssignees}
                        selectedAssigneeUserIds={selectedAssigneeUserIds}
                        onSelectedAssigneeUserIdsChange={setSelectedAssigneeUserIds}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {assigneeFilterTooltipText}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex min-w-0 flex-col gap-2 xl:w-72">
                <span className={toolbarLabelClassName}>Labels</span>
                <Popover.Root open={isLabelFilterOpen} onOpenChange={setIsLabelFilterOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          className={`flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm shadow-none ${currentTheme.text} ${labelFilterTriggerClassName} hover:!bg-white dark:hover:!bg-input/30 ${
                            isLabelFilterOpen ? `border-transparent ring-2 ${currentTheme.ring}` : ""
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Tag className={`h-4 w-4 shrink-0 ${filters.selectedLabelIds.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                            <span className={`truncate ${filters.selectedLabelIds.length === 0 ? currentTheme.textMuted : currentTheme.text}`}>
                              {filters.selectedLabelIds.length > 0 ? `${filters.selectedLabelIds.length} labels selected` : "Filter by labels"}
                            </span>
                          </span>
                          <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
                        </button>
                      </Popover.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      {labelFilterTooltipText}
                    </TooltipContent>
                  </Tooltip>
                  <Popover.Portal>
                    <Popover.Content
                      sideOffset={8}
                      align="start"
                      className={`z-50 w-72 overflow-hidden rounded-xl border p-1 ${currentTheme.border} ${currentTheme.cardBg} shadow-xl animate-in fade-in zoom-in-95 duration-200`}
                    >
                      <CustomScrollArea className={`overflow-hidden rounded-lg ${currentTheme.cardBg}`} viewportClassName={`max-h-64 ${currentTheme.cardBg}`}>
                        <div className={`space-y-1 pr-4 ${currentTheme.cardBg}`}>
                          {labels.length === 0 ? (
                            <div className={`px-3 py-4 text-center text-sm italic ${currentTheme.cardBg} ${currentTheme.textMuted}`}>
                              No labels available yet.
                            </div>
                          ) : (
                            labels.map((label) => {
                              const isSelected = filters.selectedLabelIds.includes(label.id);

                              return (
                                <Tooltip key={label.id}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => toggleSelectedLabelId(label.id)}
                                      className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                        isSelected
                                          ? `${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`
                                          : `${currentTheme.cardBg} ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`
                                      }`}
                                    >
                                      <LabelBadge label={label} className={labelFilterChipClassName} />
                                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" sideOffset={8}>
                                    {isSelected ? `Remove ${label.name}` : `Add ${label.name}`}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })
                          )}
                        </div>
                      </CustomScrollArea>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              </div>

            <div className="flex items-end xl:justify-end">
              <WorkspaceClearButton
                onClick={clearCurrentFilters}
                disabled={!hasActiveFilters}
                tooltip={clearFiltersTooltip}
                shortcut={<kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Esc</kbd>}
              />
            </div>
          </div>
          </div>

          <div className={`mt-4 min-h-11 border-t pt-4 ${currentTheme.border}`}>
            <div className="flex flex-wrap items-center gap-2">
              {selectedAssigneeUserIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedAssigneeUserIds.map((assigneeUserId) => {
                    const assignee = availableAssignees.find((item) => item.userId === assigneeUserId);
                    if (!assignee) {
                      return null;
                    }

                    return (
                      <span
                        key={assigneeUserId}
                        className={`inline-flex h-8 max-w-[14rem] items-center gap-2 rounded-full border px-2.5 text-xs font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`}
                      >
                        <AppAvatar
                          username={assignee.username || assignee.displayName}
                          fullName={assignee.displayName}
                          size={20}
                          level={assignee.currentLevel}
                          interactive={false}
                          enableBlink={false}
                          aria-hidden="true"
                        />
                        <OverflowTooltip
                          text={assignee.displayName}
                          className="max-w-[8rem] truncate"
                          tooltipClassName="max-w-none whitespace-nowrap"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAssigneeUserIds(
                                  selectedAssigneeUserIds.filter((value) => value !== assigneeUserId),
                                )
                              }
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                              aria-label={`Remove ${assignee.displayName}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>Remove {assignee.displayName}</TooltipContent>
                        </Tooltip>
                      </span>
                    );
                  })}
                </div>
              ) : null}

              {selectedAssigneeUserIds.length > 0 && filters.selectedLabelIds.length > 0 ? (
                <span className={`mx-1 hidden h-6 w-px sm:inline-flex ${isDarkMode ? "bg-white/12" : "bg-slate-300"}`} aria-hidden="true" />
              ) : null}

              {filters.selectedLabelIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {filters.selectedLabelIds.map((labelId) => {
                    const label = labels.find((item) => item.id === labelId);
                    if (!label) {
                      return null;
                    }

                    return (
                      <LabelBadge
                        key={labelId}
                        label={label}
                        className="h-7 gap-2 px-3 text-xs font-semibold"
                      >
                        <OverflowTooltip
                          text={label.name}
                          className="max-w-[10rem] truncate"
                          tooltipClassName="max-w-none whitespace-nowrap"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => toggleSelectedLabelId(labelId)}
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 dark:text-gray-900/80 dark:hover:bg-black/10 dark:hover:text-gray-900 dark:focus-visible:ring-black/45"
                              aria-label={`Remove ${label.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>Remove {label.name}</TooltipContent>
                        </Tooltip>
                      </LabelBadge>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4" data-coachmark={tableCoachmark}>
          <div className="py-2.5">
            <span className={`text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              {tableLabel}
            </span>
          </div>

          <div
            className={`rounded-lg border ${currentTheme.border}`}
            style={reservedTableMinHeight ? { minHeight: reservedTableMinHeight } : undefined}
          >
            <Table className="min-w-[1280px] table-fixed border-collapse">
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
                    widthClassName="w-[24rem]"
                    dividerClassName={taskIndexDividerClassName}
                    sortDirection={sortState.key === "title" ? sortState.direction : null}
                    onSort={() => toggleSort("title")}
                    textClassName={taskIndexHeaderTextClassName}
                    activeTextClassName={taskIndexHeaderActiveTextClassName}
                    buttonHoverClassName={taskIndexHeaderHoverClassName}
                  />
                  <TaskIndexHeaderCell
                    label="Due Date"
                    align="center"
                    widthClassName="w-40"
                    dividerClassName={taskIndexDividerClassName}
                    sortDirection={sortState.key === "dueDate" ? sortState.direction : null}
                    onSort={() => toggleSort("dueDate")}
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
                    <TableCell colSpan={8} className={`px-6 py-16 text-center ${currentTheme.textMuted}`}>
                      {loadError || "No tasks match the current filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {taskPage.items.map((card) => {
                      const cardLabels = getCardLabels(card.labelIds);
                      const taskTypeDisplay = getTaskTypeDisplay(card.taskType);
                      const priorityIndicator = getPriorityIndicator(card.priority);
                      const dueDateInfo = getTaskDueDateDisplay(card.dueDate);
                      const columnAgeInfo = !isBacklogMode && !isHistoryMode
                        ? getTaskColumnAgeDisplay(card.statusEnteredAtUtc, card.status)
                        : null;
                      const isRowPending = pendingRowIds.includes(card.id);
                      const isLastVisibleRow = card.id === taskPage.items[taskPage.items.length - 1]?.id;
                      const shouldDropBottomBorder = isLastVisibleRow && missingRowCount === 0;

                      return (
                        <TableRow
                          key={card.id}
                          aria-busy={isRowPending}
                          className={`h-[3.75rem] border-b ${shouldDropBottomBorder ? "last:border-b-0" : ""} ${currentTheme.border} transition-colors duration-150 ${taskRowHoverClassName} ${isRowPending ? "opacity-55" : ""}`}
                        >
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            {card.priority ? (
                              <div className="flex items-center justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className="font-kanban-limit-message cursor-help text-xs font-semibold"
                                      style={{ color: getPriorityColor(card.priority, isDarkMode) }}
                                    >
                                      {priorityIndicator?.label ?? card.priority}
                                    </span>
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
                              {taskTypeDisplay && (
                                <div className={`flex flex-wrap items-center gap-3 text-xs ${currentTheme.textMuted}`}>
                                  <span className="inline-flex items-center gap-1.5">
                                    {taskTypeDisplay.icon}
                                    <span className="font-due-date">{taskTypeDisplay.label}</span>
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                title={card.title}
                                onClick={() => onOpen?.(card.id)}
                                className={`block max-w-full truncate text-left text-[15px] font-semibold ${currentTheme.text} ${onOpen ? "hover:underline" : ""}`}
                              >
                                {card.title}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            {dueDateInfo || columnAgeInfo ? (
                              <div className="flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  {columnAgeInfo ? (
                                    <TaskColumnAgeBadge statusEnteredAtUtc={card.statusEnteredAtUtc} status={card.status} />
                                  ) : null}
                                  {dueDateInfo ? <TaskDueDateBadge dueDate={card.dueDate} /> : null}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="sr-only">No due date</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            <div className="flex items-center justify-center">
                              {isBacklogMode ? getQueueBadge(Boolean(card.isQueued)) : <BoardStatusBadge statusKey={card.status} />}
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            <div className="flex min-h-8 items-center">
                              {cardLabels.length > 0 ? (
                                <TaskLabelSummary
                                  labels={cardLabels}
                                  maxVisible={2}
                                  compactMaxVisible={1}
                                />
                              ) : (
                                <span className="sr-only">No labels</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            <div className={`flex items-center justify-center ${isRowPending ? "pointer-events-none" : ""}`}>
                              <TaskAssigneeControl
                                boardId={boardId}
                                taskId={card.id}
                                assignee={card.assignee}
                                onAssigneeChange={(taskId, newAssignee) => void runRowAction(taskId, () => onAssigneeChange(taskId, newAssignee))}
                                availableAssignees={availableAssignees}
                              />
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 align-middle ${taskIndexDividerClassName}`}>
                            {card.storyPoints ? (
                              <div className="flex items-center justify-start">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`font-due-date inline-flex items-center gap-1.5 text-sm font-medium ${currentTheme.textMuted}`}>
                                      <Zap className="h-4 w-4" />
                                      <span>{card.storyPoints}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8}>{card.storyPoints} story points</TooltipContent>
                                </Tooltip>
                              </div>
                            ) : (
                              <div className="text-left">
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

        <WorkspacePaginationFooter
          currentPage={taskPage.page}
          totalPages={Math.max(taskPage.totalPages, 1)}
          onPageChange={setCurrentPage}
          disabled={disablePaginationFooter}
          className={`mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t ${currentTheme.border} pt-4`}
          keycapClassName={`rounded-md border px-2 py-1 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}
          mutedTextClassName={`text-xs ${currentTheme.textMuted}`}
          pageActiveClassName={`pointer-events-none cursor-default border ${currentTheme.primaryBorder} ${currentTheme.accentPaginationActive} shadow-sm`}
          pageInactiveClassName={`!border ${currentTheme.border} !bg-white dark:!bg-input/30 ${currentTheme.textSecondary} hover:${currentTheme.borderHover} hover:!bg-white dark:hover:!bg-input/30 hover:text-inherit hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10`}
          previousNextInactiveClassName={`!border ${currentTheme.border} !bg-white/75 dark:!bg-input/20 ${currentTheme.textSecondary} hover:${currentTheme.borderHover} hover:!bg-white/75 dark:hover:!bg-input/20 hover:text-inherit hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10`}
          previousNextDisabledClassName={`pointer-events-none !border-transparent !bg-transparent ${currentTheme.textMuted}`}
          ellipsisClassName={currentTheme.textMuted}
          summaryText={getResultsSummaryText(taskPage.page, taskPage.pageSize, taskPage.totalItems)}
          summaryTextClassName={`text-xs ${currentTheme.textMuted}`}
        />
      </div>
    </div>
  );
}
