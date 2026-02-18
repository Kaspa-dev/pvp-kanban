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

const columnStyles: { [key: string]: { bg: string; badge: string; ring: string } } = {
  todo: {
    bg: "bg-gradient-to-b from-blue-50 to-cyan-50",
    badge: "bg-blue-500 text-white",
    ring: "ring-blue-400",
  },
  inProgress: {
    bg: "bg-gradient-to-b from-purple-50 to-pink-50",
    badge: "bg-purple-500 text-white",
    ring: "ring-purple-400",
  },
  done: {
    bg: "bg-gradient-to-b from-green-50 to-emerald-50",
    badge: "bg-green-500 text-white",
    ring: "ring-green-400",
  },
};

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

  const styles = columnStyles[id] || columnStyles.todo;

  return (
    <div className="flex-shrink-0 w-80">
      <div
        ref={drop}
        className={`${styles.bg} rounded-2xl p-4 transition-all border-2 border-transparent h-full flex flex-col ${
          isOver ? `ring-4 ${styles.ring} scale-[1.02]` : ""
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-gray-800">{title}</h2>
          <span className={`px-3 py-1.5 ${styles.badge} rounded-full text-sm font-bold shadow-md`}>
            {count}
          </span>
        </div>
        
        {cards.length > 0 ? (
          <div className="space-y-4 flex-1 overflow-y-auto">
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
          <div className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <p className="text-gray-400 font-medium text-sm">Drop here ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}