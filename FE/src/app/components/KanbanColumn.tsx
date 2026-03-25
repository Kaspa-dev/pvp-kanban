import { KanbanCard } from "./KanbanCard";
import { useDrop } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { Card, Priority, TaskType } from "../utils/cards";

type ColumnCard = Card & {
  priority?: Priority;
  taskType?: TaskType;
};

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  cards: ColumnCard[];
  onCardDrop: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  onAssigneeChange: (cardId: string, assignee: { name: string; color: string } | null) => void;
  onDelete: (cardId: string, title: string) => void;
  onEdit?: (cardId: string) => void;
  availableAssignees: { name: string; color: string }[];
  labels: Label[];
}

export function KanbanColumn({ 
  id, 
  title, 
  count, 
  cards, 
  onCardDrop,
  onAssigneeChange,
  onDelete,
  onEdit,
  availableAssignees,
  labels
}: KanbanColumnProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

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

  const badgeColor = currentTheme.badge[id as keyof typeof currentTheme.badge] || currentTheme.badge.todo;

  return (
    <div className="w-full">
      <div
        ref={drop}
        className={`${currentTheme.cardBg} rounded-2xl border-2 transition-all min-h-[600px] flex flex-col shadow-sm ${
          isOver ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring} scale-[1.01]` : currentTheme.border
        }`}
      >
        {/* Column Header */}
        <div className={`px-5 py-4 border-b-2 ${currentTheme.border} ${currentTheme.bgSecondary} rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-lg ${currentTheme.text}`}>{title}</h2>
            <span className={`px-3 py-1.5 ${badgeColor} text-white rounded-full text-sm font-bold shadow-sm`}>
              {count}
            </span>
          </div>
        </div>
        
        {/* Cards Container */}
        <div className="flex-1 overflow-y-auto p-4">
          {cards.length > 0 ? (
            <div className="space-y-3">
              {cards.map((card) => (
                <KanbanCard
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  labelIds={card.labelIds}
                  assignee={card.assignee}
                  columnId={id}
                  onAssigneeChange={onAssigneeChange}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  availableAssignees={availableAssignees}
                  labels={labels}
                  storyPoints={card.storyPoints}
                  dueDate={card.dueDate}
                  priority={card.priority}
                  taskType={card.taskType}
                />
              ))}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full ${currentTheme.textMuted}`}>
              <p className="text-sm mb-1">No tasks</p>
              <p className="text-xs opacity-60">Drag & drop tasks here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
