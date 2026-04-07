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
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { endOfWeek, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { boardRealtimeClient } from "../realtime/boardRealtime";
import { 
  UserProgress, 
  loadUserProgress, 
  saveUserProgress, 
  getDefaultUserProgress,
  calculateLevel,
  getXPForStoryPoints
} from "../utils/gamification";
import { ensureSharedDemoBoard, getBoard, Board as BoardType, SHARED_DEMO_BOARD_ID } from "../utils/boards";
import { Card, Cards, getBoardCards, saveBoardCards, createDefaultCards, Priority, TaskType } from "../utils/cards";
import { 
  Label, 
  getBoardLabels, 
  createLabel, 
  updateLabel, 
  deleteLabel,
  createDefaultLabels 
} from "../utils/labels";
import {
  Sprint,
  getActiveSprint,
  getPlannedSprint,
  startSprint as startSprintUtil,
} from "../utils/sprints";
import { Play, Calendar, Target } from "lucide-react";

const BOARD_COLUMN_IDS = ["todo", "inProgress", "inReview", "done", "backlog"] as const;

function isBoardColumnId(value: string): value is keyof Cards {
  return BOARD_COLUMN_IDS.includes(value as keyof Cards);
}

function moveCardBetweenColumns(
  prevCards: Cards,
  cardId: string,
  fromColumnId: keyof Cards,
  toColumnId: keyof Cards
): Cards {
  if (fromColumnId === toColumnId) {
    return prevCards;
  }

  const nextCards: Cards = {
    todo: [...prevCards.todo],
    inProgress: [...prevCards.inProgress],
    inReview: [...prevCards.inReview],
    done: [...prevCards.done],
    backlog: [...prevCards.backlog],
  };

  let sourceColumn = fromColumnId;
  let cardIndex = nextCards[sourceColumn].findIndex((card) => card.id === cardId);

  if (cardIndex === -1) {
    const fallbackColumn = BOARD_COLUMN_IDS.find((columnId) =>
      nextCards[columnId].some((card) => card.id === cardId)
    );

    if (!fallbackColumn) {
      return prevCards;
    }

    sourceColumn = fallbackColumn;
    cardIndex = nextCards[sourceColumn].findIndex((card) => card.id === cardId);
  }

  if (cardIndex === -1) {
    return prevCards;
  }

  if (nextCards[toColumnId].some((card) => card.id === cardId)) {
    return prevCards;
  }

  const [movedCard] = nextCards[sourceColumn].splice(cardIndex, 1);
  if (!movedCard) {
    return prevCards;
  }

  nextCards[toColumnId] = [
    {
      ...movedCard,
      status: toColumnId,
    },
    ...nextCards[toColumnId],
  ];

  return nextCards;
}

export function Board() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const { boardId } = useParams<{ boardId: string }>();
  const isMobile = useIsMobile();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSprintPlanningOpen, setIsSprintPlanningOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Card | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; cardId: string; title: string }>({
    isOpen: false,
    cardId: "",
    title: "",
  });
  
  // View and filter states
  const [activeFilter, setActiveFilter] = useState("all");
  const [view, setView] = useState<"board" | "list" | "backlog" | "history">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  
  // Data states
  const [labels, setLabels] = useState<Label[]>([]);
  const [cards, setCards] = useState<Cards>({
    todo: [],
    inProgress: [],
    inReview: [],
    done: [],
    backlog: [],
  });
  const [currentBoard, setCurrentBoard] = useState<BoardType | null>(null);
  
  // Sprint states
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [plannedSprint, setPlannedSprint] = useState<Sprint | null>(null);
  
  // User progress state
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const progress = loadUserProgress() || getDefaultUserProgress();
    if (user) {
      progress.username = user.name;
      progress.email = user.email;
    }
    return progress;
  });

  // Load board, labels, cards, and sprints on mount
  useEffect(() => {
    if (boardId && user) {
      let board = getBoard(user.id, boardId);

      if (!board && boardId === SHARED_DEMO_BOARD_ID) {
        board = ensureSharedDemoBoard(user.id, user.name);
      }

      if (board) {
        setCurrentBoard(board);
        
        // Load sprints
        setActiveSprint(getActiveSprint(boardId));
        setPlannedSprint(getPlannedSprint(boardId));
        
        // Get or create labels
        let boardLabels = getBoardLabels(boardId);
        if (boardLabels.length === 0) {
          boardLabels = createDefaultLabels(boardId);
          setLabels(boardLabels);
          
          const labelMap: { [key: string]: string } = {};
          boardLabels.forEach(label => {
            labelMap[label.name] = label.id;
          });
          
          const defaultCards = createDefaultCards(user.name, labelMap);
          setCards(defaultCards);
        } else {
          setLabels(boardLabels);
          setCards(getBoardCards(boardId));
        }
      } else {
        navigate('/app');
      }
    }
  }, [boardId, user, navigate]);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    if (boardId && cards) {
      saveBoardCards(boardId, cards);
    }
  }, [cards, boardId]);

  // Sync user progress with actual task data
  useEffect(() => {
    const allTasksList = [
      ...cards.todo,
      ...cards.inProgress,
      ...cards.inReview,
      ...cards.done,
      ...cards.backlog,
    ];
    
    const userCompletedTasks = allTasksList.filter(
      (card) => card.status === "done" && card.assignee?.name === userProgress.username
    );
    
    const calculatedXP = userCompletedTasks.reduce(
      (sum, card) => sum + (card.storyPoints ? getXPForStoryPoints(card.storyPoints) : 0),
      0
    );
    
    const calculatedLevel = calculateLevel(calculatedXP);
    const calculatedTasksCompleted = userCompletedTasks.length;
    
    if (
      userProgress.xp !== calculatedXP ||
      userProgress.level !== calculatedLevel ||
      userProgress.tasksCompleted !== calculatedTasksCompleted
    ) {
      setUserProgress((prev) => ({
        ...prev,
        xp: calculatedXP,
        level: calculatedLevel,
        tasksCompleted: calculatedTasksCompleted,
      }));
    }
  }, [cards, userProgress.username]);

  // Save user progress to localStorage
  useEffect(() => {
    saveUserProgress(userProgress);
  }, [userProgress]);

  useEffect(() => {
    if (!boardId) {
      return;
    }

    const unsubscribe = boardRealtimeClient.subscribe((move) => {
      if (
        move.boardId !== boardId ||
        !isBoardColumnId(move.fromStatus) ||
        !isBoardColumnId(move.toStatus)
      ) {
        return;
      }

      setCards((prevCards) => moveCardBetweenColumns(prevCards, move.cardId, move.fromStatus, move.toStatus));
    });

    void boardRealtimeClient.joinBoard(boardId);

    return () => {
      unsubscribe();
      void boardRealtimeClient.leaveBoard(boardId);
    };
  }, [boardId]);

  const availableAssignees = [
    { name: user?.name || "Anna", color: "#3b82f6" },
    { name: "Jonas", color: "#10b981" },
    { name: "Marius", color: "#8b5cf6" },
    { name: "Laura", color: "#f59e0b" },
    { name: "Petras", color: "#06b6d4" },
    { name: "Ieva", color: "#ec4899" },
  ];

  // Get all cards as flat list
  const allCards = useMemo(() => {
    return [
      ...cards.todo,
      ...cards.inProgress,
      ...cards.inReview,
      ...cards.done,
      ...cards.backlog,
    ];
  }, [cards]);

  const matchesCardFilters = (card: Card) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        card.title.toLowerCase().includes(query) ||
        (card.labelIds || []).some((labelId) => {
          const label = labels.find((item) => item.id === labelId);
          return label?.name.toLowerCase().includes(query);
        });

      if (!matchesSearch) {
        return false;
      }
    }

    if (selectedLabelIds.length > 0) {
      const matchesLabels = (card.labelIds || []).some((labelId) => selectedLabelIds.includes(labelId));
      if (!matchesLabels) {
        return false;
      }
    }

    if (activeFilter === "assigned" && card.assignee?.name !== userProgress.username) {
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
  };

  const filteredAllCards = useMemo(() => {
    return allCards.filter(matchesCardFilters);
  }, [allCards, searchQuery, selectedLabelIds, activeFilter, userProgress.username, labels]);

  const backlogCards = useMemo(() => {
    return filteredAllCards.filter(card => !card.sprintId);
  }, [filteredAllCards]);

  const plannedSprintCards = useMemo(() => {
    if (!plannedSprint) return [];
    return filteredAllCards.filter(card => card.sprintId === plannedSprint.id);
  }, [filteredAllCards, plannedSprint]);

  const activeSprintCards = useMemo(() => {
    if (!activeSprint) {
      return { todo: [], inProgress: [], inReview: [], done: [] };
    }

    const sprintCards = filteredAllCards.filter(card => card.sprintId === activeSprint.id);

    return {
      todo: sprintCards.filter((c) => c.status === "todo"),
      inProgress: sprintCards.filter((c) => c.status === "inProgress"),
      inReview: sprintCards.filter((c) => c.status === "inReview"),
      done: sprintCards.filter((c) => c.status === "done"),
    };
  }, [filteredAllCards, activeSprint]);

  // Card drag and drop handler
  const handleCardDrop = (cardId: string, fromColumnId: string, toColumnId: string) => {
    if (!isBoardColumnId(fromColumnId) || !isBoardColumnId(toColumnId)) {
      return;
    }

    setCards((prevCards) => moveCardBetweenColumns(prevCards, cardId, fromColumnId, toColumnId));

    if (!boardId || fromColumnId === toColumnId) {
      return;
    }

    void boardRealtimeClient.sendMove({
      boardId,
      cardId,
      fromStatus: fromColumnId,
      toStatus: toColumnId,
      movedBy: user?.name || userProgress.username,
      movedAt: new Date().toISOString(),
    });
  };

  // Add new card
  const handleAddCard = (newCard: {
    title: string;
    description: string;
    status: "todo" | "inProgress" | "inReview" | "done" | "backlog";
    labelIds: string[];
    assignee: { name: string; color: string };
    storyPoints?: number;
    priority?: Priority;
    taskType?: TaskType;
    dueDate?: string | null;
  }) => {
    const card: Card = {
      id: Date.now().toString(),
      title: newCard.title,
      description: newCard.description,
      labelIds: newCard.labelIds,
      assignee: newCard.assignee,
      status: newCard.status,
      storyPoints: newCard.storyPoints,
      priority: newCard.priority,
      taskType: newCard.taskType,
      dueDate: newCard.dueDate || null,
      sprintId: null, // New tasks go to backlog by default
    };

    setCards((prevCards) => ({
      ...prevCards,
      [newCard.status]: [card, ...prevCards[newCard.status]],
    }));

    if (newCard.status === "done" && newCard.storyPoints && newCard.assignee?.name === userProgress.username) {
      const xpEarned = getXPForStoryPoints(newCard.storyPoints);
      const newXP = userProgress.xp + xpEarned;
      const newLevel = calculateLevel(newXP);
      
      setUserProgress((prev) => ({
        ...prev,
        xp: newXP,
        level: newLevel,
        tasksCompleted: prev.tasksCompleted + 1,
      }));
    }
  };

  // Change card assignee
  const handleAssigneeChange = (cardId: string, newAssignee: { name: string; color: string } | null) => {
    setCards((prevCards) => {
      const newCards = { ...prevCards };
      
      for (const column of Object.keys(newCards) as (keyof Cards)[]) {
        const cardIndex = newCards[column].findIndex((card) => card.id === cardId);
        if (cardIndex !== -1) {
          newCards[column][cardIndex] = {
            ...newCards[column][cardIndex],
            assignee: newAssignee || { name: "Unassigned", color: "#9ca3af" },
          };
          break;
        }
      }
      
      return newCards;
    });
  };

  // Delete card handlers
  const handleDeleteRequest = (cardId: string, title: string) => {
    setDeleteDialog({ isOpen: true, cardId, title });
  };

  const handleDeleteConfirm = () => {
    const { cardId } = deleteDialog;
    
    setCards((prevCards) => {
      const newCards = { ...prevCards };
      
      for (const column of Object.keys(newCards) as (keyof Cards)[]) {
        newCards[column] = newCards[column].filter((card) => card.id !== cardId);
      }
      
      return newCards;
    });

    setDeleteDialog({ isOpen: false, cardId: "", title: "" });
  };

  // Edit task handlers
  const handleEditTask = (cardId: string) => {
    for (const column of Object.keys(cards) as (keyof Cards)[]) {
      const card = cards[column].find((c) => c.id === cardId);
      if (card) {
        setEditingTask(card);
        return;
      }
    }
  };

  const handleSaveEdit = (cardId: string, updates: {
    title: string;
    description: string;
    status: "todo" | "inProgress" | "inReview" | "done" | "backlog";
    labelIds: string[];
    assignee: { name: string; color: string } | null;
    storyPoints?: number;
    priority?: Priority;
    taskType?: TaskType;
    dueDate?: string | null;
  }) => {
    setCards((prevCards) => {
      const newCards = { ...prevCards };
      
      for (const column of Object.keys(newCards) as (keyof Cards)[]) {
        const cardIndex = newCards[column].findIndex((card) => card.id === cardId);
        if (cardIndex !== -1) {
          const oldStatus = newCards[column][cardIndex].status;
          const newStatus = updates.status;
          
          const updatedCard: Card = {
            ...newCards[column][cardIndex],
            ...updates,
            assignee: updates.assignee || { name: "Unassigned", color: "#9ca3af" },
          };
          
          if (oldStatus !== newStatus) {
            newCards[column].splice(cardIndex, 1);
            newCards[newStatus] = [updatedCard, ...newCards[newStatus]];
            
            // Handle XP changes
            if (oldStatus === "done" && newStatus !== "done" && updatedCard.storyPoints && updatedCard.assignee?.name === userProgress.username) {
              const xpLost = getXPForStoryPoints(updatedCard.storyPoints);
              const newXP = Math.max(0, userProgress.xp - xpLost);
              const newLevel = calculateLevel(newXP);
              
              setUserProgress((prev) => ({
                ...prev,
                xp: newXP,
                level: newLevel,
                tasksCompleted: Math.max(0, prev.tasksCompleted - 1),
              }));
            } else if (newStatus === "done" && oldStatus !== "done" && updatedCard.storyPoints && updatedCard.assignee?.name === userProgress.username) {
              const xpEarned = getXPForStoryPoints(updatedCard.storyPoints);
              const newXP = userProgress.xp + xpEarned;
              const newLevel = calculateLevel(newXP);
              
              setUserProgress((prev) => ({
                ...prev,
                xp: newXP,
                level: newLevel,
                tasksCompleted: prev.tasksCompleted + 1,
              }));
            }
          } else {
            newCards[column][cardIndex] = updatedCard;
          }
          
          break;
        }
      }
      
      return newCards;
    });
  };

  // Sprint management handlers
  const handleAddToSprint = (cardId: string) => {
    if (!plannedSprint) return;
    
    setCards(prevCards => {
      const newCards = { ...prevCards };
      
      for (const column of Object.keys(newCards) as (keyof Cards)[]) {
        const cardIndex = newCards[column].findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          newCards[column][cardIndex] = {
            ...newCards[column][cardIndex],
            sprintId: plannedSprint.id
          };
          break;
        }
      }
      
      return newCards;
    });
  };

  const handleRemoveFromSprint = (cardId: string) => {
    setCards(prevCards => {
      const newCards = { ...prevCards };
      
      for (const column of Object.keys(newCards) as (keyof Cards)[]) {
        const cardIndex = newCards[column].findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          newCards[column][cardIndex] = {
            ...newCards[column][cardIndex],
            sprintId: null
          };
          break;
        }
      }
      
      return newCards;
    });
  };

  const handleCreateSprint = (sprint: Sprint) => {
    setPlannedSprint(sprint);
    setIsSprintPlanningOpen(false);
  };

  const handleStartSprint = () => {
    if (!plannedSprint) return;
    
    // Start the sprint
    startSprintUtil(plannedSprint.id);
    
    // Update task statuses - move all planned sprint tasks to 'todo' if they're in backlog
    setCards(prevCards => {
      const newCards = { ...prevCards };
      const updatedBacklog: Card[] = [];
      const updatedTodo: Card[] = [...newCards.todo];
      
      // Move tasks from backlog to todo if they're part of the sprint
      newCards.backlog.forEach(card => {
        if (card.sprintId === plannedSprint.id) {
          updatedTodo.push({ ...card, status: 'todo' });
        } else {
          updatedBacklog.push(card);
        }
      });
      
      return {
        ...newCards,
        backlog: updatedBacklog,
        todo: updatedTodo,
      };
    });
    
    // Update sprint states
    setActiveSprint(plannedSprint);
    setPlannedSprint(null);
    
    // Navigate to board view
    setView('board');
  };

  // Profile update handler
  const handleUpdateProfile = (updates: Partial<UserProgress>) => {
    setUserProgress((prev) => ({
      ...prev,
      ...updates,
    }));
    
    if (updates.username && user) {
      updateUser({ ...user, name: updates.username });
    }
  };

  // Label management handlers
  const handleCreateLabel = (name: string, color: string) => {
    if (!boardId) return;
    const newLabel = createLabel(boardId, name, color);
    setLabels([...labels, newLabel]);
  };

  const handleUpdateLabel = (labelId: string, name: string, color: string) => {
    if (!boardId) return;
    const success = updateLabel(boardId, labelId, { name, color });
    if (success) {
      setLabels(labels.map(l => l.id === labelId ? { ...l, name, color } : l));
    }
  };

  const handleDeleteLabel = (labelId: string) => {
    if (!boardId) return;
    const success = deleteLabel(boardId, labelId);
    if (success) {
      setLabels(labels.filter(l => l.id !== labelId));
      
      setCards((prevCards) => {
        const newCards = { ...prevCards };
        for (const column of Object.keys(newCards) as (keyof Cards)[]) {
          newCards[column] = newCards[column].map(card => ({
            ...card,
            labelIds: card.labelIds?.filter(id => id !== labelId) || []
          }));
        }
        return newCards;
      });
      
      setSelectedLabelIds(selectedLabelIds.filter(id => id !== labelId));
    }
  };

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
            onProfileClick={() => setIsProfileOpen(true)}
            onLogout={() => {
              logout();
              navigate('/login');
            }}
            onBack={() => navigate('/app')}
            boardName={currentBoard?.name}
            userProgress={userProgress}
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
                onProfileClick={() => {
                  setIsMobileSidebarOpen(false);
                  setIsProfileOpen(true);
                }}
                onLogout={() => {
                  setIsMobileSidebarOpen(false);
                  logout();
                  navigate('/login');
                }}
                onBack={() => {
                  setIsMobileSidebarOpen(false);
                  navigate('/app');
                }}
                boardName={currentBoard?.name}
                userProgress={userProgress}
                labels={labels}
                className="w-full min-h-full border-r-0"
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Toolbar */}
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

          {/* Content Area - Board View */}
          {view === "board" && (
            <>
              {activeSprint ? (
                <main className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#16181d]' : 'bg-gray-50'}`}>
                  {/* Sprint Info Header */}
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

                  {/* Kanban Board */}
                  <div className="w-full max-w-[2000px] mx-auto px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <KanbanColumn
                        id="todo"
                        title="To Do"
                        count={activeSprintCards.todo.length}
                        cards={activeSprintCards.todo}
                        onCardDrop={handleCardDrop}
                        onAssigneeChange={handleAssigneeChange}
                        onDelete={handleDeleteRequest}
                        onEdit={handleEditTask}
                        availableAssignees={availableAssignees}
                        labels={labels}
                      />
                      <KanbanColumn
                        id="inProgress"
                        title="In Progress"
                        count={activeSprintCards.inProgress.length}
                        cards={activeSprintCards.inProgress}
                        onCardDrop={handleCardDrop}
                        onAssigneeChange={handleAssigneeChange}
                        onDelete={handleDeleteRequest}
                        onEdit={handleEditTask}
                        availableAssignees={availableAssignees}
                        labels={labels}
                      />
                      <KanbanColumn
                        id="inReview"
                        title="In Review"
                        count={activeSprintCards.inReview.length}
                        cards={activeSprintCards.inReview}
                        onCardDrop={handleCardDrop}
                        onAssigneeChange={handleAssigneeChange}
                        onDelete={handleDeleteRequest}
                        onEdit={handleEditTask}
                        availableAssignees={availableAssignees}
                        labels={labels}
                      />
                      <KanbanColumn
                        id="done"
                        title="Done"
                        count={activeSprintCards.done.length}
                        cards={activeSprintCards.done}
                        onCardDrop={handleCardDrop}
                        onAssigneeChange={handleAssigneeChange}
                        onDelete={handleDeleteRequest}
                        onEdit={handleEditTask}
                        availableAssignees={availableAssignees}
                        labels={labels}
                      />
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

          {/* List View */}
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

          {/* Backlog View */}
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
              onStartSprint={handleStartSprint}
              onCreateTask={() => setIsModalOpen(true)}
            />
          )}

          {/* History View */}
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

        {/* Modals */}
        <AddCardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddCard}
          availableLabels={labels}
          onCreateLabel={handleCreateLabel}
          availableAssignees={availableAssignees}
        />

        <EditTaskModal
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
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userProgress={userProgress}
          onUpdateProfile={handleUpdateProfile}
          tasksCompleted={
            allCards.filter(
              (card) => card.status === "done" && card.assignee?.name === userProgress.username
            ).length || 0
          }
          userTotalXP={
            allCards
              .filter(
                (card) => card.status === "done" && card.assignee?.name === userProgress.username
              )
              .reduce((sum, card) => sum + (card.storyPoints ? getXPForStoryPoints(card.storyPoints) : 0), 0) || 0
          }
        />

        <ConfirmDeleteDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, cardId: "", title: "" })}
          onConfirm={handleDeleteConfirm}
          taskTitle={deleteDialog.title}
        />

        <SprintPlanningModal
          isOpen={isSprintPlanningOpen}
          onClose={() => setIsSprintPlanningOpen(false)}
          boardId={boardId || ''}
          onSprintCreated={handleCreateSprint}
          onSprintStarted={(sprint) => {
            setActiveSprint(sprint);
            setPlannedSprint(null);
            setView('board');
          }}
          existingSprint={plannedSprint}
        />
      </div>
    </DndProvider>
  );
}
