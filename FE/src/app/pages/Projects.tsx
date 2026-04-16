import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Edit3,
  FilterX,
  Folder,
  ListTodo,
  Plus,
  Search,
  Trash2,
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
  deleteBoard,
  getUserBoardsPage,
  isBoardOwner,
  updateBoard,
} from "../utils/boards";
import { CreateBoardModal } from "../components/CreateBoardModal";
import { BoardLogo } from "../components/BoardLogo";
import { EditProjectModal } from "../components/EditProjectModal";
import { OverflowTooltip } from "../components/OverflowTooltip";
import { SettingsModal } from "../components/SettingsModal";
import { ConfirmDeleteProjectDialog } from "../components/ConfirmDeleteProjectDialog";
import { CoachmarkOverlay } from "../components/CoachmarkOverlay";
import { Toolbar } from "../components/Toolbar";
import { getProjectsCoachmarkFlow, useProjectsCoachmarks } from "../hooks/useProjectsCoachmarks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

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
const DEFAULT_MEMBERSHIP_FILTER: BoardMembershipFilter = "all";
const DEFAULT_SORT: BoardSort = "newest";

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
  page: number;
};

function parseMembershipFilter(value: string | null): BoardMembershipFilter {
  return value === "owned" || value === "shared" ? value : DEFAULT_MEMBERSHIP_FILTER;
}

function parseBoardSort(value: string | null): BoardSort {
  return value === "nameAsc" || value === "nameDesc" ? value : DEFAULT_SORT;
}

function parsePage(value: string | null): number {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseProjectsQueryState(searchParams: URLSearchParams): ProjectsQueryState {
  return {
    q: searchParams.get("q")?.trim() ?? "",
    membership: parseMembershipFilter(searchParams.get("membership")),
    sort: parseBoardSort(searchParams.get("sort")),
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

  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params;
}

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
    return "Showing 0 of 0 boards";
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `Showing ${start}-${end} of ${totalItems} boards`;
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

  const queryState = useMemo(() => parseProjectsQueryState(searchParams), [searchParams]);

  const [searchInput, setSearchInput] = useState(queryState.q);
  const [boardList, setBoardList] = useState<PagedBoardListResponse>(EMPTY_BOARD_LIST_RESPONSE);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [hasLoadedBoardsOnce, setHasLoadedBoardsOnce] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

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
          page: queryState.page,
          pageSize: BOARD_PAGE_SIZE,
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
  const effectiveTotalPages = Math.max(boardList.totalPages, 1);

  const paginationItems = useMemo(
    () => buildPaginationItems(effectiveTotalPages, boardList.page),
    [boardList.page, effectiveTotalPages],
  );
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
      isSettingsModalOpen ||
      isDeleteDialogOpen,
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
      isSettingsModalOpen ||
      isDeleteDialogOpen
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
      if (!["1", "2", "Escape", "Tab", "Shift"].includes(key)) {
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
    isDeleteDialogOpen,
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

  const handleDeleteBoard = async (boardId: number) => {
    await deleteBoard(boardId);
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
          username: user.displayName,
          subtitle: user.email,
        }}
      />

      <main className="relative z-10 w-full px-6 py-12">
        <div className="mx-auto w-full max-w-[1850px]">
        <div className={`${currentTheme.cardBg} rounded-3xl border ${currentTheme.border} p-10 mb-10 relative overflow-hidden shadow-lg`}>
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
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center shadow-lg`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className={`text-4xl font-bold ${currentTheme.text}`}>Welcome back, {user.firstName}!</h2>
              </div>
              <p className={`text-lg ${currentTheme.textSecondary} ml-[60px]`}>
                Manage your boards and bring your projects to life
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              data-coachmark="projects-create-board"
              className={`flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 hover:shadow-2xl transition-all shadow-lg group`}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2.5">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>New Project</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Create a new board and invite members
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
                      <p className={`text-2xl font-bold ${currentTheme.text}`}>{isInitialBoardsLoad ? "..." : indicator.value}</p>
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
            className={`${currentTheme.cardBg} rounded-2xl border ${currentTheme.border} p-5 mb-8 shadow-sm`}
            data-coachmark="projects-search-filters"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className={`text-base font-semibold ${currentTheme.text}`}>Browse boards</h3>
                </div>
                <div className="flex items-center gap-3">
                  {isRefreshingBoards && (
                    <p className={`text-xs ${currentTheme.primaryText} animate-pulse`}>
                      Updating results...
                    </p>
                  )}
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    Page {boardList.page}{boardList.totalPages > 0 ? ` of ${boardList.totalPages}` : ""}
                  </p>
                </div>
              </div>

              <div className={`rounded-xl border ${currentTheme.border} ${currentTheme.bgSecondary} px-4 py-4`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                  <div className="flex min-w-0 flex-col gap-2 xl:flex-[1.35]">
                    <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Search</span>
                    <div className="relative min-w-0 flex-1">
                      <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Search by board name or description"
                        className={`h-11 w-full rounded-xl border ${currentTheme.inputBorder} ${currentTheme.inputBg} pl-10 pr-4 text-sm ${currentTheme.text} placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                      />
                    </div>
                  </div>

                  <label className="block xl:w-52 xl:flex-none">
                    <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Sort by</span>
                    <Select value={queryState.sort} onValueChange={(value) => handleQueryStateChange({ sort: value as BoardSort, page: 1 })}>
                      <SelectTrigger
                        className={`h-11 rounded-xl border ${workspaceSurface.inputSurfaceClassName} ${currentTheme.text} data-[size=default]:h-11 px-4 py-0 shadow-none transition-colors hover:${currentTheme.borderHover} focus:ring-2 ${currentTheme.focus} [&_[data-slot=select-value]]:text-left dark:!bg-zinc-950 dark:hover:!bg-zinc-950`}
                        style={{
                          ...workspaceSurface.inputSurfaceStyle,
                          backgroundColor: isDarkMode ? "#09090b" : "#ffffff",
                        }}
                      >
                        <SelectValue placeholder="Sort boards" />
                      </SelectTrigger>
                      <SelectContent
                        className={`rounded-xl border ${currentTheme.border} ${currentTheme.cardBg} shadow-xl`}
                      >
                        <SelectItem className={`rounded-lg ${currentTheme.textSecondary} focus:${currentTheme.bgSecondary} focus:${currentTheme.text}`} value="newest">Newest</SelectItem>
                        <SelectItem className={`rounded-lg ${currentTheme.textSecondary} focus:${currentTheme.bgSecondary} focus:${currentTheme.text}`} value="nameAsc">Name A-Z</SelectItem>
                        <SelectItem className={`rounded-lg ${currentTheme.textSecondary} focus:${currentTheme.bgSecondary} focus:${currentTheme.text}`} value="nameDesc">Name Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>

                  <div className="flex min-w-0 flex-col gap-2 xl:flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Quick filters
                    </p>
                    <div className="flex flex-wrap items-center gap-2 xl:min-h-11">
                      {([
                        { label: "All", value: "all", shortcut: null },
                        { label: "Owned by me", value: "owned", shortcut: "1" },
                        { label: "Shared with me", value: "shared", shortcut: "2" },
                      ] as Array<{ label: string; value: BoardMembershipFilter; shortcut: string | null }>).map((filter) => {
                        const isActive = queryState.membership === filter.value;
                        return (
                          <Tooltip key={filter.value}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleQueryStateChange({ membership: filter.value, page: 1 })}
                                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                                  isActive
                                    ? `${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`
                                    : `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                                }`}
                                aria-pressed={isActive}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <span>{filter.label}</span>
                                  {filter.shortcut && (
                                    <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>
                                      {filter.shortcut}
                                    </kbd>
                                  )}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              {filter.value === "all"
                                ? "Show every board you belong to"
                                : filter.value === "owned"
                                  ? "Show only boards you own"
                                  : "Show boards shared with you by other owners"}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}

                    </div>
                  </div>

                  <div className="xl:ml-auto xl:pt-[1.625rem]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={clearFilters}
                          disabled={!hasActiveFilters}
                          className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-all ${
                            hasActiveFilters
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
                      <TooltipContent side="top" sideOffset={8}>
                        {hasActiveFilters
                          ? "Reset search, filters, sorting, and return to the first page"
                          : "No filters are active right now"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className={`flex flex-wrap items-center justify-between gap-3 border-t ${currentTheme.border} pt-4`}>
                <p className={`text-xs ${currentTheme.textSecondary}`}>
                  {getResultsSummaryText(boardList.page, boardList.pageSize, boardList.totalItems)}
                </p>
              </div>
            </div>
          </div>
        )}

        {isInitialBoardsLoad ? (
          <div className="text-center py-20">
            <p className={currentTheme.textMuted}>Loading projects...</p>
          </div>
        ) : boardList.summary.activeProjects === 0 ? (
          <div className="text-center py-20">
            <Folder className={`w-16 h-16 ${currentTheme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${currentTheme.textSecondary} mb-2`}>No projects yet</h3>
            <p className={`${currentTheme.textMuted} mb-6`}>Create your first project to get started</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              data-coachmark="projects-empty-create"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : boardList.items.length === 0 ? (
          <div className="text-center py-20">
            <Folder className={`w-16 h-16 ${currentTheme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${currentTheme.textSecondary} mb-2`}>No boards match these filters</h3>
            <p className={`${currentTheme.textMuted} mb-6`}>
              Try clearing a filter or broadening your search to see more boards.
            </p>
            <button
              onClick={clearFilters}
              className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              <FilterX className="w-5 h-5" />
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={`grid content-start gap-7 transition-opacity duration-200 md:grid-cols-2 lg:min-h-[57rem] lg:grid-cols-3 xl:min-h-[37.5rem] xl:grid-cols-4 ${isRefreshingBoards ? "opacity-70" : "opacity-100"}`}
              data-coachmark="projects-board-grid"
            >
              {boardList.items.map((board: BoardListItem, index) => {
                const canManageBoard = isBoardOwner(board, user.id);

                return (
                  <div
                    key={board.id}
                    data-coachmark={index === 0 ? "projects-board-card" : undefined}
                    className={`relative min-h-[17.5rem] w-full overflow-hidden ${currentTheme.cardBg} rounded-2xl border-2 ${currentTheme.border} p-6 hover:${currentTheme.primaryBorder} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group`}
                  >
                    {canManageBoard && (
                      <>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditBoard(board);
                          }}
                          className={`absolute top-4 right-4 p-2 ${currentTheme.bgSecondary} ${currentTheme.textSecondary} rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hover:shadow-sm ${currentTheme.accentIconButtonHover}`}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Edit3 className="w-4 h-4" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Edit board details</TooltipContent>
                          </Tooltip>
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setBoardToDelete(board);
                            setIsDeleteDialogOpen(true);
                          }}
                          className={`absolute top-4 right-14 p-2 ${currentTheme.bgSecondary} ${currentTheme.textSecondary} rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hover:shadow-sm ${currentTheme.accentIconButtonHover}`}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Trash2 className="w-4 h-4 transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Delete this board</TooltipContent>
                          </Tooltip>
                        </button>
                      </>
                    )}

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
                            className={`w-5 h-5 ${currentTheme.textMuted} group-hover:${currentTheme.primaryText} transition-all duration-300 ${
                              canManageBoard ? "group-hover:translate-x-1 group-hover:opacity-0" : "group-hover:translate-x-1"
                            }`}
                          />
                        </div>

                        <OverflowTooltip
                          as="h3"
                          text={board.name}
                          className={`mb-2 text-xl font-bold ${currentTheme.text} truncate transition-colors duration-300 group-hover:${currentTheme.primaryText}`}
                        />
                        <p
                          className={`text-sm ${currentTheme.textSecondary} mb-4 min-h-[2.5rem] overflow-hidden text-ellipsis`}
                          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                        >
                          {board.description || "No description"}
                        </p>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
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
                              ? "Only you are on this board right now"
                              : `${board.memberCount} ${board.memberCount === 1 ? "member" : "members"} on this board`}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <kbd className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Shift</kbd>
                <span className={`text-xs ${currentTheme.textMuted}`}>Previous page</span>
                <kbd className={`ml-2 rounded-md border px-2 py-1 text-[10px] font-semibold ${currentTheme.border} ${currentTheme.textMuted}`}>Tab</kbd>
                <span className={`text-xs ${currentTheme.textMuted}`}>Next page</span>
              </div>
              <div className="justify-self-center">
                <Pagination>
                  <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={createPageHref(Math.max(boardList.page - 1, 1))}
                      aria-disabled={boardList.page === 1}
                      className={`${
                        boardList.page === 1
                          ? "pointer-events-none opacity-50"
                          : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg} border ${currentTheme.border}`
                      }`}
                      onClick={(event) => {
                        if (boardList.page === 1) {
                          event.preventDefault();
                          return;
                        }

                        event.preventDefault();
                        handlePageChange(boardList.page - 1);
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
                          href={createPageHref(item)}
                          isActive={item === boardList.page}
                          className={
                            item === boardList.page
                              ? `border ${currentTheme.primaryBorder} ${currentTheme.primaryBg} ${currentTheme.primaryText} shadow-sm`
                              : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg}`
                          }
                          onClick={(event) => {
                            event.preventDefault();
                            handlePageChange(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href={createPageHref(Math.min(boardList.page + 1, effectiveTotalPages))}
                      aria-disabled={boardList.page === effectiveTotalPages}
                      className={`${
                        boardList.page === effectiveTotalPages
                          ? "pointer-events-none opacity-50"
                          : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg} border ${currentTheme.border}`
                      }`}
                      onClick={(event) => {
                        if (boardList.page === effectiveTotalPages) {
                          event.preventDefault();
                          return;
                        }

                        event.preventDefault();
                        handlePageChange(boardList.page + 1);
                      }}
                    />
                  </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
              <div />
            </div>
          </>
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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenProfile={() => navigate("/app/profile")}
      />

      <ConfirmDeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        board={boardToDelete}
        onBoardDeleted={handleDeleteBoard}
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
