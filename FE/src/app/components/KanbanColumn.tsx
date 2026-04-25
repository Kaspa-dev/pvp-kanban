import { KanbanCard } from "./KanbanCard";
import { useDrop } from "react-dnd";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { Card, Priority, TaskAssignee, TaskType } from "../utils/cards";
import { CustomScrollArea } from "./CustomScrollArea";

type ColumnCard = Card & {
  priority?: Priority;
  taskType?: TaskType;
};

interface KanbanColumnProps {
  boardId: number;
  id: string;
  title: string;
  count: number;
  cards: ColumnCard[];
  onCardDrop: (cardId: number, fromColumnId: string, toColumnId: string) => void;
  onAssigneeChange: (cardId: number, assignee: TaskAssignee | null) => void;
  onDelete: (cardId: number, title: string) => void;
  onEdit?: (cardId: number) => void;
  onMoveToBacklog?: (cardId: number) => void;
  availableAssignees: TaskAssignee[];
  labels: Label[];
}

export function KanbanColumn({ 
  boardId,
  id, 
  title, 
  count, 
  cards, 
  onCardDrop,
  onAssigneeChange,
  onDelete,
  onEdit,
  onMoveToBacklog,
  availableAssignees,
  labels
}: KanbanColumnProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const columnSurfaceClassName = isDarkMode ? "bg-zinc-950/52" : "bg-slate-50/88";
  const columnHeaderSurfaceClassName = isDarkMode ? "bg-zinc-900/46" : "bg-white/78";

  const [{ isOver }, drop] = useDrop({
    accept: "CARD",
    drop: (item: { id: number; columnId: string }) => {
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
    <div className="w-full min-h-0 lg:h-full">
      <div
        ref={drop}
        className={`${columnSurfaceClassName} rounded-2xl border-2 transition-all flex min-h-[34rem] flex-col shadow-sm lg:h-full lg:min-h-0 ${
          isOver ? `${currentTheme.primaryBorder} ring-4 ${currentTheme.ring} scale-[1.01]` : currentTheme.border
        }`}
      >
        {/* Column Header */}
        <div className={`px-5 py-4 border-b-2 ${currentTheme.border} ${columnHeaderSurfaceClassName} rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-lg ${currentTheme.text}`}>{title}</h2>
            <span className={`px-3 py-1.5 ${badgeColor} text-white rounded-full text-sm font-bold shadow-sm`}>
              {count}
            </span>
          </div>
        </div>
        
        {/* Cards Container */}
        <CustomScrollArea
          className="flex-1 min-h-0"
          viewportClassName="h-full min-h-0 px-4 py-4"
        >
          {cards.length > 0 ? (
            <div className="space-y-3">
              {cards.map((card) => (
                <KanbanCard
                  key={card.id}
                  boardId={boardId}
                  id={card.id}
                  title={card.title}
                  labelIds={card.labelIds}
                  assignee={card.assignee}
                  columnId={id}
                  onAssigneeChange={onAssigneeChange}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onMoveToBacklog={onMoveToBacklog}
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
            <div className={`flex min-h-[14rem] flex-col items-center justify-center text-center ${currentTheme.textMuted}`}>
              <p className="mb-1 text-sm">No tasks</p>
              <p className="text-xs opacity-60">Drag & drop tasks here</p>
            </div>
          )}
        </CustomScrollArea>
      </div>
    </div>
  );
}
