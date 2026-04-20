import { cloneElement, isValidElement, ReactNode } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

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

export function getWorkspaceFilterHoverClassName(isDarkMode: boolean) {
  return isDarkMode
    ? "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_18px_rgba(255,255,255,0.045)]"
    : "hover:shadow-sm";
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
  const hoverLiftClassName = getWorkspaceFilterHoverClassName(isDarkMode);
  const controlSurfaceClassName = "bg-input-background bg-white dark:bg-input/30";
  const keybindBaseClassName = "inline-flex shrink-0 items-center justify-center rounded-md border px-2 py-1 text-[10px] font-semibold leading-none transition-colors duration-300 ease-out";
  const keybindClassName = isActive
    ? `${keybindBaseClassName} ${currentTheme.primaryBorder} ${currentTheme.primaryBg} ${isDarkMode ? "text-white" : "text-gray-950"}`
    : `${keybindBaseClassName}`;
  const renderedShortcut = shortcut
    ? enhanceShortcutNode(shortcut, keybindClassName)
    : shortcut;

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-all duration-300 ease-out ${hoverLiftClassName} ${
        isActive
          ? `${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`
          : `${controlSurfaceClassName} ${currentTheme.textSecondary} ${currentTheme.inputBorder} hover:${currentTheme.borderHover} hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10`
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
  const hoverLiftClassName = getWorkspaceFilterHoverClassName(isDarkMode);
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
      className={`group inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all duration-300 ease-out ${
        disabled
          ? `${controlSurfaceClassName} ${currentTheme.textMuted} ${currentTheme.inputBorder}`
          : `${controlSurfaceClassName} ${currentTheme.textSecondary} ${currentTheme.inputBorder} ${hoverLiftClassName} hover:${currentTheme.borderHover} hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10`
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
