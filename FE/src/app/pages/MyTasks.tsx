import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  AlertCircle,
  Bug,
  Check,
  CheckSquare,
  ChevronDown,
  FileText,
  Flag,
  Lightbulb,
  LayoutGrid,
  RotateCw,
  Search,
  Shapes,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router";
import { BoardLogo } from "../components/BoardLogo";
import { BoardStatusBadge } from "../components/BoardStatusBadge";
import { CoachmarkOverlay } from "../components/CoachmarkOverlay";
import { CustomScrollArea } from "../components/CustomScrollArea";
import { getInputLikeControlClassName, getNativeInputFieldClassName } from "../components/inputLikeControlStyles";
import { SettingsModal } from "../components/SettingsModal";
import { TaskDueDateBadge } from "../components/TaskDueDateBadge";
import { TaskIndexHeaderCell } from "../components/TaskIndexHeaderCell";
import { Toolbar } from "../components/Toolbar";
import { Skeleton } from "../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { WorkspaceClearButton, WorkspaceFilterChip } from "../components/WorkspaceFilterChip";
import { WorkspacePaginationFooter } from "../components/WorkspacePaginationFooter";
import { getToolbarLabelClassName } from "../components/typographyStyles";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { usePageCoachmarks } from "../hooks/usePageCoachmarks";
import {
  BoardTaskSortDirection,
  getMyTaskBoardOptions,
  getMyTaskPage,
  MyTaskBoardOption,
  MyTaskListPage,
  MyTaskQuickFilter,
  MyTasksScope,
  MyTaskSortKey,
  PriorityFilterValue,
  TaskType,
  TaskTypeFilterValue,
} from "../utils/cards";
import { getPriorityColor, getPriorityIndicator, PRIORITY_COLORS } from "../utils/priorityColors";
import { getWorkspaceControlSurfaceClassName, getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

const TASKS_PER_PAGE = 10;
const TASK_INDEX_ROW_HEIGHT_REM = 3.75;
const TASK_INDEX_HEADER_HEIGHT_REM = 3;
const RESERVED_TABLE_MIN_HEIGHT = `calc(${TASK_INDEX_HEADER_HEIGHT_REM + TASKS_PER_PAGE * TASK_INDEX_ROW_HEIGHT_REM}rem + 2px)`;

const DEFAULT_TASK_PAGE: MyTaskListPage = {
  items: [],
  page: 1,
  pageSize: TASKS_PER_PAGE,
  totalItems: 0,
  totalPages: 0,
};

const PRIORITY_FILTER_OPTIONS: PriorityFilterValue[] = ["low", "medium", "high", "critical", "none"];
const TASK_TYPE_FILTER_OPTIONS: TaskTypeFilterValue[] = ["story", "task", "bug", "spike", "none"];

const TASK_SCOPE_OPTIONS: Array<{
  value: MyTasksScope;
  label: string;
}> = [
  { value: "active", label: "Active" },
  { value: "all", label: "All" },
];

const QUICK_FILTER_OPTIONS: Array<{
  value: MyTaskQuickFilter;
  label: string;
  tooltip: string;
}> = [
  {
    value: "all",
    label: "All tasks",
    tooltip: "Show every assigned task in this view",
  },
  {
    value: "due",
    label: "Due this week",
    tooltip: "Show assigned tasks due this week",
  },
  {
    value: "overdue",
    label: "Overdue",
    tooltip: "Show assigned tasks with a past due date",
  },
];

type SortState = {
  key: MyTaskSortKey;
  direction: BoardTaskSortDirection;
};

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

function getBoardFilterSummary(selectedBoardIds: number[], selectedBoards: MyTaskBoardOption[]): string {
  if (selectedBoardIds.length === 0) {
    return "All boards";
  }

  if (selectedBoardIds.length === 1) {
    return selectedBoards[0]?.boardName ?? "1 board selected";
  }

  return `${selectedBoardIds.length} boards selected`;
}

function getTaskTypeDisplay(taskType?: TaskType) {
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

function TaskRowsSkeleton({ rowCount = TASKS_PER_PAGE }: { rowCount?: number }) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, index) => (
        <TableRow key={index} aria-hidden="true" className="h-[3.75rem] border-b">
          <TableCell className="px-4 align-middle">
            <Skeleton className="mx-auto h-4 w-12 rounded-md" />
          </TableCell>
          <TableCell className="px-4 align-middle">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-64 max-w-full rounded-md" />
            </div>
          </TableCell>
          <TableCell className="px-4 align-middle">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </TableCell>
          <TableCell className="px-4 align-middle">
            <Skeleton className="mx-auto h-4 w-24 rounded-md" />
          </TableCell>
          <TableCell className="px-4 align-middle">
            <Skeleton className="mx-auto h-7 w-24 rounded-full" />
          </TableCell>
          <TableCell className="px-4 align-middle">
            <Skeleton className="h-4 w-12 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function MyTasks() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    preferences,
    hasFetched: hasFetchedPreferences,
    markFlowCompleted,
  } = useUserPreferences();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const toolbarLabelClassName = getToolbarLabelClassName(currentTheme.textMuted);
  const taskRowHoverClassName = isDarkMode ? "hover:bg-white/[0.035]" : "hover:bg-slate-100/70";
  const taskIndexHeaderTextClassName = currentTheme.textSecondary;
  const taskIndexHeaderActiveTextClassName = currentTheme.text;
  const taskIndexHeaderHoverClassName = `hover:${currentTheme.text}`;
  const controlSurfaceClassName = getWorkspaceControlSurfaceClassName();
  const searchInputClassName = getNativeInputFieldClassName(currentTheme, {
    surfaceClassName: controlSurfaceClassName,
  });
  const filterTriggerClassName = getInputLikeControlClassName(currentTheme, {
    surfaceClassName: controlSurfaceClassName,
  });

  const [scope, setScope] = useState<MyTasksScope>("active");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoardIds, setSelectedBoardIds] = useState<number[]>([]);
  const [boardOptions, setBoardOptions] = useState<MyTaskBoardOption[]>([]);
  const [isBoardFilterOpen, setIsBoardFilterOpen] = useState(false);
  const [isBoardOptionsLoading, setIsBoardOptionsLoading] = useState(true);
  const [boardOptionsError, setBoardOptionsError] = useState("");
  const [quickFilter, setQuickFilter] = useState<MyTaskQuickFilter>("all");
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityFilterValue[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<TaskTypeFilterValue[]>([]);
  const [isPriorityFilterOpen, setIsPriorityFilterOpen] = useState(false);
  const [isTaskTypeFilterOpen, setIsTaskTypeFilterOpen] = useState(false);
  const [sortState, setSortState] = useState<SortState>({ key: "dueDate", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [taskPage, setTaskPage] = useState<MyTaskListPage>(DEFAULT_TASK_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const coachmarks = usePageCoachmarks({
    flowId: "my-tasks-overview",
    coachmarksEnabled: preferences.coachmarksEnabled,
    completedFlows: preferences.completedFlows,
    hasFetchedPreferences,
    isBlocked:
      isSettingsOpen ||
      isBoardFilterOpen ||
      isPriorityFilterOpen ||
      isTaskTypeFilterOpen ||
      isLoading ||
      isBoardOptionsLoading,
    onFlowCompleted: (flowId) => {
      void markFlowCompleted(flowId);
    },
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    void Promise.resolve()
      .then(() => {
        if (!isActive) {
          return null;
        }

        setIsBoardOptionsLoading(true);
        setBoardOptionsError("");

        return getMyTaskBoardOptions(controller.signal);
      })
      .then((boards) => {
        if (!isActive || boards === null) {
          return;
        }

        setBoardOptions(boards);
        setSelectedBoardIds((currentBoardIds) =>
          currentBoardIds.filter((boardId) => boards.some((board) => board.boardId === boardId)),
        );
      })
      .catch((error) => {
        if (!isActive || isAbortError(error)) {
          return;
        }

        setBoardOptionsError(error instanceof Error ? error.message : "Unable to load task boards right now.");
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsBoardOptionsLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    void Promise.resolve()
      .then(() => {
        if (!isActive) {
          return null;
        }

        setIsLoading(true);
        setLoadError("");

        return getMyTaskPage({
          scope,
          boardIds: selectedBoardIds,
          q: searchQuery,
          quickFilter,
          priorities: selectedPriorities,
          taskTypes: selectedTaskTypes,
          sort: sortState.key,
          direction: sortState.direction,
          page: currentPage,
          pageSize: TASKS_PER_PAGE,
          signal: controller.signal,
        });
      })
      .then((response) => {
        if (!isActive || response === null) {
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

        setLoadError(error instanceof Error ? error.message : "Tasks could not be loaded.");
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
    currentPage,
    quickFilter,
    reloadVersion,
    scope,
    searchQuery,
    selectedBoardIds,
    selectedPriorities,
    selectedTaskTypes,
    sortState.direction,
    sortState.key,
    user,
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

      if (event.key !== "Tab" && event.key !== "Shift") {
        return;
      }

      const activeElement = document.activeElement;
      const isDocumentLevelFocus =
        activeElement === document.body || activeElement === document.documentElement;

      if (!isDocumentLevelFocus) {
        return;
      }

      event.preventDefault();

      if (event.key === "Shift" && taskPage.page > 1) {
        setCurrentPage((page) => Math.max(page - 1, 1));
        return;
      }

      if (event.key === "Tab" && taskPage.page < totalPages) {
        setCurrentPage((page) => Math.min(page + 1, totalPages));
      }
    };

    window.addEventListener("keydown", handlePaginationKeybind);
    return () => window.removeEventListener("keydown", handlePaginationKeybind);
  }, [taskPage.page, taskPage.totalPages]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    searchInput.trim().length > 0 ||
    selectedBoardIds.length > 0 ||
    quickFilter !== "all" ||
    selectedPriorities.length > 0 ||
    selectedTaskTypes.length > 0;
  const disablePaginationFooter = taskPage.items.length === 0 || Math.max(taskPage.totalPages, 1) <= 1;
  const emptyStateTitle = hasActiveFilters
    ? "No tasks match the current filters."
    : scope === "active"
      ? "No active tasks assigned to you."
      : "No tasks assigned to you.";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const setTaskScope = (nextScope: MyTasksScope) => {
    setScope(nextScope);
    setCurrentPage(1);
  };

  const setTaskQuickFilter = (nextQuickFilter: MyTaskQuickFilter) => {
    setQuickFilter(nextQuickFilter);
    setCurrentPage(1);
  };

  const clearSelectedBoards = () => {
    setSelectedBoardIds([]);
    setCurrentPage(1);
  };

  const toggleSelectedBoard = (boardId: number) => {
    setCurrentPage(1);
    setSelectedBoardIds((currentBoardIds) =>
      currentBoardIds.includes(boardId)
        ? currentBoardIds.filter((value) => value !== boardId)
        : [...currentBoardIds, boardId],
    );
  };

  const toggleSelectedPriority = (priority: PriorityFilterValue) => {
    setCurrentPage(1);
    setSelectedPriorities((current) =>
      current.includes(priority)
        ? current.filter((value) => value !== priority)
        : [...current, priority],
    );
  };

  const toggleSelectedTaskType = (taskType: TaskTypeFilterValue) => {
    setCurrentPage(1);
    setSelectedTaskTypes((current) =>
      current.includes(taskType)
        ? current.filter((value) => value !== taskType)
        : [...current, taskType],
    );
  };

  const toggleSort = (key: MyTaskSortKey) => {
    setSortState((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedBoardIds([]);
    setQuickFilter("all");
    setSelectedPriorities([]);
    setSelectedTaskTypes([]);
    setCurrentPage(1);
  };

  const getSortDirection = (key: MyTaskSortKey) => (sortState.key === key ? sortState.direction : null);
  const selectedBoardOptions = selectedBoardIds
    .map((boardId) => boardOptions.find((board) => board.boardId === boardId))
    .filter((board): board is MyTaskBoardOption => Boolean(board));
  const selectedBoardOption = selectedBoardIds.length === 1 ? selectedBoardOptions[0] ?? null : null;
  const boardFilterSummary = getBoardFilterSummary(selectedBoardIds, selectedBoardOptions);

  if (!user) {
    return null;
  }

  return (
    <div className={workspaceSurface.pageClassName}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <Toolbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onProfileClick={() => navigate("/app/profile")}
        onReplayCurrentHints={preferences.coachmarksEnabled ? coachmarks.startFlow : undefined}
        userProfile={{
          username: user.username,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          subtitle: user.email,
        }}
      />

      <main className="relative z-10 h-[calc(100vh-4.75rem)] w-full overflow-auto">
        <div className={`${currentTheme.bgSecondary} min-h-full`}>
          <div className="mx-auto flex w-full max-w-[1850px] flex-col px-8 py-6 lg:px-10 xl:px-12">
            <div className="shrink-0" data-coachmark="my-tasks-header">
              <h1 className={`font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                My tasks
              </h1>
            </div>

            <div className={`mt-6 border-t ${currentTheme.border} py-4`} data-coachmark="my-tasks-filters">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                  <div className="flex w-full max-w-[48rem] min-w-0 flex-col gap-2 xl:flex-none">
                    <span className={toolbarLabelClassName}>Search tasks</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative min-w-0 flex-1">
                          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                          <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search tasks"
                            className={`h-11 w-full pl-10 pr-10 text-sm ${searchInputClassName}`}
                            aria-label="Search tasks"
                          />
                          {searchInput ? (
                            <button
                              type="button"
                              onClick={() => setSearchInput("")}
                              className={`absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${currentTheme.textMuted} ${workspaceSurface.subtleHoverSurfaceClassName} focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus}`}
                              aria-label="Clear task search"
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        Search assigned tasks by title, description, or board.
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end xl:justify-end">
                    <div className="flex flex-col gap-2">
                      <span className={toolbarLabelClassName}>View</span>
                      <div className="flex flex-wrap items-center gap-2 xl:min-h-11" role="tablist" aria-label="Task scope">
                        {TASK_SCOPE_OPTIONS.map((option) => {
                          const isSelected = scope === option.value;

                          return (
                            <WorkspaceFilterChip
                              key={option.value}
                              label={option.label}
                              isActive={isSelected}
                              onClick={() => setTaskScope(option.value)}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className={toolbarLabelClassName}>Quick filters</span>
                      <div className="flex flex-wrap items-center gap-2 xl:min-h-11">
                        {QUICK_FILTER_OPTIONS.map((option) => (
                          <WorkspaceFilterChip
                            key={option.value}
                            label={option.label}
                            isActive={quickFilter === option.value}
                            onClick={() => setTaskQuickFilter(option.value)}
                            tooltip={option.tooltip}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="grid gap-4 md:grid-cols-3 xl:flex xl:items-end">
                    <div className="flex min-w-0 flex-col gap-2 xl:w-64">
                      <span className={toolbarLabelClassName}>Board</span>
                      <Popover.Root open={isBoardFilterOpen} onOpenChange={setIsBoardFilterOpen}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Popover.Trigger asChild>
                              <button
                                type="button"
                                className={`flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm shadow-none ${currentTheme.text} ${filterTriggerClassName} hover:!bg-white dark:hover:!bg-input/30 ${
                                  isBoardFilterOpen ? `border-transparent ring-2 ${currentTheme.ring}` : ""
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  {selectedBoardOption ? (
                                    <BoardLogo
                                      iconKey={selectedBoardOption.boardLogoIconKey}
                                      colorKey={selectedBoardOption.boardLogoColorKey}
                                      size="xs"
                                      className="h-7 w-7 rounded-lg"
                                    />
                                  ) : (
                                    <LayoutGrid className={`h-4 w-4 shrink-0 ${selectedBoardIds.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                                  )}
                                  <span className={`truncate ${selectedBoardIds.length > 0 ? currentTheme.text : currentTheme.textMuted}`}>
                                    {boardFilterSummary}
                                  </span>
                                </span>
                                <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
                              </button>
                            </Popover.Trigger>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            Filter assigned tasks by one or more boards.
                          </TooltipContent>
                        </Tooltip>
                        <Popover.Portal>
                          <Popover.Content
                            sideOffset={8}
                            align="start"
                            className={`z-50 w-72 overflow-hidden rounded-xl border p-1 ${currentTheme.border} ${currentTheme.cardBg} shadow-xl animate-in fade-in zoom-in-95 duration-200`}
                          >
                            <div className={`space-y-1 rounded-lg ${currentTheme.cardBg}`}>
                              <button
                                type="button"
                                onClick={clearSelectedBoards}
                                aria-pressed={selectedBoardIds.length === 0}
                                className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                  selectedBoardIds.length === 0
                                    ? `${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`
                                    : `${currentTheme.cardBg} ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`
                                }`}
                              >
                                <span className="inline-flex min-w-0 items-center gap-2">
                                  <LayoutGrid className="h-4 w-4 shrink-0" />
                                  <span>All boards</span>
                                </span>
                                {selectedBoardIds.length === 0 ? <Check className="h-4 w-4 shrink-0" /> : null}
                              </button>

                              <CustomScrollArea className={`overflow-hidden rounded-lg ${currentTheme.cardBg}`} viewportClassName={`max-h-[13.75rem] ${currentTheme.cardBg}`}>
                                <div className={`space-y-1 pr-4 ${currentTheme.cardBg}`}>
                                  {isBoardOptionsLoading ? (
                                    <div className={`px-3 py-2 text-sm ${currentTheme.textMuted}`}>
                                      Loading boards
                                    </div>
                                  ) : boardOptionsError ? (
                                    <div className={`px-3 py-2 text-sm ${currentTheme.textMuted}`}>
                                      Boards unavailable
                                    </div>
                                  ) : boardOptions.length === 0 ? (
                                    <div className={`px-3 py-2 text-sm ${currentTheme.textMuted}`}>
                                      No boards available
                                    </div>
                                  ) : (
                                    boardOptions.map((board) => {
                                      const isSelected = selectedBoardIds.includes(board.boardId);

                                      return (
                                        <button
                                          key={board.boardId}
                                          type="button"
                                          onClick={() => toggleSelectedBoard(board.boardId)}
                                          aria-pressed={isSelected}
                                          className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                            isSelected
                                              ? `${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`
                                              : `${currentTheme.cardBg} ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`
                                          }`}
                                        >
                                          <span className="inline-flex min-w-0 items-center gap-2">
                                            <BoardLogo
                                              iconKey={board.boardLogoIconKey}
                                              colorKey={board.boardLogoColorKey}
                                              size="xs"
                                              className="h-7 w-7 rounded-lg"
                                            />
                                            <span className="truncate">{board.boardName}</span>
                                          </span>
                                          {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </CustomScrollArea>
                            </div>
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 xl:w-56">
                      <span className={toolbarLabelClassName}>Priority</span>
                      <Popover.Root open={isPriorityFilterOpen} onOpenChange={setIsPriorityFilterOpen}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Popover.Trigger asChild>
                              <button
                                type="button"
                                className={`flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm shadow-none ${currentTheme.text} ${filterTriggerClassName} hover:!bg-white dark:hover:!bg-input/30 ${
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
                            Filter assigned tasks by priority.
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
                                      <span>No priority</span>
                                    ) : (
                                      <span
                                        className={`inline-flex h-7 items-center rounded-xl px-3 text-xs font-semibold ${isDarkMode ? "text-gray-900" : "text-white"}`}
                                        style={{ backgroundColor: getPriorityColor(priorityValue, isDarkMode) }}
                                      >
                                        {PRIORITY_COLORS[priorityValue].label} priority
                                      </span>
                                    )}
                                    {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
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
                                className={`flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm shadow-none ${currentTheme.text} ${filterTriggerClassName} hover:!bg-white dark:hover:!bg-input/30 ${
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
                            Filter assigned tasks by task type.
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
                                    {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                                  </button>
                                );
                              })}
                            </div>
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    </div>
                  </div>

                  {hasActiveFilters ? (
                    <WorkspaceClearButton
                      label="Clear"
                      onClick={clearFilters}
                      tooltip="Reset my task filters"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {selectedBoardOptions.length > 0 ? (
              <div className={`mt-4 min-h-11 border-t pt-4 ${currentTheme.border}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedBoardOptions.map((board) => (
                    <span
                      key={board.boardId}
                      className={`inline-flex max-w-[14rem] items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`}
                    >
                      <span className="truncate">{board.boardName}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => toggleSelectedBoard(board.boardId)}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                            aria-label={`Remove ${board.boardName}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>Remove {board.boardName}</TooltipContent>
                      </Tooltip>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4" data-coachmark="my-tasks-table">
              <div className="py-2.5">
                <span className={`text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  Assigned tasks
                </span>
              </div>

              <div
                className={`overflow-x-auto rounded-lg border ${currentTheme.border}`}
                style={{ minHeight: RESERVED_TABLE_MIN_HEIGHT }}
              >
                <Table className="min-w-[1280px] table-fixed border-collapse">
                  <TableHeader className={isDarkMode ? "bg-white/[0.025]" : "bg-black/[0.015]"}>
                    <TableRow className={`border-b-2 ${currentTheme.border} hover:bg-transparent`}>
                      <TaskIndexHeaderCell
                        label="Priority"
                        align="center"
                        widthClassName="w-36"
                        dividerClassName=""
                        sortDirection={getSortDirection("priority")}
                        onSort={() => toggleSort("priority")}
                        textClassName={taskIndexHeaderTextClassName}
                        activeTextClassName={taskIndexHeaderActiveTextClassName}
                        buttonHoverClassName={taskIndexHeaderHoverClassName}
                      />
                      <TaskIndexHeaderCell
                        label="Title"
                        widthClassName="w-[25rem]"
                        dividerClassName=""
                        sortDirection={getSortDirection("title")}
                        onSort={() => toggleSort("title")}
                        textClassName={taskIndexHeaderTextClassName}
                        activeTextClassName={taskIndexHeaderActiveTextClassName}
                        buttonHoverClassName={taskIndexHeaderHoverClassName}
                      />
                      <TaskIndexHeaderCell
                        label="Board"
                        widthClassName="w-[18rem]"
                        dividerClassName=""
                        sortDirection={getSortDirection("board")}
                        onSort={() => toggleSort("board")}
                        textClassName={taskIndexHeaderTextClassName}
                        activeTextClassName={taskIndexHeaderActiveTextClassName}
                        buttonHoverClassName={taskIndexHeaderHoverClassName}
                      />
                      <TaskIndexHeaderCell
                        label="Due Date"
                        align="center"
                        widthClassName="w-40"
                        dividerClassName=""
                        sortDirection={getSortDirection("dueDate")}
                        onSort={() => toggleSort("dueDate")}
                        textClassName={taskIndexHeaderTextClassName}
                        activeTextClassName={taskIndexHeaderActiveTextClassName}
                        buttonHoverClassName={taskIndexHeaderHoverClassName}
                      />
                      <TaskIndexHeaderCell
                        label="Status"
                        align="center"
                        widthClassName="w-36"
                        dividerClassName=""
                        sortDirection={getSortDirection("status")}
                        onSort={() => toggleSort("status")}
                        textClassName={taskIndexHeaderTextClassName}
                        activeTextClassName={taskIndexHeaderActiveTextClassName}
                        buttonHoverClassName={taskIndexHeaderHoverClassName}
                      />
                      <TaskIndexHeaderCell
                        label="Story Points"
                        widthClassName="w-36"
                        dividerClassName=""
                        sortDirection={getSortDirection("storyPoints")}
                        onSort={() => toggleSort("storyPoints")}
                        textClassName={taskIndexHeaderTextClassName}
                        activeTextClassName={taskIndexHeaderActiveTextClassName}
                        buttonHoverClassName={taskIndexHeaderHoverClassName}
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody className={`align-top ${taskPage.items.length > 0 ? "[&_tr:last-child]:border-b" : ""}`}>
                    {isLoading ? (
                      <TaskRowsSkeleton />
                    ) : loadError ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className={`px-6 py-16 text-center ${currentTheme.textMuted}`}>
                          <div className="inline-flex flex-col items-center gap-4">
                            <span className="inline-flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              <span>Tasks could not be loaded.</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setReloadVersion((current) => current + 1)}
                              className={`font-ui-condensed inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus} ${currentTheme.border} ${currentTheme.textSecondary} ${
                                isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white"
                              } hover:${currentTheme.text}`}
                            >
                              <RotateCw className="h-4 w-4" aria-hidden="true" />
                              Retry
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : taskPage.items.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className={`px-6 py-16 text-center ${currentTheme.textMuted}`}>
                          {emptyStateTitle}
                        </TableCell>
                      </TableRow>
                    ) : (
                      taskPage.items.map((task) => {
                        const taskTypeDisplay = getTaskTypeDisplay(task.taskType);
                        const priorityIndicator = getPriorityIndicator(task.priority);

                        return (
                          <TableRow
                            key={`${task.boardId}-${task.id}`}
                            className={`h-[3.75rem] border-b ${currentTheme.border} transition-colors duration-150 ${taskRowHoverClassName}`}
                          >
                            <TableCell className="px-4 align-middle">
                              {task.priority ? (
                                <div className="flex items-center justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        className="font-kanban-limit-message cursor-help text-xs font-semibold"
                                        style={{ color: getPriorityColor(task.priority, isDarkMode) }}
                                      >
                                        {priorityIndicator?.label ?? task.priority}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={8}>
                                      {priorityIndicator?.tooltip || task.priority}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <span className="sr-only">No priority</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-4 align-middle">
                              <div className="flex min-w-0 flex-col gap-1.5">
                                {taskTypeDisplay ? (
                                  <div className={`flex flex-wrap items-center gap-3 text-xs ${currentTheme.textMuted}`}>
                                    <span className="inline-flex items-center gap-1.5">
                                      {taskTypeDisplay.icon}
                                      <span className="font-due-date">{taskTypeDisplay.label}</span>
                                    </span>
                                  </div>
                                ) : null}
                                <button
                                  type="button"
                                  title={task.title}
                                  onClick={() => navigate(`/app/${task.boardId}/tasks/${task.id}`)}
                                  className={`block max-w-full truncate text-left text-[15px] font-semibold ${currentTheme.text} hover:underline focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus}`}
                                >
                                  {task.title}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 align-middle">
                              <div className="flex min-w-0 items-center gap-3">
                                <BoardLogo
                                  iconKey={task.boardLogoIconKey}
                                  colorKey={task.boardLogoColorKey}
                                  size="xs"
                                />
                                <span className={`truncate text-sm font-medium ${currentTheme.textSecondary}`}>
                                  {task.boardName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 align-middle">
                              {task.dueDate ? (
                                <div className="flex items-center justify-center">
                                  <TaskDueDateBadge dueDate={task.dueDate} />
                                </div>
                              ) : (
                                <div className="text-center">
                                  <span className="sr-only">No due date</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-4 align-middle">
                              <div className="flex items-center justify-center">
                                <BoardStatusBadge statusKey={task.status} />
                              </div>
                            </TableCell>
                            <TableCell className="px-4 align-middle">
                              {task.storyPoints ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`font-due-date inline-flex items-center gap-1.5 text-sm font-medium ${currentTheme.textMuted}`}>
                                      <Zap className="h-4 w-4" aria-hidden="true" />
                                      <span>{task.storyPoints}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8}>
                                    {task.storyPoints} story points
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="text-left">
                                  <span className="sr-only">No story points</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div data-coachmark="my-tasks-pagination">
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
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenProfile={() => navigate("/app/profile")}
        onOpenMyTasks={() => navigate("/app/my-tasks")}
      />
      <CoachmarkOverlay
        isOpen={coachmarks.activeFlowId !== null}
        step={coachmarks.activeStep}
        targetRect={coachmarks.targetRect}
        stepIndex={coachmarks.stepIndex}
        totalSteps={coachmarks.totalSteps}
        onBack={coachmarks.goToPreviousStep}
        onNext={coachmarks.goToNextStep}
        onClose={() => coachmarks.closeFlow(true)}
      />
    </div>
  );
}
