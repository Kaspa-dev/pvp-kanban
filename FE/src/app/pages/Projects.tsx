import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Edit3,
  Folder,
  Info,
  ListTodo,
  Plus,
  Search,
  Star,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import {
  Board,
  BoardListItem,
  BoardMembershipFilter,
  BoardSort,
  PagedBoardListResponse,
  favoriteBoard,
  getUserBoardsPage,
  isBoardOwner,
  unfavoriteBoard,
  updateBoard,
} from "../utils/boards";
import { CreateBoardModal } from "../components/CreateBoardModal";
import { BoardLogo } from "../components/BoardLogo";
import { EditProjectModal } from "../components/EditProjectModal";
import { OverflowTooltip } from "../components/OverflowTooltip";
import { SettingsModal } from "../components/SettingsModal";
import { BoardInfoModal } from "../components/BoardInfoModal";
import { CoachmarkOverlay } from "../components/CoachmarkOverlay";
import { Toolbar } from "../components/Toolbar";
import { WorkspaceClearButton, WorkspaceFilterChip } from "../components/WorkspaceFilterChip";
import { WorkspaceToolbarSelect } from "../components/WorkspaceToolbarSelect";
import {
  getNeutralElevatedCardHoverClassName,
  getNeutralElevatedCardSurfaceClassName,
} from "../components/cardSurfaceStyles";
import { getProjectsCoachmarkFlow, useProjectsCoachmarks } from "../hooks/useProjectsCoachmarks";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Skeleton } from "../components/ui/skeleton";
import {
  getWorkspaceControlSurfaceClassName,
  getWorkspaceSurfaceStyles,
} from "../utils/workspaceSurfaceStyles";
import { WorkspacePaginationFooter } from "../components/WorkspacePaginationFooter";
import { UtilityIconButton } from "../components/UtilityIconButton";
import { getNativeInputFieldClassName } from "../components/inputLikeControlStyles";
import { showErrorToast, showSuccessToast } from "../utils/toast";

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

const BOARD_PAGE_SIZE = 8;
const BOARD_PAGE_SIZE_OPTIONS = [8, 16, 32] as const;
const BOARD_CARD_MIN_HEIGHT_REM = 17.5;
const BOARD_GRID_GAP_REM = 1.75;
const DEFAULT_MEMBERSHIP_FILTER: BoardMembershipFilter = "all";
const DEFAULT_SORT: BoardSort = "newest";
const PROJECTS_TOOLTIP_DELAY = 500;
const CREATE_PROJECT_TOOLTIP = "Create a new project and invite members";
const BOARD_SORT_OPTIONS: Array<{ value: BoardSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "nameAsc", label: "Name A-Z" },
  { value: "nameDesc", label: "Name Z-A" },
];

const EMPTY_BOARD_LIST_RESPONSE: PagedBoardListResponse = {
  items: [],
  page: 1,
  pageSize: BOARD_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
  summary: {
    activeProjects: 0,
    assignedTasks: 0,
    openTasks: 0,
    completedTasks: 0,
  },
};

type ProjectsQueryState = {
  q: string;
  membership: BoardMembershipFilter;
  sort: BoardSort;
  pageSize: number;
  page: number;
};

function parseMembershipFilter(value: string | null): BoardMembershipFilter {
  return value === "owned" || value === "shared" || value === "favorites" ? value : DEFAULT_MEMBERSHIP_FILTER;
}

function parseBoardSort(value: string | null): BoardSort {
  return value === "nameAsc" || value === "nameDesc" ? value : DEFAULT_SORT;
}

function parsePage(value: string | null): number {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parsePageSize(value: string | null): number {
  const pageSize = Number.parseInt(value ?? "", 10);
  return BOARD_PAGE_SIZE_OPTIONS.includes(pageSize as (typeof BOARD_PAGE_SIZE_OPTIONS)[number])
    ? pageSize
    : BOARD_PAGE_SIZE;
}

function parseProjectsQueryState(searchParams: URLSearchParams): ProjectsQueryState {
  return {
    q: searchParams.get("q")?.trim() ?? "",
    membership: parseMembershipFilter(searchParams.get("membership")),
    sort: parseBoardSort(searchParams.get("sort")),
    pageSize: parsePageSize(searchParams.get("pageSize")),
    page: parsePage(searchParams.get("page")),
  };
}

function createProjectsSearchParams(query: ProjectsQueryState): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.membership !== DEFAULT_MEMBERSHIP_FILTER) {
    params.set("membership", query.membership);
  }

  if (query.sort !== DEFAULT_SORT) {
    params.set("sort", query.sort);
  }

  if (query.pageSize !== BOARD_PAGE_SIZE) {
    params.set("pageSize", String(query.pageSize));
  }

  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params;
}

function getResultsSummaryText(page: number, pageSize: number, totalItems: number): string {
  if (totalItems === 0) {
    return "Showing 0 of 0 boards";
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `Showing ${start}-${end} of ${totalItems} boards`;
}

function getReservedBoardGridMinHeight(rows: number) {
  if (rows <= 0) {
    return 0;
  }

  return rows * BOARD_CARD_MIN_HEIGHT_REM + (rows - 1) * BOARD_GRID_GAP_REM;
}

function getReservedBoardGridStyle(pageSize: number): CSSProperties {
  return {
    ["--boards-grid-min-height-md" as string]: `${getReservedBoardGridMinHeight(Math.ceil(pageSize / 2))}rem`,
    ["--boards-grid-min-height-lg" as string]: `${getReservedBoardGridMinHeight(Math.ceil(pageSize / 3))}rem`,
    ["--boards-grid-min-height-xl" as string]: `${getReservedBoardGridMinHeight(Math.ceil(pageSize / 4))}rem`,
  };
}

function BoardCardSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={`relative min-h-[17.5rem] w-full overflow-hidden rounded-2xl border-2 p-6 ${
        isDarkMode ? `border-white/8 ${getWorkspaceControlSurfaceClassName()}` : "border-slate-200 bg-white"
      }`}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-2xl" />
        </div>
        <Skeleton className="h-5 w-5 rounded-md" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const {
    preferences,
    hasFetched: hasFetchedPreferences,
    markFlowCompleted,
  } = useUserPreferences();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const projectsSearchInputClassName = getNativeInputFieldClassName(currentTheme, {
    surfaceClassName: workspaceSurface.controlSurfaceClassName,
  });
  const boardCardActionButtonClassName = "opacity-0 transition-all duration-200 z-10 group-hover:opacity-100";
  const boardCardSurfaceClassName = getNeutralElevatedCardSurfaceClassName(isDarkMode);
  const boardCardHoverClassName = getNeutralElevatedCardHoverClassName(currentTheme, isDarkMode);

  const queryState = useMemo(() => parseProjectsQueryState(searchParams), [searchParams]);
  const selectedBoardSortLabel =
    BOARD_SORT_OPTIONS.find((option) => option.value === queryState.sort)?.label ?? "Newest";
  const selectedBoardPageSizeLabel = String(queryState.pageSize);
  const reservedBoardGridStyle = useMemo(
    () => getReservedBoardGridStyle(queryState.pageSize),
    [queryState.pageSize],
  );

  const [searchInput, setSearchInput] = useState(queryState.q);
  const [boardList, setBoardList] = useState<PagedBoardListResponse>(EMPTY_BOARD_LIST_RESPONSE);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [hasLoadedBoardsOnce, setHasLoadedBoardsOnce] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isBoardInfoModalOpen, setIsBoardInfoModalOpen] = useState(false);
  const [boardForInfo, setBoardForInfo] = useState<Board | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    setSearchInput(queryState.q);
  }, [queryState.q]);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();
    if (normalizedSearch === queryState.q) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearchParams(
        createProjectsSearchParams({
          ...queryState,
          q: normalizedSearch,
          page: 1,
        }),
        { replace: true },
      );
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queryState, searchInput, setSearchParams]);

  useEffect(() => {
    let isActive = true;

    const loadBoards = async () => {
      if (!user) {
        return;
      }

      try {
        setIsLoadingBoards(true);
        setLoadError("");

        const response = await getUserBoardsPage({
          q: queryState.q,
          membership: queryState.membership,
          sort: queryState.sort,
          pageSize: queryState.pageSize,
          page: queryState.page,
        });

        if (!isActive) {
          return;
        }

        setBoardList(response);
        setHasLoadedBoardsOnce(true);

        if (response.page !== queryState.page) {
          setSearchParams(
            createProjectsSearchParams({
              ...queryState,
              page: response.page,
            }),
            { replace: true },
          );
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load projects right now.";
        setLoadError(message);
        setHasLoadedBoardsOnce(true);
      } finally {
        if (isActive) {
          setIsLoadingBoards(false);
        }
      }
    };

    void loadBoards();

    return () => {
      isActive = false;
    };
  }, [queryState, reloadVersion, setSearchParams, user]);

  const dashboardIndicators = [
    { label: "Active Projects", value: boardList.summary.activeProjects, icon: Folder },
    { label: "Assigned to You", value: boardList.summary.assignedTasks, icon: ListTodo },
    { label: "Open Right Now", value: boardList.summary.openTasks, icon: Clock3 },
    { label: "Completed by You", value: boardList.summary.completedTasks, icon: CheckCircle2 },
  ];

  const hasActiveFilters =
    queryState.q.length > 0 ||
    queryState.membership !== DEFAULT_MEMBERSHIP_FILTER ||
    queryState.sort !== DEFAULT_SORT;
  const hasAnyBoards = boardList.summary.activeProjects > 0;
  const hasVisibleBoardCards = boardList.items.length > 0;

  const shouldShowToolbar =
    isLoadingBoards || boardList.summary.activeProjects > 0 || hasActiveFilters;
  const isInitialBoardsLoad = isLoadingBoards && !hasLoadedBoardsOnce;
  const isRefreshingBoards = isLoadingBoards && hasLoadedBoardsOnce;
  const renderInitialBoardsLoad = isInitialBoardsLoad;
  const renderRefreshingBoards = isRefreshingBoards;
  const effectiveTotalPages = Math.max(boardList.totalPages, 1);
  const shouldShowPaginationFooter = !renderInitialBoardsLoad && boardList.summary.activeProjects > 0;
  const disablePaginationFooter = boardList.items.length === 0 || effectiveTotalPages <= 1;

  const currentProjectsFlow = getProjectsCoachmarkFlow(hasAnyBoards, hasVisibleBoardCards);
  const coachmarks = useProjectsCoachmarks({
    hasAnyBoards,
    hasVisibleBoardCards,
    coachmarksEnabled: preferences.coachmarksEnabled,
    completedFlows: preferences.completedFlows,
    hasFetchedPreferences,
    isBlocked:
      isInitialBoardsLoad ||
      !!loadError ||
      isCreateModalOpen ||
      isEditModalOpen ||
      isSettingsModalOpen,
    onFlowCompleted: (flowId) => {
      void markFlowCompleted(flowId);
    },
  });

  const handleQueryStateChange = (updates: Partial<ProjectsQueryState>, replace = false) => {
    setSearchParams(
      createProjectsSearchParams({
        ...queryState,
        ...updates,
      }),
      { replace },
    );
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > effectiveTotalPages || page === boardList.page) {
      return;
    }

    handleQueryStateChange({ page });
  };

  const createPageHref = (page: number) => {
    const nextParams = createProjectsSearchParams({
      ...queryState,
      page,
    }).toString();

    return nextParams ? `/app?${nextParams}` : "/app";
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  useEffect(() => {
    if (
      !user ||
      isInitialBoardsLoad ||
      !!loadError ||
      isCreateModalOpen ||
      isEditModalOpen ||
      isSettingsModalOpen
    ) {
      return;
    }

    const handleFilterKeybind = (event: KeyboardEvent) => {
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
      if (!["1", "2", "3", "Escape", "Tab", "Shift"].includes(key)) {
        return;
      }

      if (key === "Tab" || key === "Shift") {
        const activeElement = document.activeElement;
        const isDocumentLevelFocus =
          activeElement === document.body || activeElement === document.documentElement;

        if (!isDocumentLevelFocus) {
          return;
        }

        event.preventDefault();
        handlePageChange(
          key === "Shift"
            ? Math.max(boardList.page - 1, 1)
            : Math.min(boardList.page + 1, effectiveTotalPages),
        );
        return;
      }

      event.preventDefault();

      if (key === "1") {
        handleQueryStateChange({ membership: "owned", page: 1 });
        return;
      }

      if (key === "2") {
        handleQueryStateChange({ membership: "shared", page: 1 });
        return;
      }

      if (key === "3") {
        handleQueryStateChange({ membership: "favorites", page: 1 });
        return;
      }

      clearFilters();
    };

    window.addEventListener("keydown", handleFilterKeybind);
    return () => {
      window.removeEventListener("keydown", handleFilterKeybind);
    };
  }, [
    boardList.page,
    clearFilters,
    effectiveTotalPages,
    handleQueryStateChange,
    isCreateModalOpen,
    isEditModalOpen,
    isInitialBoardsLoad,
    isSettingsModalOpen,
    loadError,
    user,
  ]);

  const refreshBoards = () => {
    setReloadVersion((current) => current + 1);
  };

  const handleBoardCreated = () => {
    if (queryState.page !== 1) {
      handleQueryStateChange({ page: 1 });
      return;
    }

    refreshBoards();
  };

  const handleSelectBoard = (boardId: number) => {
    navigate(`/app/${boardId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleEditBoard = (board: Board) => {
    setSelectedBoard(board);
    setIsEditModalOpen(true);
  };

  const handleOpenBoardInfo = (board: Board) => {
    setBoardForInfo(board);
    setIsBoardInfoModalOpen(true);
  };

  const applyFavoriteStateToLocalBoard = (boardId: number, isFavorite: boolean) => {
    setBoardList((previous) => ({
      ...previous,
      items: previous.items.map((item) => (
        item.id === boardId ? { ...item, isFavorite } : item
      )),
    }));
    setSelectedBoard((previous) => (previous?.id === boardId ? { ...previous, isFavorite } : previous));
    setBoardForInfo((previous) => (previous?.id === boardId ? { ...previous, isFavorite } : previous));
  };

  const handleToggleFavoriteBoard = async (board: BoardListItem) => {
    const nextFavoriteState = !board.isFavorite;
    applyFavoriteStateToLocalBoard(board.id, nextFavoriteState);

    try {
      if (nextFavoriteState) {
        await favoriteBoard(board.id);
        showSuccessToast("Added to favorites.");
      } else {
        await unfavoriteBoard(board.id);
        showSuccessToast("Removed from favorites.");
      }

      if (!nextFavoriteState && queryState.membership === "favorites") {
        refreshBoards();
      }
    } catch (error) {
      applyFavoriteStateToLocalBoard(board.id, board.isFavorite);
      const message = error instanceof Error ? error.message : "Unable to update favorites right now.";
      setLoadError(message);
      showErrorToast(message);
    }
  };

  const handleBoardUpdated = async (
    boardId: number,
    updates: {
      name: string;
      description: string;
      logoIconKey: Board["logoIconKey"];
      logoColorKey: Board["logoColorKey"];
      memberUserIds: number[];
    },
  ) => {
    const updatedBoard = await updateBoard(boardId, updates);
    setSelectedBoard(updatedBoard);
    refreshBoards();
  };

  const handleReplayCoachmarks = () => {
    if (!currentProjectsFlow) {
      return;
    }

    coachmarks.startFlow(currentProjectsFlow);
  };

  if (!user) return null;

  return (
    <div className={workspaceSurface.pageClassName}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <Toolbar
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
        onProfileClick={() => navigate("/app/profile")}
        onReplayCurrentHints={
          preferences.coachmarksEnabled && currentProjectsFlow
            ? handleReplayCoachmarks
            : undefined
        }
        helpCoachmarkId="projects-settings-help"
        userProfile={{
          username: user.username,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          subtitle: user.email,
        }}
      />

      <main className="relative z-10 w-full px-6 py-12">
        <div className="mx-auto w-full max-w-[1850px]">
        <div className={`${workspaceSurface.elevatedPanelSurfaceClassName} relative mb-10 overflow-hidden rounded-3xl p-10`}>
          <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${currentTheme.primarySoftStrong} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: "6s" }} />
          <div className={`absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: "8s", animationDelay: "1s" }} />

          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(${isDarkMode ? "#fff" : "#000"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "#fff" : "#000"} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <div className="mb-3">
                <h2 className={`text-4xl font-bold ${currentTheme.text}`}>Welcome back, {user.firstName}!</h2>
              </div>
              <p className={`text-lg ${currentTheme.textSecondary}`}>
                Manage your boards and bring your projects to life
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              data-coachmark="projects-create-board"
              className={`flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 hover:shadow-2xl transition-all shadow-lg group`}
            >
              <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2.5">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>New Project</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  {CREATE_PROJECT_TOOLTIP}
                </TooltipContent>
              </Tooltip>
            </button>
          </div>

          <div className={`relative z-10 mt-8 pt-6 border-t ${currentTheme.accentDivider}`}>
            <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
              {dashboardIndicators.map((indicator) => {
                const Icon = indicator.icon;
                return (
                  <div key={indicator.label} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${currentTheme.bgSecondary} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${currentTheme.primaryText}`} />
                    </div>
                    <div>
                      {renderInitialBoardsLoad ? (
                        <Skeleton className="mb-1 h-7 w-14 rounded-md" />
                      ) : (
                        <p className={`text-2xl font-bold ${currentTheme.text}`}>{indicator.value}</p>
                      )}
                      <p className={`text-xs ${currentTheme.textMuted}`}>{indicator.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {shouldShowToolbar && (
          <div
            className={`mb-8 border-y ${currentTheme.border} py-4`}
            data-coachmark="projects-search-filters"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                <div className="flex min-w-0 flex-col gap-2 xl:flex-[1.35]">
                  <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Search</span>
                  <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                    <TooltipTrigger asChild>
                      <div className="relative min-w-0 flex-1">
                        <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(event) => setSearchInput(event.target.value)}
                          placeholder="Search by board name or description"
                          className={`h-11 w-full pl-10 pr-4 text-sm placeholder:${currentTheme.textMuted} ${projectsSearchInputClassName}`}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      Search your projects by name or description
                    </TooltipContent>
                  </Tooltip>
                </div>

                <WorkspaceToolbarSelect
                  label="Sort by"
                  value={queryState.sort}
                  selectedLabel={selectedBoardSortLabel}
                  options={BOARD_SORT_OPTIONS}
                  onValueChange={(value) => handleQueryStateChange({ sort: value as BoardSort, page: 1 })}
                  hideSelectedOption
                  delayDuration={PROJECTS_TOOLTIP_DELAY}
                  tooltip="Choose how the board list is ordered"
                />

                <WorkspaceToolbarSelect
                  label="Page size"
                  value={String(queryState.pageSize)}
                  selectedLabel={selectedBoardPageSizeLabel}
                  options={BOARD_PAGE_SIZE_OPTIONS.map((pageSize) => ({
                    value: String(pageSize),
                    label: String(pageSize),
                  }))}
                  onValueChange={(value) => handleQueryStateChange({ pageSize: Number(value), page: 1 })}
                  widthClassName="xl:w-40 xl:flex-none"
                  hideSelectedOption
                  delayDuration={PROJECTS_TOOLTIP_DELAY}
                  tooltip="Choose how many boards to show per page"
                />

                <div className="flex min-w-0 flex-col gap-2 xl:flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                    Quick filters
                  </p>
                  <div className="flex flex-wrap items-center gap-2 xl:min-h-11">
                    {([
                      { label: "All", value: "all", shortcut: null },
                      { label: "Owned by me", value: "owned", shortcut: "1" },
                      { label: "Shared with me", value: "shared", shortcut: "2" },
                      { label: "Favorites", value: "favorites", shortcut: "3" },
                    ] as Array<{ label: string; value: BoardMembershipFilter; shortcut: string | null }>).map((filter) => {
                      const isActive = queryState.membership === filter.value;
                      return (
                        <WorkspaceFilterChip
                          key={filter.value}
                          label={filter.label}
                          isActive={isActive}
                          onClick={() => handleQueryStateChange({ membership: filter.value, page: 1 })}
                          delayDuration={PROJECTS_TOOLTIP_DELAY}
                          tooltip={
                            filter.value === "all"
                              ? "Show every project you belong to"
                              : filter.value === "owned"
                                ? "Show only projects you own"
                                : filter.value === "favorites"
                                  ? "Show projects you marked as favorites"
                                : "Show projects shared with you by other owners"
                          }
                          shortcut={
                            filter.shortcut ? (
                              <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>
                                {filter.shortcut}
                              </kbd>
                            ) : undefined
                          }
                        />
                      );
                    })}

                  </div>
                </div>

                <div className="xl:ml-auto xl:pt-[1.625rem]">
                  <WorkspaceClearButton
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    delayDuration={PROJECTS_TOOLTIP_DELAY}
                    tooltip={
                      hasActiveFilters
                        ? "Reset search, filters, sorting, and return to the first page"
                        : "No filters are active right now"
                    }
                    shortcut={<kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Esc</kbd>}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {renderInitialBoardsLoad ? (
          <div
            className="grid content-start gap-7 md:grid-cols-2 md:min-h-[var(--boards-grid-min-height-md)] lg:grid-cols-3 lg:min-h-[var(--boards-grid-min-height-lg)] xl:grid-cols-4 xl:min-h-[var(--boards-grid-min-height-xl)]"
            style={reservedBoardGridStyle}
            aria-label="Loading boards"
          >
            {Array.from({ length: queryState.pageSize }, (_, index) => (
              <BoardCardSkeleton key={index} isDarkMode={isDarkMode} />
            ))}
          </div>
        ) : boardList.summary.activeProjects === 0 ? (
          <div className="text-center py-20">
            <Folder className={`w-16 h-16 ${currentTheme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${currentTheme.textSecondary} mb-2`}>No projects yet</h3>
            <p className={`${currentTheme.textMuted} mb-6`}>Create your first project to get started</p>
            <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  data-coachmark="projects-empty-create"
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
                >
                  <Plus className="w-5 h-5" />
                  Create Project
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                {CREATE_PROJECT_TOOLTIP}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : boardList.items.length === 0 ? (
          <div
            className="flex items-start justify-center pt-8 md:min-h-[var(--boards-grid-min-height-md)] lg:min-h-[var(--boards-grid-min-height-lg)] xl:min-h-[var(--boards-grid-min-height-xl)]"
            style={reservedBoardGridStyle}
          >
            <div className="text-center py-20">
              <Folder className={`w-16 h-16 ${currentTheme.textMuted} mx-auto mb-4`} />
              <h3 className={`text-xl font-semibold ${currentTheme.textSecondary} mb-2`}>No boards match these filters</h3>
              <p className={`${currentTheme.textMuted} mb-6`}>
                Try clearing a filter or broadening your search to see more boards.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`grid content-start gap-7 transition-opacity duration-200 md:grid-cols-2 md:min-h-[var(--boards-grid-min-height-md)] lg:grid-cols-3 lg:min-h-[var(--boards-grid-min-height-lg)] xl:grid-cols-4 xl:min-h-[var(--boards-grid-min-height-xl)] ${renderRefreshingBoards ? "opacity-70" : "opacity-100"}`}
              style={reservedBoardGridStyle}
              data-coachmark="projects-board-grid"
            >
              {boardList.items.map((board: BoardListItem, index) => {
                const canManageBoard = isBoardOwner(board, user.id);

                return (
                  <div
                    key={board.id}
                    data-coachmark={index === 0 ? "projects-board-card" : undefined}
                    className={`relative min-h-[17.5rem] w-full overflow-hidden ${boardCardSurfaceClassName} rounded-2xl border-2 ${currentTheme.border} p-6 transition-all duration-300 text-left group ${boardCardHoverClassName}`}
                  >
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                      {canManageBoard && (
                        <UtilityIconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditBoard(board);
                          }}
                          emphasis="elevated"
                          className={boardCardActionButtonClassName}
                        >
                          <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Edit3 className="w-4 h-4" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Edit project details</TooltipContent>
                          </Tooltip>
                        </UtilityIconButton>
                      )}

                      <UtilityIconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenBoardInfo(board);
                        }}
                        emphasis="elevated"
                        className={boardCardActionButtonClassName}
                      >
                        <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Info className="w-4 h-4" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>View project details</TooltipContent>
                        </Tooltip>
                      </UtilityIconButton>

                      <UtilityIconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleFavoriteBoard(board);
                        }}
                        emphasis="elevated"
                        className={boardCardActionButtonClassName}
                        focusStyle="none"
                      >
                        <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                          <TooltipTrigger asChild>
                            <span className={`inline-flex ${board.isFavorite ? currentTheme.primaryText : ""}`}>
                              <Star className="w-4 h-4" fill={board.isFavorite ? "currentColor" : "none"} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {board.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          </TooltipContent>
                        </Tooltip>
                      </UtilityIconButton>
                    </div>

                    <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                      <TooltipTrigger asChild>
                        <button onClick={() => handleSelectBoard(board.id)} className="w-full text-left">
                          <div>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <BoardLogo
                                  iconKey={board.logoIconKey}
                                  colorKey={board.logoColorKey}
                                  size="md"
                                  className="group-hover:scale-110 transition-transform duration-300 shadow-md"
                                />
                              </div>
                              <ArrowRight
                                className={`w-5 h-5 ${currentTheme.textMuted} group-hover:${currentTheme.primaryText} transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-0`}
                              />
                            </div>

                            <OverflowTooltip
                              as="h3"
                              text={board.name}
                              className={`mb-2 text-xl font-bold ${currentTheme.text} truncate`}
                              align="start"
                              delayDuration={PROJECTS_TOOLTIP_DELAY}
                            />
                            <OverflowTooltip
                              as="p"
                              text={board.description || "No description"}
                              className={`mb-4 min-h-[3.75rem] overflow-hidden break-all text-sm ${currentTheme.textMuted} opacity-90`}
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                              }}
                              tooltipClassName="max-w-md whitespace-normal break-words"
                              align="start"
                              delayDuration={PROJECTS_TOOLTIP_DELAY}
                            />

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all ${
                                      board.memberCount > 0
                                        ? `${currentTheme.bgSecondary} ${currentTheme.textSecondary} ${currentTheme.border} group-hover:${currentTheme.borderHover}`
                                        : `${currentTheme.bgSecondary} ${currentTheme.textMuted} ${currentTheme.border}`
                                    }`}
                                    aria-label={`${board.memberCount} ${board.memberCount === 1 ? "member" : "members"}`}
                                  >
                                    <Users className="h-4 w-4" />
                                    <span>
                                      {board.memberCount} {board.memberCount === 1 ? "member" : "members"}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>
                                  {board.memberCount === 0
                                    ? "Only you are on this project right now"
                                    : `${board.memberCount} ${board.memberCount === 1 ? "member" : "members"} on this project`}
                                </TooltipContent>
                              </Tooltip>

                              {board.isFavorite && (
                                <Tooltip delayDuration={PROJECTS_TOOLTIP_DELAY}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium ${currentTheme.bgSecondary} ${currentTheme.textSecondary} ${currentTheme.border}`}
                                      aria-label="Favorited board"
                                    >
                                      <Star className={`h-4 w-4 ${currentTheme.primaryText} fill-current`} />
                                      <span>Favorite</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8}>
                                    This project is in your favorites
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={10}>
                        Open this project
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>

          </>
        )}

        {shouldShowPaginationFooter && (
          <WorkspacePaginationFooter
            currentPage={boardList.page}
            totalPages={effectiveTotalPages}
            onPageChange={handlePageChange}
            createPageHref={createPageHref}
            disabled={disablePaginationFooter}
            className={`mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t pt-5 ${currentTheme.border}`}
            keycapClassName={`rounded-md border px-2 py-1 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}
            mutedTextClassName={`text-xs ${currentTheme.textMuted}`}
            pageActiveClassName={`pointer-events-none cursor-default border ${currentTheme.primaryBorder} ${currentTheme.accentPaginationActive} shadow-sm`}
            pageInactiveClassName={`!border ${currentTheme.border} !bg-white dark:!bg-input/30 ${workspaceSurface.controlSurfaceHoverClassName} ${currentTheme.textSecondary} hover:!bg-white dark:hover:!bg-input/30 hover:text-inherit`}
            previousNextInactiveClassName={`!border ${currentTheme.border} !bg-white/75 dark:!bg-input/20 ${workspaceSurface.controlSurfaceHoverClassName} ${currentTheme.textSecondary} hover:!bg-white/75 dark:hover:!bg-input/20 hover:text-inherit`}
            previousNextDisabledClassName={`pointer-events-none !border-transparent !bg-transparent ${currentTheme.textMuted}`}
            ellipsisClassName={currentTheme.textMuted}
            summaryText={getResultsSummaryText(boardList.page, boardList.pageSize, boardList.totalItems)}
            summaryTextClassName={`text-xs ${currentTheme.textMuted}`}
          />
        )}
        </div>
      </main>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBoardCreated={handleBoardCreated}
      />

      <EditProjectModal
        key={selectedBoard ? `${selectedBoard.id}-${isEditModalOpen ? "open" : "closed"}` : "no-board"}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        board={selectedBoard}
        onBoardUpdated={handleBoardUpdated}
      />

      <BoardInfoModal
        isOpen={isBoardInfoModalOpen}
        onClose={() => setIsBoardInfoModalOpen(false)}
        board={boardForInfo}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenProfile={() => navigate("/app/profile")}
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
