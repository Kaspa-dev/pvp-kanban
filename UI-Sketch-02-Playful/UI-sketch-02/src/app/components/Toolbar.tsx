import { Search, LayoutGrid, List } from "lucide-react";

interface ToolbarProps {
  view: "board" | "list";
  onViewChange: (view: "board" | "list") => void;
  onNewCard: () => void;
}

export function Toolbar({ view, onViewChange, onNewCard }: ToolbarProps) {
  return (
    <header className="bg-white border-b-2 border-purple-100 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title & Search */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
            PKBS Board
          </h1>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all bg-white text-sm"
            />
          </div>
        </div>

        {/* Right: View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => onViewChange("board")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              view === "board"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Board</span>
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              view === "list"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </div>
      </div>
    </header>
  );
}
