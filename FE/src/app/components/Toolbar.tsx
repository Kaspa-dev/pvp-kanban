import { Search, LayoutGrid, List, Settings, Archive, Clock, Menu, HelpCircle } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { UserProfileChip } from "./UserProfileChip";

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
  showViewShortcuts?: boolean;
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
  showViewShortcuts = false,
  userProgress,
}: ToolbarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);

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
    <header
      className={workspaceSurface.glassHeaderClassName}
      style={workspaceSurface.glassHeaderStyle}
    >
      <div className="w-full px-4 md:px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 w-full md:max-w-md">
            {showMenuButton && onOpenMenu && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onOpenMenu}
                    className={`md:hidden p-3 rounded-lg border ${currentTheme.border} ${currentTheme.textSecondary} hover:${currentTheme.bgSecondary} transition-all`}
                    type="button"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>Open board menu</TooltipContent>
              </Tooltip>
            )}

            <div className="relative flex-1" data-coachmark="toolbar-search">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-all ${workspaceSurface.inputSurfaceClassName} ${currentTheme.text} placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primaryBorder}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:flex-1">
            <div className="flex items-center gap-3">
              {showViewShortcuts && (
                <div className={`hidden rounded-full border px-3 py-2 md:flex md:items-center md:gap-2 ${currentTheme.border} ${currentTheme.bg}`}>
                  <kbd className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${currentTheme.border} ${currentTheme.text}`}>Q</kbd>
                  <span className={`text-xs font-medium ${currentTheme.textMuted}`}>Prev</span>
                </div>
              )}

              <div
                className={`inline-flex items-center gap-1 ${currentTheme.primaryBg} rounded-xl p-1.5 overflow-x-auto`}
                data-coachmark="toolbar-view-switcher"
              >
                {viewButtons.map(({ value, label, icon: Icon }) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onViewChange(value)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                          view === value
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                            : `${isDarkMode ? "text-gray-400" : "text-gray-600"} hover:${currentTheme.primaryText} hover:${currentTheme.primaryBg}`
                        }`}
                        type="button"
                      >
                        <Icon className={`w-4 h-4 ${view === value ? "text-white" : ""}`} />
                        <span>{label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>{label} view</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {showViewShortcuts && (
                <div className={`hidden rounded-full border px-3 py-2 md:flex md:items-center md:gap-2 ${currentTheme.border} ${currentTheme.bg}`}>
                  <span className={`text-xs font-medium ${currentTheme.textMuted}`}>Next</span>
                  <kbd className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${currentTheme.border} ${currentTheme.text}`}>E</kbd>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              {(view === "board" || view === "backlog") && onReplayCurrentHints && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onReplayCurrentHints}
                      className={helpButtonClassName}
                      type="button"
                    >
                      <HelpCircle className="w-5 h-5 pointer-events-none" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>Replay coachmarks</TooltipContent>
                </Tooltip>
              )}

              {(view === "list" || view === "history") && onReplayBoardHints && onReplayBacklogHints && (
                <Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <PopoverTrigger asChild>
                          <button
                            className={helpButtonClassName}
                            type="button"
                          >
                            <HelpCircle className="w-5 h-5 pointer-events-none" />
                          </button>
                        </PopoverTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>Open coachmark options</TooltipContent>
                  </Tooltip>
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
                <UserProfileChip
                  username={userProgress.username}
                  subtitle={`Level ${userProgress.level}`}
                  onClick={onProfileClick}
                  tooltip="Open profile"
                />
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onOpenSettings}
                    className={helpButtonClassName}
                    type="button"
                  >
                    <Settings className="w-5 h-5 pointer-events-none" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>Open settings</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
