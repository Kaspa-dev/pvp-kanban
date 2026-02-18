import { KanbanCard } from "./KanbanCard";
import { useDrop } from "react-dnd";

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

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  cards: Card[];
  onCardDrop: (cardId: string, fromColumnId: string, toColumnId: string) => void;
}

export function KanbanColumn({ id, title, count, cards, onCardDrop }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: "CARD",
    drop: (item: { id: string; columnId: string }) => {
      if (item.columnId !== id) {
        onCardDrop(item.id, item.columnId, id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div className="flex-1 min-w-0">
      <div
        ref={drop}
        className={`bg-gray-50 rounded-lg p-4 transition-colors ${
          isOver ? "ring-2 ring-blue-500 bg-blue-50" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">{title}</h2>
          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
            {count}
          </span>
        </div>
        
        {cards.length > 0 ? (
          <div className="space-y-3">
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                id={card.id}
                title={card.title}
                tags={card.tags}
                assignee={card.assignee}
                dueDate={card.dueDate}
                columnId={id}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}