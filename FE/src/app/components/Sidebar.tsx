import { User, Inbox, Calendar, Tag, Plus, ChevronDown, X, LogOut } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { BoardLogo } from "./BoardLogo";
import { Label } from "../utils/labels";
import { BanBanLogo } from "./BanBanLogo";
import * as Popover from "@radix-ui/react-popover";
import { BoardLogoColorKey, BoardLogoIconKey } from "../utils/boardIdentity";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCreateTask: () => void;
  selectedLabels: number[];
  onLabelsChange: (labels: number[]) => void;
  onLogout?: () => void;
  boardName?: string;
  boardLogoIconKey?: BoardLogoIconKey;
  boardLogoColorKey?: BoardLogoColorKey;
  labels: Label[];
  className?: string;
}

export function Sidebar({ 
  activeFilter, 
  onFilterChange, 
  onCreateTask, 
  selectedLabels, 
  onLabelsChange,
  onLogout,
  boardName,
  boardLogoIconKey,
  boardLogoColorKey,
  labels,
  className = "",
}: SidebarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);

  const filters = [
    { id: "all", label: "All", icon: Inbox },
    { id: "assigned", label: "Assigned to me", icon: User },
    { id: "due", label: "Due this week", icon: Calendar },
  ];

  const toggleLabel = (labelId: number) => {
    if (selectedLabels.includes(labelId)) {
      onLabelsChange(selectedLabels.filter(l => l !== labelId));
    } else {
      onLabelsChange([...selectedLabels, labelId]);
    }
  };

  const removeLabel = (labelId: number) => {
    onLabelsChange(selectedLabels.filter(l => l !== labelId));
  };

  return (
    <aside
      className={`w-72 flex flex-col border-r ${workspaceSurface.panelSurfaceClassName} ${className}`}
      style={workspaceSurface.panelSurfaceStyle}
    >
      {/* Logo & Project Title */}
      <div className={`border-b px-6 pb-6 pt-6 ${currentTheme.border}`}>
        <BanBanLogo size="lg" />
        {boardName && (
          <div className="mt-4 flex items-center gap-3 min-w-0">
            <BoardLogo iconKey={boardLogoIconKey} colorKey={boardLogoColorKey} size="xs" />
            <h2 className={`min-w-0 text-base font-bold ${currentTheme.text} truncate`}>{boardName}</h2>
          </div>
        )}
      </div>

      {/* Create Task Button */}
      <div className="px-5 pt-6 pb-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onCreateTask}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-lg hover:${currentTheme.primaryHover} transition-all hover:scale-[1.01] shadow-md hover:shadow-lg`}
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>Create a new backlog task</TooltipContent>
        </Tooltip>
      </div>

      {/* Quick Filters Section */}
      <div className="px-5 pb-6">
        <h4 className={`text-xs font-semibold ${currentTheme.textMuted} uppercase tracking-wider mb-3 px-1`}>
          Quick Filters
        </h4>
        <nav className="space-y-1">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <Tooltip key={filter.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onFilterChange(filter.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                        : isDarkMode
                        ? `${currentTheme.textSecondary} border border-transparent hover:${currentTheme.borderHover} hover:${currentTheme.bgTertiary}`
                        : `${currentTheme.textSecondary} hover:bg-gray-100`
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{filter.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>{filter.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Labels Filter Section */}
      <div className="px-5 pb-6 flex-1 overflow-auto">
        <h4 className={`text-xs font-semibold ${currentTheme.textMuted} uppercase tracking-wider mb-3 px-1`}>
          Labels
        </h4>
        
        <Popover.Root>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex w-full">
                <Popover.Trigger asChild>
                  <button
                    className={`mb-4 w-full rounded-lg border px-3 py-2.5 text-left transition-all ${workspaceSurface.inputSurfaceClassName} hover:${currentTheme.primaryBorder} hover:shadow-sm`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className={`w-4 h-4 ${currentTheme.textMuted}`} />
                      <span className={`text-sm font-medium ${currentTheme.textSecondary}`}>Select labels</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 ${currentTheme.textMuted}`} />
                  </button>
                </Popover.Trigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Filter tasks by label</TooltipContent>
          </Tooltip>

          <Popover.Portal>
            <Popover.Content
              className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border} p-3 w-56 z-50 animate-in fade-in zoom-in-95 duration-200`}
              sideOffset={5}
              align="start"
            >
              <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                {labels.length === 0 ? (
                  <p className={`text-sm ${currentTheme.textMuted} italic text-center py-4`}>
                    No labels yet. Create one in task modal!
                  </p>
                ) : (
                  labels.map((label) => {
                    const isSelected = selectedLabels.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                          isSelected
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-md`
                            : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                        }`}
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: isSelected ? 'white' : label.color }}
                        />
                        <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-white' : currentTheme.text}`}>{label.name}</span>
                        {isSelected && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <Popover.Arrow className={isDarkMode ? 'fill-zinc-900' : 'fill-white'} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Selected Labels Chips */}
        {selectedLabels.length > 0 && (
          <div className="space-y-2.5">
            <p className={`text-xs font-semibold ${currentTheme.textMuted} uppercase tracking-wide px-1`}>Active:</p>
            <div className="flex flex-wrap gap-2">
              {selectedLabels.map((labelId) => {
                const label = labels.find(l => l.id === labelId);
                if (!label) return null;
                return (
                  <button
                    key={labelId}
                    onClick={() => removeLabel(labelId)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-white rounded-md text-xs font-medium hover:opacity-80 transition-all shadow-sm hover:shadow-md"
                    style={{ backgroundColor: label.color }}
                  >
                    <span>{label.name}</span>
                    <X className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Logout Button */}
      {onLogout && (
        <div className={`border-t px-5 pb-6 pt-2 ${currentTheme.border}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className={`w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-medium transition-all ${workspaceSurface.inputSurfaceClassName} ${currentTheme.textSecondary} hover:${currentTheme.primaryBorder} hover:shadow-sm`}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Sign out of your account</TooltipContent>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}
