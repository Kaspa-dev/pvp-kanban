import { User, Inbox, Calendar, Tag, Plus, LayoutGrid, List } from "lucide-react";

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCreateTask: () => void;
}

export function Sidebar({ activeFilter, onFilterChange, onCreateTask }: SidebarProps) {
  const filters = [
    { id: "all", label: "All", icon: Inbox },
    { id: "assigned", label: "Assigned to me", icon: User },
    { id: "due", label: "Due this week", icon: Calendar },
  ];

  const labels = [
    { name: "UI", color: "bg-purple-500" },
    { name: "Design", color: "bg-pink-500" },
    { name: "BE", color: "bg-green-500" },
    { name: "FE", color: "bg-cyan-500" },
    { name: "DevOps", color: "bg-yellow-500" },
    { name: "Docs", color: "bg-blue-500" },
    { name: "Security", color: "bg-orange-500" },
    { name: "DB", color: "bg-indigo-500" },
  ];

  return (
    <aside className="w-72 bg-white border-r-2 border-purple-100 flex flex-col">
      {/* Profile Section */}
      <div className="p-6 border-b-2 border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-purple-200">
            U
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 truncate">User Name</h3>
            <p className="text-sm text-gray-500 truncate">user@example.com</p>
          </div>
        </div>
        
        <button
          onClick={onCreateTask}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Quick Filters */}
      <div className="p-6 border-b-2 border-purple-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Quick Filters
        </h4>
        <nav className="space-y-1">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-purple-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Labels */}
      <div className="p-6 flex-1 overflow-auto">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Labels
        </h4>
        <div className="space-y-2">
          {labels.map((label) => (
            <button
              key={label.name}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors text-left"
            >
              <div className={`w-3 h-3 rounded-full ${label.color}`} />
              <span className="text-sm font-medium text-gray-700">{label.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}