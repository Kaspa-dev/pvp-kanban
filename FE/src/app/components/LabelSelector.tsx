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
  maxSelectedLabels?: number;
}

export function LabelSelector({
  availableLabels,
  selectedLabelIds,
  onLabelsChange,
  maxSelectedLabels,
}: LabelSelectorProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const pickerSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-input-background";
  const pickerPopoverSurfaceClassName = isDarkMode ? "!bg-zinc-950" : "!bg-input-background";
  const pickerShadowClassName = isDarkMode
    ? "shadow-[0_20px_48px_rgba(0,0,0,0.58)]"
    : "shadow-[0_20px_44px_rgba(15,23,42,0.22)]";
  const labelChipClassName = "inline-flex min-w-0 max-w-[12rem] items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm";

  const [isOpen, setIsOpen] = useState(false);

  const selectedLabels = availableLabels.filter((label) => selectedLabelIds.includes(label.id));
  const hasReachedSelectionLimit = maxSelectedLabels !== undefined && selectedLabelIds.length >= maxSelectedLabels;

  const toggleLabel = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
      return;
    }

    if (maxSelectedLabels !== undefined && selectedLabelIds.length >= maxSelectedLabels) {
      return;
    }

    onLabelsChange([...selectedLabelIds, labelId]);
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
            Use labels to group tasks by topic, feature, or workflow. You can attach up to {maxSelectedLabels ?? "several"} labels.
          </TooltipContent>
        </Tooltip>
      </div>

      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left outline-none transition-[color,box-shadow,border-color] duration-300 ease-out ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.text} hover:${currentTheme.borderHover} hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10 focus-visible:outline-none focus-visible:border-transparent focus-visible:ring-2 ${currentTheme.focus} data-[state=open]:border-transparent data-[state=open]:ring-2 ${currentTheme.ring}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Tag
                    className={`h-4 w-4 shrink-0 ${
                      selectedLabels.length > 0 ? currentTheme.primaryText : currentTheme.textMuted
                    }`}
                  />
                  <span
                    className={`truncate text-sm font-normal ${
                      selectedLabels.length === 0 ? currentTheme.textMuted : currentTheme.text
                    }`}
                  >
                    {selectedLabels.length === 0 ? "Select labels" : `${selectedLabels.length} selected`}
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />
              </button>
            </Popover.Trigger>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {selectedLabels.length === 0 ? "Open label selector" : "Change selected labels"}
          </TooltipContent>
        </Tooltip>

        <Popover.Portal>
        <Popover.Content
            className={`z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl border-2 ${currentTheme.inputBorder} ${pickerPopoverSurfaceClassName} p-1 ${pickerShadowClassName} animate-in fade-in zoom-in-95 duration-200`}
            sideOffset={8}
            align="start"
          >
            <CustomScrollArea className={`overflow-hidden rounded-lg ${pickerSurfaceClassName}`} viewportClassName={`max-h-64 ${pickerSurfaceClassName}`}>
              <div className={`space-y-1 pr-4 ${pickerSurfaceClassName}`}>
                {availableLabels.length === 0 ? (
                  <p className={`px-3 py-4 text-center text-sm italic ${pickerSurfaceClassName} ${currentTheme.textMuted}`}>
                    No labels available yet.
                  </p>
                ) : (
                  availableLabels.map((label) => {
                    const isSelected = selectedLabelIds.includes(label.id);
                    return (
                      <Tooltip key={label.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => toggleLabel(label.id)}
                            className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? `${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`
                                : `${pickerSurfaceClassName} ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText} ${
                                  hasReachedSelectionLimit ? "opacity-90" : ""
                                }`
                            }`}
                          >
                            <span
                              className={labelChipClassName}
                              style={{ backgroundColor: label.color }}
                            >
                              <span className="truncate">{label.name}</span>
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {isSelected ? `Remove ${label.name}` : `Add ${label.name}`}
                        </TooltipContent>
                      </Tooltip>
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
            <div
              key={label.id}
              className={`${labelChipClassName} gap-1.5 text-sm font-medium`}
              style={{ backgroundColor: label.color }}
            >
              <span>{label.name}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => removeLabel(label.id)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55"
                    aria-label={`Remove ${label.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Remove {label.name}</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
