import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { endOfWeek, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ArrowRight, ClipboardList, LayoutGrid } from "lucide-react";
import { KanbanColumn } from "../components/KanbanColumn";
import { AddCardModal } from "../components/AddCardModal";
import { EditTaskModal } from "../components/EditTaskModal";
import { Sidebar } from "../components/Sidebar";
import { Toolbar } from "../components/Toolbar";
import { SettingsModal } from "../components/SettingsModal";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { ProfileModal } from "../components/ProfileModal";
import { ListView } from "../components/ListView";
import { BacklogView2 } from "../components/BacklogView2";
import { HistoryView } from "../components/HistoryView";
import { CoachmarkOverlay } from "../components/CoachmarkOverlay";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
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

const WORKSPACE_VIEW_ORDER: BoardWorkspaceView[] = ["board", "list", "backlog", "history"];

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Card | null>(null);
  const [pendingReplay, setPendingReplay] = useState<{ flowId: ReturnType<typeof getCoachmarkFlowForView>; targetView: BoardWorkspaceView } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; cardId: number | null; title: string }>({
    isOpen: false,
    cardId: null,
    title: "",
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [view, setView] = useState<"board" | "list" | "backlog" | "history">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);

  const [labels, setLabels] = useState<Label[]>([]);
  const [cards, setCards] = useState<Cards>(createEmptyCards());
  const [currentBoard, setCurrentBoard] = useState<BoardType | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [boardAccessState, setBoardAccessState] = useState<"available" | "forbidden" | "notFound">("available");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [workspaceReloadCount, setWorkspaceReloadCount] = useState(0);

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
    let isActive = true;

    const loadBoardWorkspace = async () => {
      if (!user) {
        return;
      }

      if (!Number.isFinite(numericBoardId)) {
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
        setIsLoadingBoard(true);
        setCurrentBoard(null);
        setLabels([]);
        setCards(createEmptyCards());
        setBoardAccessState("available");
        setLoadError("");
        setActionError("");

        const boardResult = await getBoard(numericBoardId);

        if (!isActive) {
          return;
        }

        if (boardResult.status === "forbidden" || boardResult.status === "notFound") {
          setBoardAccessState(boardResult.status);
          return;
        }

        if (boardResult.status === "error") {
          setLoadError(boardResult.error);
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
        setLoadError(message);
        setCurrentBoard(null);
      } finally {
        if (isActive) {
          setIsLoadingBoard(false);
        }
      }
    };

    void loadBoardWorkspace();

    return () => {
      isActive = false;
    };
  }, [numericBoardId, user, workspaceReloadCount]);

  const availableAssignees: TaskAssignee[] = useMemo(
    () =>
      currentBoard?.members.map((member) => ({
        ...member,
        name: member.displayName,
      })) ?? [],
    [currentBoard],
  );

  const allCards = useMemo(() => flattenCards(cards), [cards]);
  const currentUserId = user ? Number(user.id) : null;

  const setTaskInState = (task: Card) => {
    setCards((prevCards) => {
      const remainingTasks = flattenCards(prevCards).filter((existingTask) => existingTask.id !== task.id);
      return groupCards([task, ...remainingTasks]);
    });
  };

  const removeTaskFromState = (taskId: number) => {
    setCards((prevCards) => groupCards(flattenCards(prevCards).filter((task) => task.id !== taskId)));
  };

  const refreshWorkspace = () => {
    setWorkspaceReloadCount((prevCount) => prevCount + 1);
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

  const filteredAllCards = useMemo(() => {
    return allCards.filter((card) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
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

      if (selectedLabelIds.length > 0) {
        const matchesLabels = card.labelIds.some((labelId) => selectedLabelIds.includes(labelId));
        if (!matchesLabels) {
          return false;
        }
      }

      if (activeFilter === "assigned" && card.assigneeUserId !== currentUserId) {
        return false;
      }

      if (activeFilter === "due") {
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
  }, [activeFilter, allCards, currentUserId, labels, searchQuery, selectedLabelIds]);

  const backlogCards = useMemo(
    () => filteredAllCards.filter((card) => card.status === "backlog"),
    [filteredAllCards],
  );

  const queuedBacklogCards = useMemo(
    () => backlogCards.filter((card) => card.isQueued),
    [backlogCards],
  );

  const plainBacklogCards = useMemo(
    () => backlogCards.filter((card) => !card.isQueued),
    [backlogCards],
  );

  const workflowCards = useMemo(
    () => filteredAllCards.filter((card) => card.status !== "backlog"),
    [filteredAllCards],
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
      isProfileOpen ||
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
      isProfileOpen ||
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
      if (key !== "q" && key !== "e") {
        return;
      }

      event.preventDefault();
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
    isLoadingBoard,
    isModalOpen,
    isProfileOpen,
    isSettingsOpen,
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
                onClick={refreshWorkspace}
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
      <SidebarProvider defaultOpen>
        <div className={`${workspaceSurface.pageClassName} flex h-screen max-h-screen w-full overflow-hidden`}>
        <div className={workspaceSurface.backgroundLayerClassName}>
          {workspaceSurface.backgroundBlobs.map((blob, index) => (
            <div key={index} className={blob.className} style={blob.style} />
          ))}
        </div>
        <Sidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onCreateTask={() => setIsModalOpen(true)}
          selectedLabels={selectedLabelIds}
          onLabelsChange={setSelectedLabelIds}
          onLogout={async () => {
            await logout();
            navigate("/login");
          }}
          boardName={currentBoard.name}
          boardLogoIconKey={currentBoard.logoIconKey}
          boardLogoColorKey={currentBoard.logoColorKey}
          labels={labels}
        />

        <SidebarInset className="relative z-10 flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
          <Toolbar
            view={view}
            onViewChange={setView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
            onReplayCurrentHints={() => replayFlowForView(view)}
            showViewShortcuts
            showSidebarToggle
            userProgress={userProgress}
          />

          {actionError && (
            <div className="shrink-0 px-6 pt-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {actionError}
              </div>
            </div>
          )}

          {preferencesError && !actionError && (
            <div className="shrink-0 px-6 pt-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                {preferencesError}
              </div>
            </div>
          )}

          {view === "board" && (
            <>
              {workflowCards.length > 0 ? (
                <main className={`flex-1 min-h-0 overflow-y-auto ${currentTheme.bgSecondary}`}>
                  <div
                    className={`border-b px-8 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}
                    data-coachmark="workflow-summary"
                  >
                    <div className="mx-auto flex max-w-[2000px] flex-wrap items-center justify-between gap-5">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${currentTheme.primary}`}>
                          <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className={`text-lg font-bold ${currentTheme.text}`}>Workflow Board</h2>
                          <p className={`text-sm ${currentTheme.textMuted}`}>
                            Active work outside staging, ready to move across the board.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <div className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${currentTheme.bg}`}>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${currentTheme.textMuted}`}>
                            In Flow
                          </p>
                          <p className={`text-lg font-bold ${currentTheme.text}`}>{workflowCards.length}</p>
                        </div>
                        <div className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${currentTheme.bg}`}>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${currentTheme.textMuted}`}>
                            Done
                          </p>
                          <p className={`text-lg font-bold ${currentTheme.text}`}>{workflowColumns.done.length}</p>
                        </div>
                        <div className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${currentTheme.bg}`}>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${currentTheme.textMuted}`}>
                            Staging
                          </p>
                          <p className={`text-lg font-bold ${currentTheme.text}`}>{backlogCards.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto w-full max-w-[2000px] px-8 py-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" data-coachmark="board-columns-grid">
                      <KanbanColumn id="todo" title="To Do" count={workflowColumns.todo.length} cards={workflowColumns.todo} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                      <KanbanColumn id="inProgress" title="In Progress" count={workflowColumns.inProgress.length} cards={workflowColumns.inProgress} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                      <KanbanColumn id="inReview" title="In Review" count={workflowColumns.inReview.length} cards={workflowColumns.inReview} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                      <KanbanColumn id="done" title="Done" count={workflowColumns.done.length} cards={workflowColumns.done} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)} availableAssignees={availableAssignees} labels={labels} />
                    </div>
                  </div>
                </main>
              ) : (
                <div className={`flex min-h-0 flex-1 items-center justify-center ${currentTheme.bgSecondary}`}>
                  <div className="max-w-md px-6 text-center">
                    <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${currentTheme.primarySoftStrong}`}>
                      <ClipboardList className={`h-10 w-10 ${currentTheme.primaryText}`} />
                    </div>
                    <h2 className={`mb-3 text-2xl font-bold ${currentTheme.text}`}>No active workflow yet</h2>
                    <p className={`mb-8 text-base ${currentTheme.textMuted}`}>
                      Tasks stay in Staging until your team pulls them into To Do. Open Staging to create work or promote a ready item.
                    </p>
                    <button
                      onClick={() => setView("backlog")}
                      data-coachmark="board-empty-state-cta"
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

          {view === "list" && (
            <>
              {workflowCards.length > 0 ? (
                <ListView
                  cards={workflowCards}
                  onAssigneeChange={handleAssigneeChange}
                  onDelete={handleDeleteRequest}
                  onEdit={handleEditTask}
                  onMoveToBacklog={(cardId) => void handleMoveToBacklog(cardId)}
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
                      onClick={() => setView("backlog")}
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

          {view === "backlog" && (
            <main className={`flex-1 min-h-0 overflow-hidden ${currentTheme.bgSecondary}`}>
              <BacklogView2
                backlogCards={plainBacklogCards}
                queuedCards={queuedBacklogCards}
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

          {view === "history" && (
            <HistoryView
              cards={filteredAllCards}
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

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onOpenProfile={() => setIsProfileOpen(true)} />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          userProgress={userProgress}
          tasksCompleted={userProgress.tasksCompleted}
          userTotalXP={userProgress.xp}
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
