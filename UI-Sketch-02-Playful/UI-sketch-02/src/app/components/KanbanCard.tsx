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

const tagColors: { [key: string]: string } = {
  UI: "bg-purple-200 text-purple-800",
  Design: "bg-pink-200 text-pink-800",
  Docs: "bg-blue-200 text-blue-800",
  BE: "bg-green-200 text-green-800",
  Security: "bg-orange-200 text-orange-800",
  FE: "bg-cyan-200 text-cyan-800",
  DevOps: "bg-yellow-200 text-yellow-800",
  DB: "bg-indigo-200 text-indigo-800",
  New: "bg-emerald-200 text-emerald-800",
};

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
      className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-300 ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-3 p-5">
        {/* Drag handle */}
        <div
          ref={drag}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-purple-500 pt-1 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Card content */}
        <div className="flex-1 min-w-0">
          <h3 className="mb-3 font-semibold text-gray-800 line-clamp-2">{title}</h3>
          
          <div className="flex gap-2 mb-4 flex-wrap">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  tagColors[tag] || "bg-gray-200 text-gray-700"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-white"
              style={{ backgroundColor: assignee.color }}
              title={assignee.name}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span>{dueDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}