import { KanbanColumn } from "./components/KanbanColumn";
import { AddCardModal } from "./components/AddCardModal";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState } from "react";

interface Card {
  id: string;
  title: string;
  tags: string[];
  assignee: {
    name: string;
    color: string;
  };
  dueDate: string;
}

interface Cards {
  todo: Card[];
  inProgress: Card[];
  done: Card[];
}

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [cards, setCards] = useState<Cards>({
    todo: [
      {
        id: "1",
        title: "Design new landing page",
        tags: ["UI", "Design"],
        assignee: { name: "Anna", color: "#3b82f6" },
        dueDate: "Feb 15",
      },
      {
        id: "2",
        title: "Update user documentation",
        tags: ["Docs"],
        assignee: { name: "Jonas", color: "#10b981" },
        dueDate: "Feb 18",
      },
    ],
    inProgress: [
      {
        id: "3",
        title: "Implement authentication",
        tags: ["BE", "Security"],
        assignee: { name: "Marius", color: "#8b5cf6" },
        dueDate: "Feb 14",
      },
      {
        id: "4",
        title: "Create component library",
        tags: ["UI", "FE"],
        assignee: { name: "Laura", color: "#f59e0b" },
        dueDate: "Feb 16",
      },
    ],
    done: [
      {
        id: "5",
        title: "Setup project repository",
        tags: ["DevOps"],
        assignee: { name: "Petras", color: "#06b6d4" },
        dueDate: "Feb 10",
      },
      {
        id: "6",
        title: "Database schema design",
        tags: ["BE", "DB"],
        assignee: { name: "Ieva", color: "#ec4899" },
        dueDate: "Feb 12",
      },
    ],
  });

  const handleCardDrop = (cardId: string, fromColumnId: string, toColumnId: string) => {
    setCards((prevCards) => {
      const newCards = { ...prevCards };
      const fromColumn = fromColumnId as keyof Cards;
      const toColumn = toColumnId as keyof Cards;

      // Find and remove the card from the source column
      const cardIndex = newCards[fromColumn].findIndex((card) => card.id === cardId);
      if (cardIndex === -1) return prevCards;

      const [movedCard] = newCards[fromColumn].splice(cardIndex, 1);

      // Add the card to the target column at the beginning
      newCards[toColumn] = [movedCard, ...newCards[toColumn]];

      return newCards;
    });
  };

  const handleAddCard = (newCard: {
    title: string;
    description: string;
    status: "todo" | "inProgress" | "done";
    tags: string[];
    assignee: {
      name: string;
      color: string;
    };
    dueDate: string;
  }) => {
    const card: Card = {
      id: Date.now().toString(),
      title: newCard.title,
      tags: newCard.tags,
      assignee: newCard.assignee,
      dueDate: newCard.dueDate,
    };

    setCards((prevCards) => ({
      ...prevCards,
      [newCard.status]: [card, ...prevCards[newCard.status]],
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="size-full flex bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Left Sidebar */}
        <Sidebar 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          onCreateTask={() => setIsModalOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Toolbar */}
          <Toolbar view={view} onViewChange={setView} onNewCard={() => setIsModalOpen(true)} />

          {/* Kanban Board */}
          <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            <div className="flex gap-5 h-full">
              <KanbanColumn
                id="todo"
                title="To Do"
                count={cards.todo.length}
                cards={cards.todo}
                onCardDrop={handleCardDrop}
              />
              <KanbanColumn
                id="inProgress"
                title="In Progress"
                count={cards.inProgress.length}
                cards={cards.inProgress}
                onCardDrop={handleCardDrop}
              />
              <KanbanColumn
                id="done"
                title="Done"
                count={cards.done.length}
                cards={cards.done}
                onCardDrop={handleCardDrop}
              />
            </div>
          </main>
        </div>

        {/* Add Card Modal */}
        <AddCardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddCard}
        />
      </div>
    </DndProvider>
  );
}