import { useState } from "react";
import { Check, ChevronDown, HelpCircle, Tag, X } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Label } from "../utils/labels";
import * as Popover from "@radix-ui/react-popover";
import { CustomScrollArea } from "./CustomScrollArea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface LabelSelectorProps {
  availableLabels: Label[];
  selectedLabelIds: number[];
  onLabelsChange: (labelIds: number[]) => void;
}

export function LabelSelector({
  availableLabels,
  selectedLabelIds,
  onLabelsChange,
}: LabelSelectorProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const pickerSurfaceClassName = "bg-input-background dark:bg-input/30";
  const pickerShadowClassName = isDarkMode
    ? "shadow-[0_20px_48px_rgba(0,0,0,0.58)]"
    : "shadow-[0_20px_44px_rgba(15,23,42,0.22)]";

  const [isOpen, setIsOpen] = useState(false);

  const selectedLabels = availableLabels.filter((label) => selectedLabelIds.includes(label.id));

  const toggleLabel = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabelIds, labelId]);
    }
  };

  const removeLabel = (labelId: number) => {
    onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <label className={`text-sm font-semibold ${currentTheme.textSecondary}`}>
          Labels
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className={`h-3.5 w-3.5 ${currentTheme.textMuted} cursor-help`} />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            Use labels to group tasks by topic, feature, or workflow.
          </TooltipContent>
        </Tooltip>
      </div>

      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left outline-none transition-[color,box-shadow,border-color] duration-300 ease-out ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.text} hover:${currentTheme.borderHover} hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10 focus-visible:outline-none focus-visible:border-transparent focus-visible:ring-2 ${currentTheme.focus} data-[state=open]:border-transparent data-[state=open]:ring-2 ${currentTheme.ring}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Tag className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
              <span className={`truncate text-sm ${selectedLabels.length === 0 ? currentTheme.textMuted : currentTheme.text}`}>
                {selectedLabels.length === 0 ? "Select labels" : `${selectedLabels.length} selected`}
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
        <Popover.Content
            className={`z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border ${currentTheme.inputBorder} ${pickerSurfaceClassName} p-1 ${pickerShadowClassName} animate-in fade-in zoom-in-95 duration-200`}
            sideOffset={8}
            align="start"
          >
            <CustomScrollArea viewportClassName={`max-h-64 ${pickerSurfaceClassName}`}>
              <div className={`-mr-3 w-[calc(100%+0.75rem)] space-y-1 pr-3 ${pickerSurfaceClassName}`}>
                {availableLabels.length === 0 ? (
                  <p className={`px-3 py-4 text-center text-sm italic ${pickerSurfaceClassName} ${currentTheme.textMuted}`}>
                    No labels available yet.
                  </p>
                ) : (
                  availableLabels.map((label) => {
                    const isSelected = selectedLabelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleLabel(label.id)}
                        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? `${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`
                            : `${pickerSurfaceClassName} ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`
                        }`}
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                        <span className={`flex-1 truncate font-medium ${isSelected ? "" : currentTheme.text}`}>
                          {label.name}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </CustomScrollArea>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedLabels.map((label) => (
            <button
              key={label.id}
              onClick={() => removeLabel(label.id)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: label.color }}
            >
              <span>{label.name}</span>
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
