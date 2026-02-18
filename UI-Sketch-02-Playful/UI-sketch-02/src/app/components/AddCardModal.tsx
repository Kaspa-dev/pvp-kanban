import { X, Calendar as CalendarIcon, User } from "lucide-react";
import { useState, useEffect } from "react";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: {
    title: string;
    description: string;
    status: "todo" | "inProgress" | "done";
    tags: string[];
    assignee: {
      name: string;
      color: string;
    };
    dueDate: string;
  }) => void;
}

const availableLabels = [
  "UI",
  "Design",
  "BE",
  "FE",
  "DevOps",
  "Docs",
  "Security",
  "DB",
];

const availableAssignees = [
  { name: "Anna", color: "#3b82f6" },
  { name: "Jonas", color: "#10b981" },
  { name: "Marius", color: "#8b5cf6" },
  { name: "Laura", color: "#f59e0b" },
  { name: "Petras", color: "#06b6d4" },
  { name: "Ieva", color: "#ec4899" },
];

export function AddCardModal({ isOpen, onClose, onAdd }: AddCardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "inProgress" | "done">("todo");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState(availableAssignees[0]);
  const [dueDate, setDueDate] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setShowError(true);
      return;
    }

    onAdd({
      title,
      description,
      status,
      tags: selectedLabels.length > 0 ? selectedLabels : ["New"],
      assignee: selectedAssignee,
      dueDate: dueDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });

    // Reset form
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setSelectedLabels([]);
    setSelectedAssignee(availableAssignees[0]);
    setDueDate("");
    setShowError(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 mx-4 border-2 border-purple-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add new task ✨</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Task title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (showError && e.target.value.trim()) {
                  setShowError(false);
                }
              }}
              placeholder="Enter task title..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${
                showError ? "border-red-500" : "border-gray-200"
              }`}
              autoFocus
            />
            {showError && (
              <p className="text-red-500 text-sm mt-1">Title is required</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "todo" | "inProgress" | "done")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-medium"
            >
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((label) => {
                const isSelected = selectedLabels.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="assignee" className="block text-sm font-semibold text-gray-700 mb-2">
              Assignee
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                id="assignee"
                value={selectedAssignee.name}
                onChange={(e) => {
                  const assignee = availableAssignees.find((a) => a.name === e.target.value);
                  if (assignee) setSelectedAssignee(assignee);
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-medium appearance-none"
              >
                {availableAssignees.map((assignee) => (
                  <option key={assignee.name} value={assignee.name}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Due date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-medium"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 shadow-lg"
            >
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}