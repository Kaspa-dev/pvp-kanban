import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

interface WorkspaceToolbarSelectOption {
  value: string;
  label: string;
}

interface WorkspaceToolbarSelectProps {
  label: string;
  value: string;
  selectedLabel: string;
  options: WorkspaceToolbarSelectOption[];
  onValueChange: (value: string) => void;
  widthClassName?: string;
  hideSelectedOption?: boolean;
  tooltip?: string;
  delayDuration?: number;
}

export function WorkspaceToolbarSelect({
  label,
  value,
  selectedLabel,
  options,
  onValueChange,
  widthClassName = "xl:w-52 xl:flex-none",
  hideSelectedOption = false,
  tooltip,
  delayDuration,
}: WorkspaceToolbarSelectProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const visibleOptions = hideSelectedOption
    ? options.filter((option) => option.value !== value)
    : options;

  const content = (
    <label className={`block ${widthClassName}`}>
      <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={`h-11 rounded-xl border ${workspaceSurface.controlSurfaceClassName} ${workspaceSurface.controlSurfaceHoverClassName} ${currentTheme.inputBorder} ${currentTheme.text} data-[size=default]:h-11 px-4 py-0 shadow-none transition-[border-color,box-shadow] duration-300 ease-out hover:!bg-white dark:hover:!bg-input/30 focus:ring-2 ${currentTheme.focus} [&_[data-slot=select-value]]:text-left`}
        >
          <SelectValue placeholder={label}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent className={`rounded-xl border ${currentTheme.border} ${currentTheme.cardBg} shadow-xl`}>
          {visibleOptions.map((option) => (
            <SelectItem
              key={option.value}
              className={`rounded-lg ${currentTheme.textSecondary} ${currentTheme.accentSelectItemHover}`}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );

  if (!tooltip) {
    return content;
  }

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
