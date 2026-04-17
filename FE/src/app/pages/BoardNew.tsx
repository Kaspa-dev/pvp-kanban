import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Archive, ArrowRight, ClipboardList, Clock, LayoutGrid, List as ListIcon, LoaderCircle, RotateCw } from "lucide-react";
import { KanbanColumn } from "../components/KanbanColumn";
import { AddCardModal } from "../components/AddCardModal";
import { EditTaskModal } from "../components/EditTaskModal";
import { Sidebar } from "../components/Sidebar";
import { Toolbar } from "../components/Toolbar";
import { SettingsModal } from "../components/SettingsModal";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { ListView } from "../components/ListView";
import { BacklogView2 } from "../components/BacklogView2";
import { HistoryView } from "../components/HistoryView";
import { CoachmarkOverlay } from "../components/CoachmarkOverlay";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { BoardWorkspaceView, getCoachmarkFlowForView, useBoardCoachmarks } from "../hooks/useBoardCoachmarks";
import {
  UserProgress,
  fetchCurrentUserProgress,
  getDefaultUserProgress,
} from "../utils/gamification";
import { getBoard, Board as BoardType } from "../utils/boards";
import {
  addTaskToQueue,
  Card,
  Cards,
  createBoardTask,
  createEmptyCards,
  deleteBoardTask,
  getBoardCards,
  Priority,
  removeTaskFromQueue,
  startBoardQueue,
  TaskAssignee,
  TaskStatus,
  TaskType,
  flattenCards,
  groupCards,
  updateBoardTask,
} from "../utils/cards";
import {
  Label,
  createLabel,
  getBoardLabels,
} from "../utils/labels";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import {
  BacklogWorkspaceFilters,
  DEFAULT_BACKLOG_WORKSPACE_FILTERS,
  DEFAULT_TASK_WORKSPACE_FILTERS,
  TaskWorkspaceFilters,
} from "../utils/taskWorkspaceFilters";

const WORKSPACE_VIEW_ORDER: BoardWorkspaceView[] = ["board", "list", "staging", "backlog", "history"];
const BOARD_VIEW_TABS: Array<{ value: BoardWorkspaceView; label: string; icon: typeof LayoutGrid }> = [
  { value: "board", label: "Board", icon: LayoutGrid },
  { value: "list", label: "List", icon: ListIcon },
  { value: "staging", label: "Staging", icon: Archive },
  { value: "backlog", label: "Backlog", icon: ClipboardList },
  { value: "history", label: "History", icon: Clock },
];

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

export function Board() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const { boardId } = useParams<{ boardId: string }>();
  const numericBoardId = boardId ? Number(boardId) : NaN;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Card | null>(null);
  const [pendingReplay, setPendingReplay] = useState<{ flowId: ReturnType<typeof getCoachmarkFlowForView>; targetView: BoardWorkspaceView } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; cardId: number | null; title: string }>({
    isOpen: false,
    cardId: null,
    title: "",
  });

  const [view, setView] = useState<BoardWorkspaceView>("board");
  const [listFilters, setListFilters] = useState<TaskWorkspaceFilters>(DEFAULT_TASK_WORKSPACE_FILTERS);
  const [backlogFilters, setBacklogFilters] = useState<BacklogWorkspaceFilters>(DEFAULT_BACKLOG_WORKSPACE_FILTERS);

  const [labels, setLabels] = useState<Label[]>([]);
  const [cards, setCards] = useState<Cards>(createEmptyCards());
  const [currentBoard, setCurrentBoard] = useState<BoardType | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [boardAccessState, setBoardAccessState] = useState<"available" | "forbidden" | "notFound">("available");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [workspaceReloadState, setWorkspaceReloadState] = useState<{ count: number; mode: "hard" | "soft" }>({
    count: 0,
    mode: "hard",
  });
  const [isRefreshingWorkspace, setIsRefreshingWorkspace] = useState(false);
  const [taskDataVersion, setTaskDataVersion] = useState(0);
  const [taskIndexRefreshToken, setTaskIndexRefreshToken] = useState(0);
  const [isTaskIndexRefreshing, setIsTaskIndexRefreshing] = useState(false);
  const [isRefreshIndicatorPinned, setIsRefreshIndicatorPinned] = useState(false);
  const activeBoardIdRef = useRef<number | null>(null);
  const refreshIndicatorTimeoutRef = useRef<number | null>(null);
  const refreshIndicatorMinUntilRef = useRef<number>(0);

  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    if (!user) {
      return getDefaultUserProgress();
    }

    return {
      ...getDefaultUserProgress(),
      username: user.displayName,
      email: user.email,
    };
  });

  const {
    preferences,
    hasFetched: hasFetchedPreferences,
    errorMessage: preferencesError,
    markFlowCompleted,
  } = useUserPreferences();

  useEffect(() => {
    if (!user) {
      return;
    }

    setUserProgress((prev) => ({
      ...prev,
      username: user.displayName,
      email: user.email,
    }));
  }, [user]);

  useEffect(() => {
    setTaskDataVersion((current) => current + 1);
  }, [cards]);

  useEffect(() => {
    return () => {
      if (refreshIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(refreshIndicatorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const preserveExistingWorkspace =
      workspaceReloadState.mode === "soft" && activeBoardIdRef.current === numericBoardId;

    const loadBoardWorkspace = async () => {
      if (!user) {
        return;
      }

      if (!Number.isFinite(numericBoardId)) {
        activeBoardIdRef.current = null;
        setCurrentBoard(null);
        setLabels([]);
        setCards(createEmptyCards());
        setBoardAccessState("notFound");
        setLoadError("");
        setActionError("");
        setIsLoadingBoard(false);
        return;
      }

      try {
        if (preserveExistingWorkspace) {
          setIsRefreshingWorkspace(true);
        } else {
          setIsLoadingBoard(true);
          setCurrentBoard(null);
          setLabels([]);
          setCards(createEmptyCards());
        }
        setBoardAccessState("available");
        setLoadError("");
        setActionError("");

        const boardResult = await getBoard(numericBoardId);

        if (!isActive) {
          return;
        }

        if (boardResult.status === "forbidden" || boardResult.status === "notFound") {
          activeBoardIdRef.current = null;
          setBoardAccessState(boardResult.status);
          setCurrentBoard(null);
          setLabels([]);
          setCards(createEmptyCards());
          return;
        }

        if (boardResult.status === "error") {
          activeBoardIdRef.current = null;
          setLoadError(boardResult.error);
          setCurrentBoard(null);
          setLabels([]);
          setCards(createEmptyCards());
          return;
        }

        const [boardLabels, boardCards, progress] = await Promise.all([
          getBoardLabels(numericBoardId),
          getBoardCards(numericBoardId),
          fetchCurrentUserProgress(),
        ]);

        if (!isActive) {
          return;
        }

        setBoardAccessState("available");
        activeBoardIdRef.current = boardResult.board.id;
        setCurrentBoard(boardResult.board);
        setLabels(boardLabels);
        setCards(boardCards);
        setUserProgress({
          username: user.displayName,
          email: user.email,
          xp: progress.xp,
          level: progress.level,
          tasksCompleted: progress.tasksCompleted,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load this board right now.";
        activeBoardIdRef.current = null;
        setLoadError(message);
        setCurrentBoard(null);
        setLabels([]);
        setCards(createEmptyCards());
      } finally {
        if (isActive) {
          setIsLoadingBoard(false);
          setIsRefreshingWorkspace(false);
        }
      }
    };

    void loadBoardWorkspace();

    return () => {
      isActive = false;
    };
  }, [numericBoardId, user, workspaceReloadState]);

  const availableAssignees: TaskAssignee[] = useMemo(
    () =>
      currentBoard?.members.map((member) => ({
        ...member,
        name: member.displayName,
      })) ?? [],
    [currentBoard],
  );

  const allCards = useMemo(() => flattenCards(cards), [cards]);

  const setTaskInState = (task: Card) => {
    setCards((prevCards) => {
      const remainingTasks = flattenCards(prevCards).filter((existingTask) => existingTask.id !== task.id);
      return groupCards([task, ...remainingTasks]);
    });
  };

  const removeTaskFromState = (taskId: number) => {
    setCards((prevCards) => groupCards(flattenCards(prevCards).filter((task) => task.id !== taskId)));
  };

  const refreshWorkspace = (mode: "hard" | "soft" = "hard") => {
    setWorkspaceReloadState((prevState) => ({
      count: prevState.count + 1,
      mode,
    }));
  };

  const refreshCurrentView = (mode: "hard" | "soft" = "soft") => {
    setIsRefreshIndicatorPinned(true);
    refreshIndicatorMinUntilRef.current = Date.now() + 120;
    if (refreshIndicatorTimeoutRef.current !== null) {
      window.clearTimeout(refreshIndicatorTimeoutRef.current);
      refreshIndicatorTimeoutRef.current = null;
    }

    if (view === "list" || view === "backlog") {
      setTaskIndexRefreshToken((current) => current + 1);
      return;
    }

    refreshWorkspace(mode);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const refreshProgress = async () => {
    if (!user) {
      return;
    }

    try {
      const progress = await fetchCurrentUserProgress();
      setUserProgress({
        username: user.displayName,
        email: user.email,
        xp: progress.xp,
        level: progress.level,
        tasksCompleted: progress.tasksCompleted,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh your progress.";
      setActionError(message);
    }
  };

  const saveTask = async (
    taskId: number,
    updates: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      labelIds?: number[];
      assignee?: TaskAssignee | null;
      storyPoints?: number | null;
      dueDate?: string | null;
      priority?: Priority | null;
      taskType?: TaskType | null;
    },
  ) => {
    if (!Number.isFinite(numericBoardId)) {
      return;
    }

    const existingTask = allCards.find((card) => card.id === taskId);
    if (!existingTask) {
      return;
    }

    const updatedTask = await updateBoardTask(numericBoardId, taskId, {
      title: updates.title ?? existingTask.title,
      description: updates.description ?? existingTask.description ?? "",
      status: updates.status ?? existingTask.status,
      labelIds: updates.labelIds ?? existingTask.labelIds,
      assigneeUserId:
        updates.assignee === undefined
          ? existingTask.assigneeUserId
          : updates.assignee?.userId || null,
      storyPoints:
        updates.storyPoints === undefined
          ? existingTask.storyPoints
          : updates.storyPoints,
      dueDate:
        updates.dueDate === undefined
          ? existingTask.dueDate ?? null
          : updates.dueDate,
      priority: updates.priority === undefined ? existingTask.priority : updates.priority,
      taskType: updates.taskType === undefined ? existingTask.taskType : updates.taskType,
    });

    setTaskInState(updatedTask);
    await refreshProgress();
  };

  const stagingCards = useMemo(
    () => allCards.filter((card) => card.status === "backlog"),
    [allCards],
  );

  const queuedStagingCards = useMemo(
    () => stagingCards.filter((card) => card.isQueued),
    [stagingCards],
  );

  const plainStagingCards = useMemo(
    () => stagingCards.filter((card) => !card.isQueued),
    [stagingCards],
  );

  const workflowCards = useMemo(
    () => allCards.filter((card) => card.status !== "backlog"),
    [allCards],
  );

  const workflowColumns = useMemo(
    () => ({
      todo: workflowCards.filter((card) => card.status === "todo"),
      inProgress: workflowCards.filter((card) => card.status === "inProgress"),
      inReview: workflowCards.filter((card) => card.status === "inReview"),
      done: workflowCards.filter((card) => card.status === "done"),
    }),
    [workflowCards],
  );

  const currentBoardFlow = useMemo(
    () => getCoachmarkFlowForView(view, workflowCards.length > 0),
    [view, workflowCards.length],
  );
  const boardWorkspaceWidthClassName = "mx-auto w-full max-w-[1850px]";
  const isCurrentViewDataRefreshing =
    isLoadingBoard ||
    isRefreshingWorkspace ||
    ((view === "list" || view === "backlog") && isTaskIndexRefreshing);

  const isCurrentViewRefreshing = isCurrentViewDataRefreshing || isRefreshIndicatorPinned;

  useEffect(() => {
    if (!isCurrentViewDataRefreshing) {
      return;
    }

    setIsRefreshIndicatorPinned(true);
    refreshIndicatorMinUntilRef.current = Date.now() + 120;
    if (refreshIndicatorTimeoutRef.current !== null) {
      window.clearTimeout(refreshIndicatorTimeoutRef.current);
      refreshIndicatorTimeoutRef.current = null;
    }
  }, [isCurrentViewDataRefreshing]);

  useEffect(() => {
    if (!isRefreshIndicatorPinned) {
      return;
    }

    if (refreshIndicatorTimeoutRef.current !== null) {
      window.clearTimeout(refreshIndicatorTimeoutRef.current);
      refreshIndicatorTimeoutRef.current = null;
    }

    if (isCurrentViewDataRefreshing) {
      return;
    }

    const remainingMinimum = Math.max(0, refreshIndicatorMinUntilRef.current - Date.now());
    refreshIndicatorTimeoutRef.current = window.setTimeout(() => {
      setIsRefreshIndicatorPinned(false);
      refreshIndicatorTimeoutRef.current = null;
    }, remainingMinimum + 150);
  }, [isCurrentViewDataRefreshing, isRefreshIndicatorPinned]);

  const coachmarks = useBoardCoachmarks({
    view,
    hasWorkflowCards: workflowCards.length > 0,
    coachmarksEnabled: preferences.coachmarksEnabled,
    completedFlows: preferences.completedFlows,
    hasFetchedPreferences,
    isBlocked:
      isLoadingBoard ||
      isModalOpen ||
      isSettingsOpen ||
      editingTask !== null ||
      deleteDialog.isOpen,
    onFlowCompleted: (flowId) => {
      void markFlowCompleted(flowId);
    },
  });

  const {
    activeFlowId,
    activeStep,
    stepIndex,
    totalSteps,
    targetRect,
    startFlow,
    closeFlow,
    goToNextStep,
    goToPreviousStep,
  } = coachmarks;

  useEffect(() => {
    if (
      isLoadingBoard ||
      !currentBoard ||
      isModalOpen ||
      isSettingsOpen ||
      editingTask !== null ||
      deleteDialog.isOpen ||
      activeFlowId !== null
    ) {
      return;
    }

    const handleWorkspaceKeybind = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditableKeyboardTarget(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key !== "q" && key !== "e" && key !== "r") {
        return;
      }

      event.preventDefault();
      if (key === "r") {
        if (!isRefreshingWorkspace && !isLoadingBoard && !isTaskIndexRefreshing) {
          refreshCurrentView("soft");
        }
        return;
      }

      setView((currentView) => {
        const currentIndex = WORKSPACE_VIEW_ORDER.indexOf(currentView);
        if (currentIndex === -1) {
          return currentView;
        }

        if (key === "q") {
          return WORKSPACE_VIEW_ORDER[(currentIndex - 1 + WORKSPACE_VIEW_ORDER.length) % WORKSPACE_VIEW_ORDER.length];
        }

        return WORKSPACE_VIEW_ORDER[(currentIndex + 1) % WORKSPACE_VIEW_ORDER.length];
      });
    };

    window.addEventListener("keydown", handleWorkspaceKeybind);
    return () => {
      window.removeEventListener("keydown", handleWorkspaceKeybind);
    };
  }, [
    activeFlowId,
    currentBoard,
    deleteDialog.isOpen,
    editingTask,
    isTaskIndexRefreshing,
    isRefreshingWorkspace,
    isLoadingBoard,
    isModalOpen,
    isSettingsOpen,
    view,
  ]);

  const handleCardDrop = async (cardId: number, _fromColumnId: string, toColumnId: string) => {
    try {
      setActionError("");
      await saveTask(cardId, { status: toColumnId as TaskStatus });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to move the task right now.";
      setActionError(message);
    }
  };

  const handleAddCard = async (newCard: {
    title: string;
    description: string;
    status: "todo" | "inProgress" | "inReview" | "done" | "backlog";
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number;
    priority?: Priority;
    taskType?: TaskType;
    dueDate?: string | null;
  }) => {
    if (!Number.isFinite(numericBoardId)) {
      return;
    }

    try {
      setActionError("");
      const createdTask = await createBoardTask(numericBoardId, {
        title: newCard.title,
        description: newCard.description,
        status: newCard.status,
        labelIds: newCard.labelIds,
        assigneeUserId: newCard.assignee?.userId || null,
        storyPoints: newCard.storyPoints,
        priority: newCard.priority,
        taskType: newCard.taskType,
        dueDate: newCard.dueDate || null,
      });

      setTaskInState(createdTask);
      await refreshProgress();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the task right now.";
      setActionError(message);
      throw new Error(message);
    }
  };

  const handleAssigneeChange = async (cardId: number, newAssignee: TaskAssignee | null) => {
    try {
      setActionError("");
      await saveTask(cardId, { assignee: newAssignee });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the assignee right now.";
      setActionError(message);
    }
  };

  const handleDeleteRequest = (cardId: number, title: string) => {
    setDeleteDialog({ isOpen: true, cardId, title });
  };

  const handleDeleteConfirm = async () => {
    if (!Number.isFinite(numericBoardId) || deleteDialog.cardId === null) {
      return;
    }

    try {
      setActionError("");
      await deleteBoardTask(numericBoardId, deleteDialog.cardId);
      removeTaskFromState(deleteDialog.cardId);
      setDeleteDialog({ isOpen: false, cardId: null, title: "" });
      await refreshProgress();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete the task right now.";
      setActionError(message);
    }
  };

  const handleEditTask = (cardId: number) => {
    const card = allCards.find((item) => item.id === cardId) ?? null;
    setEditingTask(card);
  };

  const handleSaveEdit = async (cardId: number, updates: {
    title: string;
    description: string;
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number | null;
    priority?: Priority | null;
    taskType?: TaskType | null;
    dueDate?: string | null;
  }) => {
    try {
      setActionError("");
      await saveTask(cardId, updates);
      setEditingTask(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the task right now.";
      setActionError(message);
      throw new Error(message);
    }
  };

  const handleMoveToBacklog = async (cardId: number) => {
    try {
      setActionError("");
      await saveTask(cardId, { status: "backlog" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to move the task back to staging right now.";
      setActionError(message);
    }
  };

  const handleAddToQueue = async (cardId: number) => {
    if (!Number.isFinite(numericBoardId)) {
      return;
    }

    try {
      setActionError("");
      const updatedTask = await addTaskToQueue(numericBoardId, cardId);
      setTaskInState(updatedTask);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add the task to the queue right now.";
      setActionError(message);
    }
  };

  const handleRemoveFromQueue = async (cardId: number) => {
    if (!Number.isFinite(numericBoardId)) {
      return;
    }

    try {
      setActionError("");
      const updatedTask = await removeTaskFromQueue(numericBoardId, cardId);
      setTaskInState(updatedTask);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove the task from the queue right now.";
      setActionError(message);
    }
  };

  const handleStartQueue = async () => {
    if (!Number.isFinite(numericBoardId)) {
      return;
    }

    try {
      setActionError("");
      const startedTasks = await startBoardQueue(numericBoardId);
      startedTasks.forEach(setTaskInState);
      await refreshProgress();
      setView("board");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start the queue right now.";
      setActionError(message);
    }
  };

  const handleCreateLabel = async (name: string, color: string) => {
    if (!Number.isFinite(numericBoardId)) {
      return;
    }

    try {
      setActionError("");
      const newLabel = await createLabel(numericBoardId, name, color);
      setLabels((prevLabels) => [...prevLabels, newLabel]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the label right now.";
      setActionError(message);
      throw new Error(message);
    }
  };

  const replayFlowForView = (targetView: BoardWorkspaceView) => {
    const flowId = getCoachmarkFlowForView(targetView, workflowCards.length > 0);
    if (!flowId) {
      return;
    }

    if (view === targetView) {
      startFlow(flowId);
      return;
    }

    setView(targetView);
    setPendingReplay({ flowId, targetView });
  };

  useEffect(() => {
    if (!pendingReplay || view !== pendingReplay.targetView || isLoadingBoard) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (pendingReplay.flowId) {
        startFlow(pendingReplay.flowId);
      }
      setPendingReplay(null);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoadingBoard, pendingReplay, startFlow, view]);

  if (!user) {
    return null;
  }

  if (isLoadingBoard) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${currentTheme.bgSecondary}`}>
        <p className={currentTheme.textMuted}>Loading board...</p>
      </div>
    );
  }

  if (boardAccessState !== "available" || loadError) {
    const stateContent =
      boardAccessState === "forbidden"
        ? {
            title: "You no longer have access to this board",
            description: "Your membership may have changed, or this board is private to another team.",
          }
        : {
            title: "Board not found",
            description: "This board may have been deleted, or the link is no longer valid.",
          };

    return (
      <div className={`flex min-h-screen items-center justify-center px-6 ${currentTheme.bgSecondary}`}>
        <div className={`w-full max-w-xl rounded-3xl border ${currentTheme.border} ${currentTheme.cardBg} p-8 shadow-xl`}>
          <h1 className={`text-2xl font-bold ${currentTheme.text}`}>
            {loadError ? "Unable to load this board" : stateContent.title}
          </h1>
          <p className={`mt-3 text-sm ${currentTheme.textMuted}`}>
            {loadError ? loadError : stateContent.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/app")}
              className={`rounded-xl border px-5 py-3 font-semibold ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.text} transition-all hover:${currentTheme.bgTertiary}`}
            >
              Back to Projects
            </button>
            {loadError && (
              <button
                onClick={() => refreshWorkspace("hard")}
                className={`rounded-xl bg-gradient-to-r px-5 py-3 font-semibold text-white transition-all ${currentTheme.primary}`}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${currentTheme.bgSecondary}`}>
        <p className={currentTheme.textMuted}>Loading board...</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <SidebarProvider
        defaultOpen={false}
        className={`${workspaceSurface.pageClassName} h-screen max-h-screen flex-col overflow-hidden`}
        style={{ "--sidebar-top-offset": "4.75rem" } as CSSProperties}
      >
        <div className={workspaceSurface.backgroundLayerClassName}>
          {workspaceSurface.backgroundBlobs.map((blob, index) => (
            <div key={index} className={blob.className} style={blob.style} />
          ))}
        </div>

        <div className="relative z-10 shrink-0">
          <Toolbar
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={handleLogout}
            onProfileClick={() => navigate("/app/profile")}
            onReplayCurrentHints={
              preferences.coachmarksEnabled && currentBoardFlow
                ? () => replayFlowForView(view)
                : undefined
            }
            userProfile={{
              username: userProgress.username,
              subtitle: `Level ${userProgress.level}`,
            }}
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
            <Sidebar
              onCreateTask={() => setIsModalOpen(true)}
              boardName={currentBoard.name}
              boardLogoIconKey={currentBoard.logoIconKey}
              boardLogoColorKey={currentBoard.logoColorKey}
            />

            <SidebarInset className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
              <div className={`shrink-0 border-b ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/45" : "bg-white/72"} backdrop-blur-xl`}>
                <div className={`${boardWorkspaceWidthClassName} flex items-center gap-2 pl-9 pr-6 py-2`}>
                  <kbd className={`hidden rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${currentTheme.border} ${currentTheme.textMuted} md:inline-flex`}>
                    Q
                  </kbd>
                  <div
                    className="inline-flex max-w-full items-center gap-1 overflow-x-auto pl-1"
                    data-coachmark="toolbar-view-switcher"
                  >
                    {BOARD_VIEW_TABS.map(({ value, label, icon: Icon }) => (
                      <Tooltip key={value}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setView(value)}
                            className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                              view === value
                                ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                                : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} ${isDarkMode ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.04]"}`
                            }`}
                            type="button"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={8}>{label} view</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <kbd className={`hidden rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${currentTheme.border} ${currentTheme.textMuted} md:inline-flex`}>
                    E
                  </kbd>
                  <div className="ml-auto flex items-center gap-3">
                    <div className="text-[11px] font-medium md:hidden">
                      <span className={currentTheme.textMuted}>Q / E</span>
                    </div>
                    <kbd className={`hidden rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${currentTheme.border} ${currentTheme.textMuted} md:inline-flex`}>
                      R
                    </kbd>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => refreshCurrentView("soft")}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${
                            isCurrentViewRefreshing
                              ? `${currentTheme.primaryText} bg-transparent`
                              : isDarkMode
                                ? "bg-transparent text-zinc-400 hover:bg-white/[0.05]"
                                : "bg-transparent text-slate-500 hover:bg-black/[0.04]"
                          }`}
                          disabled={isCurrentViewRefreshing}
                          aria-label={isCurrentViewRefreshing ? "Refreshing board data" : "Refresh current view"}
                          type="button"
                          >
                            {isCurrentViewRefreshing ? (
                              <LoaderCircle className={`h-4 w-4 animate-spin [animation-duration:650ms] ${isDarkMode ? "brightness-125 saturate-125" : "brightness-110 saturate-125"}`} />
                            ) : (
                              <RotateCw className="h-4 w-4" />
                            )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8}>
                        {isCurrentViewRefreshing ? "Refreshing..." : "Refresh current view (R)"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {actionError && (
                <div className="shrink-0 px-8 pt-4 lg:px-10 xl:px-12">
                  <div className={`${boardWorkspaceWidthClassName} rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700`}>
                    {actionError}
                  </div>
                </div>
              )}

              {preferencesError && !actionError && (
                <div className="shrink-0 px-8 pt-4 lg:px-10 xl:px-12">
                  <div className={`${boardWorkspaceWidthClassName} rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800`}>
                    {preferencesError}
                  </div>
                </div>
              )}

              {view === "board" && (
                <>
                  {workflowCards.length > 0 ? (
                    <main className={`flex-1 min-h-0 overflow-hidden ${currentTheme.bgSecondary}`}>
                      <div className={`${boardWorkspaceWidthClassName} flex h-full min-h-0 flex-col gap-6 px-8 py-6 lg:px-10 xl:px-12`}>
                        <div className="shrink-0" data-coachmark="board-header">
                          <h1 className={`font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                            Board
                          </h1>
                          <p className={`mt-1 text-base ${currentTheme.textMuted}`}>
                            Keep active work moving across the workflow, surface bottlenecks early, and give each column a stable operating lane.
                          </p>
                        </div>

                        <div className={`shrink-0 border-t ${currentTheme.border}`} />

                        <div className="flex-1 min-h-0">
                          <div className="grid h-full min-h-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" data-coachmark="board-columns-grid">
                          <KanbanColumn id="todo" title="To Do" count={workflowColumns.todo.length} cards={workflowColumns.todo} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                          <KanbanColumn id="inProgress" title="In Progress" count={workflowColumns.inProgress.length} cards={workflowColumns.inProgress} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                          <KanbanColumn id="inReview" title="In Review" count={workflowColumns.inReview.length} cards={workflowColumns.inReview} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                            <KanbanColumn id="done" title="Done" count={workflowColumns.done.length} cards={workflowColumns.done} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                          </div>
                        </div>

                        <div className={`shrink-0 border-t ${currentTheme.border}`} />
                      </div>
                    </main>
                  ) : (
                    <main className={`flex-1 min-h-0 overflow-hidden ${currentTheme.bgSecondary}`}>
                      <div className={`${boardWorkspaceWidthClassName} flex h-full min-h-0 flex-col gap-6 px-8 py-6 lg:px-10 xl:px-12`}>
                        <div className="shrink-0" data-coachmark="board-header">
                          <h1 className={`font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                            Board
                          </h1>
                          <p className={`mt-1 text-base ${currentTheme.textMuted}`}>
                            Keep active work moving across the workflow, surface bottlenecks early, and give each column a stable operating lane.
                          </p>
                        </div>

                        <div className={`shrink-0 border-t ${currentTheme.border}`} />

                        <div className="flex min-h-0 flex-1 items-center justify-center">
                          <div className="max-w-md px-6 text-center">
                            <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${currentTheme.primarySoftStrong}`}>
                              <ClipboardList className={`h-10 w-10 ${currentTheme.primaryText}`} />
                            </div>
                            <h2 className={`mb-3 text-2xl font-bold ${currentTheme.text}`}>No active workflow yet</h2>
                            <p className={`mb-8 text-base ${currentTheme.textMuted}`}>
                              Tasks stay in Staging until your team pulls them into To Do. Open Staging to create work or promote a ready item.
                            </p>
                            <button
                              onClick={() => setView("staging")}
                              data-coachmark="board-empty-state-cta"
                              className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg ${currentTheme.primary}`}
                            >
                              Go to Staging
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className={`shrink-0 border-t ${currentTheme.border}`} />
                      </div>
                    </main>
                  )}
                </>
              )}

              {view === "list" && (
                <>
                  {workflowCards.length > 0 ? (
                    <ListView
                      mode="active"
                      boardId={numericBoardId}
                      taskDataVersion={taskDataVersion}
                      refreshToken={taskIndexRefreshToken}
                      onRefreshingChange={setIsTaskIndexRefreshing}
                      filters={listFilters}
                      onFiltersChange={(filters) => setListFilters(filters as TaskWorkspaceFilters)}
                      onAssigneeChange={handleAssigneeChange}
                      onDelete={handleDeleteRequest}
                      onEdit={handleEditTask}
                      onMoveToBacklog={handleMoveToBacklog}
                      availableAssignees={availableAssignees}
                      labels={labels}
                    />
                  ) : (
                    <div className={`flex min-h-0 flex-1 items-center justify-center ${currentTheme.bgSecondary}`}>
                      <div className="max-w-md px-6 text-center">
                        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${currentTheme.primarySoftStrong}`}>
                          <ClipboardList className={`h-10 w-10 ${currentTheme.primaryText}`} />
                        </div>
                        <h2 className={`mb-3 text-2xl font-bold ${currentTheme.text}`}>No active workflow yet</h2>
                        <p className={`mb-8 text-base ${currentTheme.textMuted}`}>
                          List view shows tasks that have already left staging. Move work into To Do first to see it here.
                        </p>
                        <button
                          onClick={() => setView("staging")}
                          data-coachmark="list-empty-state-cta"
                          className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg ${currentTheme.primary}`}
                        >
                          Go to Staging
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {view === "staging" && (
                <main className={`flex-1 min-h-0 overflow-hidden ${currentTheme.bgSecondary}`}>
                  <BacklogView2
                    backlogCards={plainStagingCards}
                    queuedCards={queuedStagingCards}
                    onAssigneeChange={handleAssigneeChange}
                    onDelete={handleDeleteRequest}
                    onEdit={handleEditTask}
                    onAddToQueue={(cardId) => void handleAddToQueue(cardId)}
                    onRemoveFromQueue={(cardId) => void handleRemoveFromQueue(cardId)}
                    onStartQueue={() => void handleStartQueue()}
                    availableAssignees={availableAssignees}
                    labels={labels}
                    onCreateTask={() => setIsModalOpen(true)}
                  />
                </main>
              )}

              {view === "backlog" && (
                <ListView
                  mode="backlog"
                  boardId={numericBoardId}
                  taskDataVersion={taskDataVersion}
                  refreshToken={taskIndexRefreshToken}
                  onRefreshingChange={setIsTaskIndexRefreshing}
                  filters={backlogFilters}
                  onFiltersChange={(filters) => setBacklogFilters(filters as BacklogWorkspaceFilters)}
                  onAssigneeChange={handleAssigneeChange}
                  onDelete={handleDeleteRequest}
                  onEdit={handleEditTask}
                  onAddToQueue={handleAddToQueue}
                  onRemoveFromQueue={handleRemoveFromQueue}
                  availableAssignees={availableAssignees}
                  labels={labels}
                  onCreateTask={() => setIsModalOpen(true)}
                />
              )}

              {view === "history" && (
                <HistoryView
                  cards={allCards}
                  onAssigneeChange={handleAssigneeChange}
                  onDelete={handleDeleteRequest}
                  onEdit={handleEditTask}
                  onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)}
                  availableAssignees={availableAssignees}
                  labels={labels}
                />
              )}
            </SidebarInset>

            <AddCardModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onAdd={handleAddCard}
              availableLabels={labels}
              onCreateLabel={handleCreateLabel}
              availableAssignees={availableAssignees}
            />

            <EditTaskModal
              key={editingTask?.id ?? "no-task"}
              isOpen={editingTask !== null}
              onClose={() => setEditingTask(null)}
              onSave={handleSaveEdit}
              task={editingTask}
              availableLabels={labels}
              onCreateLabel={handleCreateLabel}
              availableAssignees={availableAssignees}
            />

            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              onOpenProfile={() => navigate("/app/profile")}
            />

            <ConfirmDeleteDialog
              isOpen={deleteDialog.isOpen}
              onClose={() => setDeleteDialog({ isOpen: false, cardId: null, title: "" })}
              onConfirm={() => void handleDeleteConfirm()}
              taskTitle={deleteDialog.title}
            />

            <CoachmarkOverlay
              isOpen={activeFlowId !== null}
              step={activeStep}
              targetRect={targetRect}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              onBack={goToPreviousStep}
              onNext={goToNextStep}
              onClose={() => closeFlow(true)}
            />
        </div>
      </SidebarProvider>
    </DndProvider>
  );
}
