import { User, Inbox, Calendar, Tag, Plus, ChevronDown, X, LogOut } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import { BanBanLogo } from "./BanBanLogo";
import { Link } from "react-router";
import * as Popover from "@radix-ui/react-popover";

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCreateTask: () => void;
  selectedLabels: number[];
  onLabelsChange: (labels: number[]) => void;
  onLogout?: () => void;
  boardName?: string;
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
  labels,
  className = "",
}: SidebarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

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
    <aside className={`w-72 ${isDarkMode ? 'bg-[#1a1d24]' : 'bg-[#fafbfc]'} flex flex-col border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} ${className}`}>
      {/* Logo & Project Title */}
      <div className="px-6 pt-6 pb-6 border-b border-gray-200 dark:border-gray-800">
        <Link to="/app" className="inline-block">
          <BanBanLogo size="lg" />
        </Link>
        {boardName && (
          <h2 className={`mt-4 text-base font-bold ${currentTheme.text} truncate`}>{boardName}</h2>
        )}
      </div>

      {/* Create Task Button */}
      <div className="px-5 pt-6 pb-6">
        <button
          onClick={onCreateTask}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-lg hover:${currentTheme.primaryHover} transition-all hover:scale-[1.01] shadow-md hover:shadow-lg`}
        >
          <Plus className="w-5 h-5" />
          Create Task
        </button>
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
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                    : isDarkMode
                    ? `text-gray-300 hover:text-white border border-transparent hover:${currentTheme.primaryBorder} hover:shadow-sm`
                    : `${currentTheme.textSecondary} hover:bg-gray-100`
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{filter.label}</span>
              </button>
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
          <Popover.Trigger asChild>
            <button
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 ${
                isDarkMode 
                  ? `bg-[#242830] border-gray-700 hover:${currentTheme.primaryBorder} hover:shadow-sm` 
                  : `bg-white border-gray-200 hover:${currentTheme.primaryBorder}`
              } border rounded-lg transition-all text-left mb-4`}
            >
              <div className="flex items-center gap-2">
                <Tag className={`w-4 h-4 ${currentTheme.textMuted}`} />
                <span className={`text-sm font-medium ${currentTheme.textSecondary}`}>Select labels</span>
              </div>
              <ChevronDown className={`w-4 h-4 ${currentTheme.textMuted}`} />
            </button>
          </Popover.Trigger>

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
              <Popover.Arrow className={isDarkMode ? 'fill-gray-800' : 'fill-white'} />
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
        <div className="px-5 pb-6 pt-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onLogout}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 ${isDarkMode ? 'bg-[#242830] text-gray-300 hover:bg-[#2a2f3a] border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'} border font-medium rounded-lg transition-all`}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
