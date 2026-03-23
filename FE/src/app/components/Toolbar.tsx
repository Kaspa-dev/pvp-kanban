import { Search, LayoutGrid, List, Settings, Archive, Clock, User } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";

interface ToolbarProps {
  view: "board" | "list" | "backlog" | "history";
  onViewChange: (view: "board" | "list" | "backlog" | "history") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onProfileClick?: () => void;
  userProgress?: {
    username: string;
    email: string;
    xp: number;
    level: number;
  };
}

export function Toolbar({ 
  view, 
  onViewChange, 
  searchQuery, 
  onSearchChange, 
  onOpenSettings,
  onProfileClick,
  userProgress
}: ToolbarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <header className={`${isDarkMode ? 'bg-[#1e1f26]' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* LEFT: Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 ${isDarkMode ? 'bg-[#242830] border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm`}
            />
          </div>

          {/* CENTER: Branded Segmented Control Navigation */}
          <div className={`inline-flex items-center gap-0.5 ${isDarkMode ? 'bg-purple-950/30' : 'bg-purple-50/60'} rounded-xl p-1.5 backdrop-blur-sm`}>
            <button
              onClick={() => onViewChange("board")}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                view === "board"
                  ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                  : `${isDarkMode ? 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/10' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-100/50'}`
              }`}
              title="Board View"
            >
              <LayoutGrid className={`w-4 h-4 ${view === "board" ? 'text-white' : ''}`} />
              <span className="hidden xl:inline">Board</span>
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                view === "list"
                  ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                  : `${isDarkMode ? 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/10' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-100/50'}`
              }`}
              title="List View"
            >
              <List className={`w-4 h-4 ${view === "list" ? 'text-white' : ''}`} />
              <span className="hidden xl:inline">List</span>
            </button>
            <button
              onClick={() => onViewChange("backlog")}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                view === "backlog"
                  ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                  : `${isDarkMode ? 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/10' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-100/50'}`
              }`}
              title="Backlog"
            >
              <Archive className={`w-4 h-4 ${view === "backlog" ? 'text-white' : ''}`} />
              <span className="hidden xl:inline">Backlog</span>
            </button>
            <button
              onClick={() => onViewChange("history")}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                view === "history"
                  ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                  : `${isDarkMode ? 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/10' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-100/50'}`
              }`}
              title="History"
            >
              <Clock className={`w-4 h-4 ${view === "history" ? 'text-white' : ''}`} />
              <span className="hidden xl:inline">History</span>
            </button>
          </div>

          {/* RIGHT: User Profile + Settings */}
          <div className="flex items-center gap-2 relative z-10">
            {/* User Profile */}
            {userProgress && onProfileClick && (
              <button
                onClick={onProfileClick}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                  isDarkMode 
                    ? 'border-transparent hover:border-purple-500/50 hover:shadow-sm hover:shadow-purple-500/10' 
                    : 'border-transparent hover:bg-gray-100'
                }`}
                title="View Profile"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center text-white text-sm font-bold shadow-sm pointer-events-none`}>
                  {userProgress.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col items-start min-w-0 pointer-events-none">
                  <span className={`text-sm font-semibold ${currentTheme.text} leading-tight truncate max-w-[120px]`}>
                    {userProgress.username}
                  </span>
                  <span className={`text-xs ${currentTheme.textMuted} leading-tight`}>
                    Level {userProgress.level}
                  </span>
                </div>
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className={`p-3 rounded-lg transition-all cursor-pointer relative z-20 border ${
                isDarkMode 
                  ? 'border-transparent hover:border-purple-500/50 text-gray-400 hover:text-gray-200 hover:shadow-sm hover:shadow-purple-500/10' 
                  : 'border-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/30`}
              title="Settings"
              type="button"
            >
              <Settings className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}