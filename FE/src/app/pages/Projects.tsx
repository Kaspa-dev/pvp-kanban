import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Edit3,
  FilterX,
  Flag,
  Folder,
  ListTodo,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
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
import { SettingsModal } from "../components/SettingsModal";
import { ConfirmDeleteProjectDialog } from "../components/ConfirmDeleteProjectDialog";
import { BanBanLogo } from "../components/BanBanLogo";
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

const BOARD_PAGE_SIZE = 6;
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
    activeSprints: 0,
    assignedTasks: 0,
    openTasks: 0,
    completedTasks: 0,
  },
};

type ProjectsQueryState = {
  q: string;
  membership: BoardMembershipFilter;
  activeSprint: boolean;
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
    activeSprint: searchParams.get("activeSprint") === "true",
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

  if (query.activeSprint) {
    params.set("activeSprint", "true");
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
  const currentTheme = getThemeColors(theme, isDarkMode);

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
          activeSprint: queryState.activeSprint,
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
    { label: "Active Sprints", value: boardList.summary.activeSprints, icon: Flag },
    { label: "Assigned to You", value: boardList.summary.assignedTasks, icon: ListTodo },
    { label: "Open Right Now", value: boardList.summary.openTasks, icon: Clock3 },
    { label: "Completed by You", value: boardList.summary.completedTasks, icon: CheckCircle2 },
  ];

  const hasActiveFilters =
    queryState.q.length > 0 ||
    queryState.membership !== DEFAULT_MEMBERSHIP_FILTER ||
    queryState.activeSprint ||
    queryState.sort !== DEFAULT_SORT;

  const shouldShowToolbar =
    isLoadingBoards || boardList.summary.activeProjects > 0 || hasActiveFilters;
  const isInitialBoardsLoad = isLoadingBoards && !hasLoadedBoardsOnce;
  const isRefreshingBoards = isLoadingBoards && hasLoadedBoardsOnce;

  const paginationItems = useMemo(
    () => buildPaginationItems(boardList.totalPages, boardList.page),
    [boardList.page, boardList.totalPages],
  );

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
    if (page < 1 || page > boardList.totalPages || page === boardList.page) {
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

  if (!user) return null;

  return (
    <div className={`min-h-screen relative overflow-hidden ${currentTheme.bgSecondary}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: "8s" }} />
        <div className={`absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tr ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className={`absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br ${currentTheme.primarySoft} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: "12s", animationDelay: "4s" }} />
      </div>

      <header
        className={`relative z-10 border-b ${currentTheme.border} backdrop-blur-xl`}
        style={{
          backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.9)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BanBanLogo size="lg" />
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-3 px-4 py-2 ${currentTheme.bgSecondary} rounded-xl border ${currentTheme.border}`}>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center text-white font-bold shadow-md`}>
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`font-semibold ${currentTheme.text} text-sm`}>{user.displayName}</p>
                <p className={`text-xs ${currentTheme.textMuted}`}>{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className={`p-3 rounded-xl transition-all cursor-pointer relative z-20 border ${
                isDarkMode
                  ? `border-transparent hover:${currentTheme.primaryBorder} text-gray-400 hover:text-gray-200 hover:shadow-sm`
                  : "border-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`}
              type="button"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Settings className="w-5 h-5 pointer-events-none" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>Open settings</TooltipContent>
              </Tooltip>
            </button>
            <button
              onClick={handleLogout}
              className={`p-3 rounded-xl transition-all border ${
                isDarkMode
                  ? "border-transparent hover:border-red-500/50 hover:shadow-sm hover:shadow-red-500/10 text-red-400 hover:text-red-300"
                  : "border-transparent hover:bg-red-50 text-red-500 hover:text-red-600"
              } focus:outline-none focus:ring-2 focus:ring-red-500/30`}
              type="button"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <LogOut className="w-5 h-5 pointer-events-none" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>Log out</TooltipContent>
              </Tooltip>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
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
            <div className="grid grid-cols-2 gap-6 xl:grid-cols-5">
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
          <div className={`${currentTheme.cardBg} rounded-2xl border ${currentTheme.border} p-5 mb-8 shadow-sm`}>
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

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-end">
                <label className="block">
                  <span className={`mb-2 block text-sm font-semibold ${currentTheme.text}`}>Search</span>
                  <div className="relative">
                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search by board name or description"
                      className={`h-11 w-full rounded-xl border ${currentTheme.inputBorder} ${currentTheme.inputBg} pl-10 pr-4 text-sm ${currentTheme.text} placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-semibold ${currentTheme.text}`}>Sort by</span>
                  <Select value={queryState.sort} onValueChange={(value) => handleQueryStateChange({ sort: value as BoardSort, page: 1 })}>
                    <SelectTrigger
                      className={`h-11 rounded-xl border ${currentTheme.inputBorder} ${currentTheme.text} data-[size=default]:h-11 px-4 py-0 shadow-none transition-colors hover:${currentTheme.borderHover} focus:ring-2 ${currentTheme.focus} [&_[data-slot=select-value]]:text-left ${
                        isDarkMode
                          ? "bg-gray-900 hover:bg-gray-900 dark:!bg-gray-900 dark:hover:!bg-gray-900"
                          : currentTheme.inputBg
                      }`}
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
              </div>

              <div className={`rounded-xl border ${currentTheme.border} ${currentTheme.bgSecondary} px-4 py-4`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-2">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Quick filters
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {([
                        { label: "All", value: "all" },
                        { label: "Owned by me", value: "owned" },
                        { label: "Shared with me", value: "shared" },
                      ] as Array<{ label: string; value: BoardMembershipFilter }>).map((filter) => {
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
                                {filter.label}
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

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleQueryStateChange({ activeSprint: !queryState.activeSprint, page: 1 })}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                              queryState.activeSprint
                                ? `${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`
                                : `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                            }`}
                            aria-pressed={queryState.activeSprint}
                          >
                            <Flag className="h-4 w-4" />
                            Active sprint only
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          Show only boards that currently have an active sprint
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all xl:self-end ${
                          hasActiveFilters
                            ? `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.borderHover}`
                            : `${currentTheme.bg} ${currentTheme.textMuted} ${currentTheme.border}`
                        }`}
                      >
                        <FilterX className="h-4 w-4" />
                        Clear filters
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
            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isRefreshingBoards ? "opacity-70" : "opacity-100"}`}>
              {boardList.items.map((board: BoardListItem) => {
                const canManageBoard = isBoardOwner(board, user.id);

                return (
                  <div
                    key={board.id}
                    className={`relative min-h-[17.5rem] overflow-hidden ${currentTheme.cardBg} rounded-2xl border-2 ${currentTheme.border} p-6 hover:${currentTheme.primaryBorder} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group`}
                  >
                    {board.hasActiveSprint && (
                      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${currentTheme.primary}`} />
                    )}
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
                            {board.hasActiveSprint && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border ${currentTheme.primaryBorder} ${currentTheme.primaryBg} px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>
                                    <span className={`h-2 w-2 rounded-full ${currentTheme.primarySolid}`} />
                                    Active sprint
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>
                                  This board currently has an active sprint
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <ArrowRight
                            className={`w-5 h-5 ${currentTheme.textMuted} group-hover:${currentTheme.primaryText} transition-all duration-300 ${
                              canManageBoard ? "group-hover:translate-x-1 group-hover:opacity-0" : "group-hover:translate-x-1"
                            }`}
                          />
                        </div>

                        <h3 className={`text-xl font-bold ${currentTheme.text} mb-2 truncate group-hover:${currentTheme.primaryText} transition-colors duration-300`}>
                          {board.name}
                        </h3>
                        <p
                          className={`text-sm ${currentTheme.textSecondary} mb-4 min-h-[2.5rem] overflow-hidden text-ellipsis`}
                          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                        >
                          {board.description || "No description"}
                        </p>

                        <div className="mt-4 flex items-center gap-1">
                          {board.members.slice(0, 4).map((member) => (
                            <Tooltip key={member.userId}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ${isDarkMode ? "ring-gray-800 group-hover:ring-slate-600" : "ring-white group-hover:ring-slate-300"} transition-all duration-300`}
                                  style={{ backgroundColor: member.color }}
                                  aria-label={member.name}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>{member.name}</TooltipContent>
                            </Tooltip>
                          ))}
                          {board.memberCount > 4 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`w-8 h-8 rounded-full ${currentTheme.bgTertiary} flex items-center justify-center ${currentTheme.textSecondary} text-xs font-bold ring-2 ${isDarkMode ? "ring-gray-800 group-hover:ring-slate-600" : "ring-white group-hover:ring-slate-300"} transition-all duration-300`}>
                                  +{board.memberCount - 4}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>
                                {board.memberCount - 4} more {board.memberCount - 4 === 1 ? "member" : "members"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {boardList.totalPages > 1 && (
              <div className="mt-10">
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
                        href={createPageHref(Math.min(boardList.page + 1, boardList.totalPages))}
                        aria-disabled={boardList.page === boardList.totalPages}
                        className={`${
                          boardList.page === boardList.totalPages
                            ? "pointer-events-none opacity-50"
                            : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg} border ${currentTheme.border}`
                        }`}
                        onClick={(event) => {
                          if (boardList.page === boardList.totalPages) {
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
            )}
          </>
        )}
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
      />

      <ConfirmDeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        board={boardToDelete}
        onBoardDeleted={handleDeleteBoard}
      />
    </div>
  );
}
