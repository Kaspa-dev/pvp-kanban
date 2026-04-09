import { Search, LayoutGrid, List, Settings, Archive, Clock, Menu, HelpCircle } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface ToolbarProps {
  view: "board" | "list" | "backlog" | "history";
  onViewChange: (view: "board" | "list" | "backlog" | "history") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onProfileClick?: () => void;
  onOpenMenu?: () => void;
  showMenuButton?: boolean;
  onReplayCurrentHints?: () => void;
  onReplayBoardHints?: () => void;
  onReplayBacklogHints?: () => void;
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
  onOpenMenu,
  showMenuButton = false,
  onReplayCurrentHints,
  onReplayBoardHints,
  onReplayBacklogHints,
  userProgress,
}: ToolbarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const viewButtons: Array<{ value: ToolbarProps["view"]; label: string; icon: typeof LayoutGrid }> = [
    { value: "board", label: "Board", icon: LayoutGrid },
    { value: "list", label: "List", icon: List },
    { value: "backlog", label: "Backlog", icon: Archive },
    { value: "history", label: "History", icon: Clock },
  ];

  const helpButtonClassName = `p-3 rounded-lg transition-all cursor-pointer relative z-20 border ${
    isDarkMode
      ? `border-transparent hover:${currentTheme.primaryBorder} text-gray-400 hover:text-gray-200 hover:shadow-sm`
      : "border-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900"
  } focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;

  return (
    <header className={`${isDarkMode ? "bg-[#1e1f26]" : "bg-white"} border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
      <div className="w-full px-4 md:px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 w-full md:max-w-md">
            {showMenuButton && onOpenMenu && (
              <button
                onClick={onOpenMenu}
                className={`md:hidden p-3 rounded-lg border ${currentTheme.border} ${currentTheme.textSecondary} hover:${currentTheme.bgSecondary} transition-all`}
                title="Open menu"
                type="button"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="relative flex-1" data-coachmark="toolbar-search">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 ${isDarkMode ? "bg-[#242830] border-gray-700 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"} border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm ${currentTheme.focus} ${currentTheme.primaryBorder}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:flex-1">
            <div
              className={`inline-flex items-center gap-1 ${currentTheme.primaryBg} rounded-xl p-1.5 overflow-x-auto`}
              data-coachmark="toolbar-view-switcher"
            >
              {viewButtons.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onViewChange(value)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    view === value
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                      : `${isDarkMode ? "text-gray-400" : "text-gray-600"} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg}`
                  }`}
                  title={`${label} View`}
                >
                  <Icon className={`w-4 h-4 ${view === value ? "text-white" : ""}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-end">
              {(view === "board" || view === "backlog") && onReplayCurrentHints && (
                <button
                  onClick={onReplayCurrentHints}
                  className={helpButtonClassName}
                  title="Replay hints"
                  type="button"
                >
                  <HelpCircle className="w-5 h-5 pointer-events-none" />
                </button>
              )}

              {(view === "list" || view === "history") && onReplayBoardHints && onReplayBacklogHints && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={helpButtonClassName}
                      title="Open hint options"
                      type="button"
                    >
                      <HelpCircle className="w-5 h-5 pointer-events-none" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3">
                    <p className={`text-sm font-semibold ${currentTheme.text}`}>Replay hints</p>
                    <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>
                      Jump to a guided hint flow for the board workspace.
                    </p>
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={onReplayBoardHints}
                        className={`w-full rounded-xl border ${currentTheme.border} px-3 py-2 text-left text-sm font-medium ${currentTheme.text} transition-all hover:${currentTheme.bgSecondary}`}
                      >
                        Replay Board Hints
                      </button>
                      <button
                        type="button"
                        onClick={onReplayBacklogHints}
                        className={`w-full rounded-xl border ${currentTheme.border} px-3 py-2 text-left text-sm font-medium ${currentTheme.text} transition-all hover:${currentTheme.bgSecondary}`}
                      >
                        Replay Backlog Hints
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {userProgress && onProfileClick && (
                <button
                  onClick={onProfileClick}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                    isDarkMode
                      ? `border-transparent hover:${currentTheme.primaryBorder} hover:shadow-sm`
                      : "border-transparent hover:bg-gray-100"
                  }`}
                  title="View profile"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center text-white text-sm font-bold shadow-sm pointer-events-none`}>
                    {userProgress.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start min-w-0 pointer-events-none">
                    <span className={`text-sm font-semibold ${currentTheme.text} leading-tight truncate max-w-[120px]`}>
                      {userProgress.username}
                    </span>
                    <span className={`text-xs ${currentTheme.textMuted} leading-tight`}>
                      Level {userProgress.level}
                    </span>
                  </div>
                </button>
              )}

              <button
                onClick={onOpenSettings}
                className={helpButtonClassName}
                title="Settings"
                type="button"
              >
                <Settings className="w-5 h-5 pointer-events-none" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
