import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { endOfWeek, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Play, Calendar, Target } from "lucide-react";
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
import { SprintPlanningModal } from "../components/SprintPlanningModal";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { useIsMobile } from "../components/ui/use-mobile";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import {
  UserProgress,
  fetchCurrentUserProgress,
  getDefaultUserProgress,
} from "../utils/gamification";
import { getBoard, Board as BoardType } from "../utils/boards";
import {
  Card,
  Cards,
  createBoardTask,
  createEmptyCards,
  deleteBoardTask,
  getBoardCards,
  Priority,
  TaskAssignee,
  TaskStatus,
  TaskType,
  flattenCards,
  groupCards,
  updateBoardTask,
} from "../utils/cards";
import {
  Label,
  getBoardLabels,
  createLabel,
} from "../utils/labels";
import {
  Sprint,
  completeSprint,
  createSprint,
  getActiveSprint,
  getBoardSprints,
  getPlannedSprint,
  startSprint,
} from "../utils/sprints";

export function Board() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const { boardId } = useParams<{ boardId: string }>();
  const isMobile = useIsMobile();
  const numericBoardId = boardId ? Number(boardId) : NaN;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSprintPlanningOpen, setIsSprintPlanningOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Card | null>(null);
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
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [plannedSprint, setPlannedSprint] = useState<Sprint | null>(null);
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
        setActiveSprint(null);
        setPlannedSprint(null);
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
        setActiveSprint(null);
        setPlannedSprint(null);
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

        const [boardLabels, boardCards, sprints, progress] = await Promise.all([
          getBoardLabels(numericBoardId),
          getBoardCards(numericBoardId),
          getBoardSprints(numericBoardId),
          fetchCurrentUserProgress(),
        ]);

        if (!isActive) {
          return;
        }

        setBoardAccessState("available");
        setCurrentBoard(boardResult.board);
        setLabels(boardLabels);
        setCards(boardCards);
        setActiveSprint(getActiveSprint(sprints));
        setPlannedSprint(getPlannedSprint(sprints));
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
      storyPoints?: number;
      dueDate?: string | null;
      priority?: Priority;
      taskType?: TaskType;
      sprintId?: number | null;
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
      storyPoints: updates.storyPoints ?? existingTask.storyPoints,
      dueDate:
        updates.dueDate === undefined
          ? existingTask.dueDate ?? null
          : updates.dueDate,
      priority:
        updates.priority === undefined
          ? existingTask.priority
          : updates.priority,
      taskType:
        updates.taskType === undefined
          ? existingTask.taskType
          : updates.taskType,
      sprintId:
        updates.sprintId === undefined
          ? existingTask.sprintId ?? null
          : updates.sprintId,
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

  const backlogCards = useMemo(() => {
    return filteredAllCards.filter((card) => !card.sprintId);
  }, [filteredAllCards]);

  const plannedSprintCards = useMemo(() => {
    if (!plannedSprint) return [];
    return filteredAllCards.filter((card) => card.sprintId === plannedSprint.id);
  }, [filteredAllCards, plannedSprint]);

  const activeSprintCards = useMemo(() => {
    if (!activeSprint) {
      return { todo: [], inProgress: [], inReview: [], done: [] };
    }

    const sprintCards = filteredAllCards.filter((card) => card.sprintId === activeSprint.id);

    return {
      todo: sprintCards.filter((card) => card.status === "todo"),
      inProgress: sprintCards.filter((card) => card.status === "inProgress"),
      inReview: sprintCards.filter((card) => card.status === "inReview"),
      done: sprintCards.filter((card) => card.status === "done"),
    };
  }, [filteredAllCards, activeSprint]);

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
        sprintId: null,
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
    status: "todo" | "inProgress" | "inReview" | "done" | "backlog";
    labelIds: number[];
    assignee: TaskAssignee | null;
    storyPoints?: number;
    priority?: Priority;
    taskType?: TaskType;
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

  const handleAddToSprint = async (cardId: number) => {
    if (!plannedSprint) return;

    try {
      setActionError("");
      await saveTask(cardId, { sprintId: plannedSprint.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add the task to the sprint.";
      setActionError(message);
    }
  };

  const handleRemoveFromSprint = async (cardId: number) => {
    try {
      setActionError("");
      await saveTask(cardId, { sprintId: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove the task from the sprint.";
      setActionError(message);
    }
  };

  const handleCreateSprint = async (input: { name: string; startDate: string; endDate: string }) => {
    if (!Number.isFinite(numericBoardId)) {
      throw new Error("Board not found.");
    }

    const sprint = await createSprint(numericBoardId, input.name, input.startDate, input.endDate);
    setPlannedSprint(sprint);
    setIsSprintPlanningOpen(false);
    return sprint;
  };

  const handleStartSprint = async () => {
    if (!Number.isFinite(numericBoardId) || !plannedSprint) {
      throw new Error("Sprint not found.");
    }

    const startedSprint = await startSprint(numericBoardId, plannedSprint.id);
    refreshWorkspace();
    setView("board");
    return startedSprint;
  };

  const handleCompleteSprint = async () => {
    if (!Number.isFinite(numericBoardId) || !activeSprint) {
      return;
    }

    try {
      setActionError("");
      await completeSprint(numericBoardId, activeSprint.id);
      refreshWorkspace();
      setView("backlog");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete the sprint right now.";
      setActionError(message);
    }
  };

  const handleCreateLabel = async (name: string, color: string) => {
    if (!Number.isFinite(numericBoardId)) return;

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

  if (!user) {
    return null;
  }

  if (isLoadingBoard) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#16181d]' : 'bg-gray-50'}`}>
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
      <div className={`flex min-h-screen items-center justify-center px-6 ${isDarkMode ? 'bg-[#16181d]' : 'bg-gray-50'}`}>
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
              className={`rounded-xl border ${currentTheme.border} px-5 py-3 font-semibold ${currentTheme.bgSecondary} ${currentTheme.text} transition-all hover:${currentTheme.bgTertiary}`}
            >
              Back to Projects
            </button>
            {loadError && (
              <button
                onClick={refreshWorkspace}
                className={`rounded-xl px-5 py-3 font-semibold text-white bg-gradient-to-r ${currentTheme.primary} transition-all`}
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
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#16181d]' : 'bg-gray-50'}`}>
        <p className={currentTheme.textMuted}>Loading board...</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`size-full flex ${isDarkMode ? 'bg-[#16181d]' : 'bg-gray-50'}`}>
        {!isMobile && (
          <Sidebar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onCreateTask={() => setIsModalOpen(true)}
            selectedLabels={selectedLabelIds}
            onLabelsChange={setSelectedLabelIds}
            onLogout={async () => {
              await logout();
              navigate('/login');
            }}
            boardName={currentBoard.name}
            boardLogoIconKey={currentBoard.logoIconKey}
            boardLogoColorKey={currentBoard.logoColorKey}
            labels={labels}
          />
        )}

        {isMobile && (
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent
              side="left"
              className={`w-full max-w-none p-0 ${currentTheme.cardBg} ${currentTheme.border}`}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Board menu</SheetTitle>
                <SheetDescription>
                  Open quick filters, labels, and account actions.
                </SheetDescription>
              </SheetHeader>
              <Sidebar
                activeFilter={activeFilter}
                onFilterChange={(filter) => {
                  setActiveFilter(filter);
                  setIsMobileSidebarOpen(false);
                }}
                onCreateTask={() => {
                  setIsMobileSidebarOpen(false);
                  setIsModalOpen(true);
                }}
                selectedLabels={selectedLabelIds}
                onLabelsChange={setSelectedLabelIds}
                onLogout={async () => {
                  setIsMobileSidebarOpen(false);
                  await logout();
                  navigate('/login');
                }}
                boardName={currentBoard.name}
                boardLogoIconKey={currentBoard.logoIconKey}
                boardLogoColorKey={currentBoard.logoColorKey}
                labels={labels}
                className="w-full min-h-full border-r-0"
              />
            </SheetContent>
          </Sheet>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Toolbar
            view={view}
            onViewChange={setView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
            onOpenMenu={() => setIsMobileSidebarOpen(true)}
            showMenuButton={isMobile}
            userProgress={userProgress}
          />

          {actionError && (
            <div className="px-6 pt-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {actionError}
              </div>
            </div>
          )}

          {view === "board" && (
            <>
              {activeSprint ? (
                <main className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#16181d]' : 'bg-gray-50'}`}>
                  <div className={`${currentTheme.bgSecondary} border-b ${currentTheme.border} px-8 py-4`}>
                    <div className="flex items-center justify-between max-w-[2000px] mx-auto">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center`}>
                          <Play className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className={`text-lg font-bold ${currentTheme.text}`}>{activeSprint.name}</h2>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`text-sm ${currentTheme.textMuted} flex items-center gap-1.5`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                            </span>
                            <span className={`text-sm ${currentTheme.textMuted} flex items-center gap-1.5`}>
                              <Target className="w-3.5 h-3.5" />
                              {activeSprintCards.todo.length + activeSprintCards.inProgress.length + activeSprintCards.inReview.length + activeSprintCards.done.length} tasks
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-[2000px] mx-auto px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <KanbanColumn id="todo" title="To Do" count={activeSprintCards.todo.length} cards={activeSprintCards.todo} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} availableAssignees={availableAssignees} labels={labels} />
                      <KanbanColumn id="inProgress" title="In Progress" count={activeSprintCards.inProgress.length} cards={activeSprintCards.inProgress} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} availableAssignees={availableAssignees} labels={labels} />
                      <KanbanColumn id="inReview" title="In Review" count={activeSprintCards.inReview.length} cards={activeSprintCards.inReview} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} availableAssignees={availableAssignees} labels={labels} />
                      <KanbanColumn id="done" title="Done" count={activeSprintCards.done.length} cards={activeSprintCards.done} onCardDrop={handleCardDrop} onAssigneeChange={handleAssigneeChange} onDelete={handleDeleteRequest} onEdit={handleEditTask} availableAssignees={availableAssignees} labels={labels} />
                    </div>
                  </div>
                </main>
              ) : (
                <div className={`flex-1 flex items-center justify-center ${currentTheme.bgSecondary}`}>
                  <div className="text-center max-w-md px-6">
                    <div className={`w-20 h-20 rounded-2xl ${currentTheme.primarySoftStrong} flex items-center justify-center mx-auto mb-6`}>
                      <Play className={`w-10 h-10 ${currentTheme.primaryText}`} />
                    </div>
                    <h2 className={`text-2xl font-bold ${currentTheme.text} mb-3`}>No Active Sprint</h2>
                    <p className={`text-base ${currentTheme.textMuted} mb-8`}>
                      Start a sprint from the Backlog to begin working on tasks in the kanban board
                    </p>
                    <button
                      onClick={() => setView('backlog')}
                      className={`px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all`}
                    >
                      Go to Backlog
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {view === "list" && (
            <>
              {activeSprint ? (
                <ListView
                  cards={[...activeSprintCards.todo, ...activeSprintCards.inProgress, ...activeSprintCards.inReview, ...activeSprintCards.done]}
                  onAssigneeChange={handleAssigneeChange}
                  onDelete={handleDeleteRequest}
                  onEdit={handleEditTask}
                  availableAssignees={availableAssignees}
                  labels={labels}
                />
              ) : (
                <div className={`flex-1 flex items-center justify-center ${currentTheme.bgSecondary}`}>
                  <div className="text-center max-w-md px-6">
                    <div className={`w-20 h-20 rounded-2xl ${currentTheme.primarySoftStrong} flex items-center justify-center mx-auto mb-6`}>
                      <Play className={`w-10 h-10 ${currentTheme.primaryText}`} />
                    </div>
                    <h2 className={`text-2xl font-bold ${currentTheme.text} mb-3`}>No Active Sprint</h2>
                    <p className={`text-base ${currentTheme.textMuted} mb-8`}>
                      List view shows active sprint tasks in table format. Start a sprint from Backlog first.
                    </p>
                    <button
                      onClick={() => setView('backlog')}
                      className={`px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all`}
                    >
                      Go to Backlog
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {view === "backlog" && (
            <BacklogView2
              backlogCards={backlogCards}
              sprintCards={plannedSprintCards}
              activeSprint={activeSprint}
              plannedSprint={plannedSprint}
              onAssigneeChange={handleAssigneeChange}
              onDelete={handleDeleteRequest}
              onEdit={handleEditTask}
              onAddToSprint={handleAddToSprint}
              onRemoveFromSprint={handleRemoveFromSprint}
              availableAssignees={availableAssignees}
              labels={labels}
              onCreateSprint={() => setIsSprintPlanningOpen(true)}
              onStartSprint={() => void handleStartSprint()}
              onCompleteSprint={() => void handleCompleteSprint()}
              onCreateTask={() => setIsModalOpen(true)}
            />
          )}

          {view === "history" && (
            <HistoryView
              cards={filteredAllCards}
              onAssigneeChange={handleAssigneeChange}
              onDelete={handleDeleteRequest}
              onEdit={handleEditTask}
              availableAssignees={availableAssignees}
              labels={labels}
            />
          )}
        </div>

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

        <SprintPlanningModal
          key={`${plannedSprint?.id ?? "new"}-${isSprintPlanningOpen ? "open" : "closed"}`}
          isOpen={isSprintPlanningOpen}
          onClose={() => setIsSprintPlanningOpen(false)}
          onCreateSprint={handleCreateSprint}
          onStartSprint={async () => handleStartSprint()}
          existingSprint={plannedSprint}
        />
      </div>
    </DndProvider>
  );
}
