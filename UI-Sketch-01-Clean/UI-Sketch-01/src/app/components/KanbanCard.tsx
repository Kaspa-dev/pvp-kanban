import { Calendar, GripVertical } from "lucide-react";
import { useDrag } from "react-dnd";

interface KanbanCardProps {
  id: string;
  title: string;
  tags: string[];
  assignee: {
    name: string;
    color: string;
  };
  dueDate: string;
  columnId: string;
}

export function KanbanCard({ id, title, tags, assignee, dueDate, columnId }: KanbanCardProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "CARD",
    item: { id, columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={preview}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-2 p-4">
        {/* Drag handle */}
        <div
          ref={drag}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 pt-1"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Card content */}
        <div className="flex-1 min-w-0">
          <h3 className="mb-3 line-clamp-1">{title}</h3>
          
          <div className="flex gap-2 mb-3 flex-wrap">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: assignee.color }}
              title={assignee.name}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{dueDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}