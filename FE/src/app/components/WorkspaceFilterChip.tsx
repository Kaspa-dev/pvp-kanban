import { cloneElement, isValidElement, ReactNode } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";
import { getInputLikeControlClassName } from "./inputLikeControlStyles";

interface WorkspaceFilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  tooltip?: string;
  shortcut?: ReactNode;
  delayDuration?: number;
}

interface WorkspaceClearButtonProps {
  label?: string;
  onClick: () => void;
  tooltip: string;
  shortcut?: ReactNode;
  disabled?: boolean;
  delayDuration?: number;
}

function enhanceShortcutNode(
  shortcut: ReactNode,
  keybindClassName: string,
) {
  if (!isValidElement<{ className?: string }>(shortcut)) {
    return shortcut;
  }

  return cloneElement(shortcut, {
    className: cn(shortcut.props.className, keybindClassName),
  });
}

function getAccentBorderClassName(ringClassName: string) {
  return ringClassName.replace(/\bring-/g, "border-");
}

export function WorkspaceFilterChip({
  label,
  isActive,
  onClick,
  tooltip,
  shortcut,
  delayDuration,
}: WorkspaceFilterChipProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const controlSurfaceClassName = "bg-input-background bg-white dark:bg-input/30";
  const activeFilterChipClassName = isDarkMode
    ? `${currentTheme.primaryBorder} ${controlSurfaceClassName} ${currentTheme.primaryText}`
    : `${getAccentBorderClassName(currentTheme.ring)} ${controlSurfaceClassName} ${currentTheme.primaryText}`;
  const keybindBaseClassName = "inline-flex shrink-0 items-center justify-center rounded-md border px-2 py-1 text-[10px] font-semibold leading-none transition-colors duration-300 ease-out";
  const keybindClassName = isActive
    ? `${keybindBaseClassName} ${activeFilterChipClassName}`
    : `${keybindBaseClassName}`;
  const renderedShortcut = shortcut
    ? enhanceShortcutNode(shortcut, keybindClassName)
    : shortcut;

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={`font-ui-condensed group inline-flex h-11 items-center justify-center px-4 text-sm font-medium tracking-[0.01em] ${
        isActive
          ? `${getInputLikeControlClassName(currentTheme, {
              selected: true,
              surfaceClassName: controlSurfaceClassName,
              selectedSurfaceClassName: controlSurfaceClassName,
            })} ${activeFilterChipClassName}`
          : `${currentTheme.textSecondary} ${getInputLikeControlClassName(currentTheme, { surfaceClassName: controlSurfaceClassName })}`
      }`}
      aria-pressed={isActive}
    >
      <span className="inline-flex items-center gap-2 leading-none">
        <span>{label}</span>
        {renderedShortcut}
      </span>
    </button>
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

export function WorkspaceClearButton({
  label = "Clear",
  onClick,
  tooltip,
  shortcut,
  disabled = false,
  delayDuration,
}: WorkspaceClearButtonProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const controlSurfaceClassName = "bg-input-background bg-white dark:bg-input/30";
  const keybindClassName = "inline-flex shrink-0 items-center justify-center rounded-md border px-2 py-1 text-[10px] font-semibold leading-none transition-colors duration-300 ease-out";
  const renderedShortcut = shortcut
    ? enhanceShortcutNode(shortcut, keybindClassName)
    : shortcut;

  const content = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-ui-condensed group inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-medium tracking-[0.01em] ${
        disabled
          ? `${currentTheme.textMuted} ${getInputLikeControlClassName(currentTheme, { surfaceClassName: controlSurfaceClassName, disabled: true })}`
          : `${currentTheme.textSecondary} ${getInputLikeControlClassName(currentTheme, { surfaceClassName: controlSurfaceClassName })}`
      }`}
    >
      <span className="inline-flex items-center gap-2 leading-none">
        <span>{label}</span>
        {renderedShortcut}
      </span>
    </button>
  );

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
