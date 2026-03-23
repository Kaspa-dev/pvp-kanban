import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";

interface Assignee {
  name: string;
  color: string;
}

interface AssigneePopoverProps {
  currentAssignee: Assignee;
  onAssigneeChange: (assignee: Assignee | null) => void;
  availableAssignees: Assignee[];
}

export function AssigneePopover({ 
  currentAssignee, 
  onAssigneeChange, 
  availableAssignees 
}: AssigneePopoverProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm ring-1 ${isDarkMode ? 'ring-gray-600' : 'ring-gray-200'} hover:ring-2 hover:shadow-md transition-all cursor-pointer`}
          style={{ backgroundColor: currentAssignee.color }}
          title={`Assigned to ${currentAssignee.name}`}
        >
          {currentAssignee.name.charAt(0).toUpperCase()}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={`${currentTheme.cardBg} rounded-xl shadow-xl border-2 ${currentTheme.border} p-3 w-56 z-50 animate-in fade-in zoom-in-95 duration-200`}
          sideOffset={5}
        >
          <div className="mb-2 px-2">
            <h4 className={`text-xs font-bold ${currentTheme.textMuted} uppercase tracking-wider`}>
              Reassign to
            </h4>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
            {availableAssignees.map((assignee) => {
              const isSelected = assignee.name === currentAssignee.name;
              return (
                <button
                  key={assignee.name}
                  onClick={() => {
                    onAssigneeChange(assignee);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                    isSelected
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white`
                      : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                    style={{ backgroundColor: assignee.color }}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : currentTheme.text}`}>
                    {assignee.name}
                  </span>
                  {isSelected && (
                    <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}

            <div className={`pt-2 border-t ${currentTheme.border}`}>
              <button
                onClick={() => onAssigneeChange(null)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'}`}>
                  <X className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium ${currentTheme.textSecondary}`}>
                  Unassign
                </span>
              </button>
            </div>
          </div>

          <Popover.Arrow className={isDarkMode ? 'fill-gray-800' : 'fill-white'} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}