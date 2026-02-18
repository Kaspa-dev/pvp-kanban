import { Search, Plus } from "lucide-react";
import { KanbanColumn } from "./components/KanbanColumn";
import { AddCardModal } from "./components/AddCardModal";
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
  }) => {
    const card: Card = {
      id: Date.now().toString(),
      title: newCard.title,
      tags: ["New"],
      assignee: { name: "User", color: "#a855f7" },
      dueDate: "Feb 20",
    };

    setCards((prevCards) => ({
      ...prevCards,
      [newCard.status]: [card, ...prevCards[newCard.status]],
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="size-full flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Project name */}
            <h1 className="text-xl font-semibold">PKBS Board</h1>

            {/* Center: Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right: Button + Avatar */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New card
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                U
              </div>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <main className="flex-1 overflow-auto p-8">
          <div className="flex gap-6 h-full">
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