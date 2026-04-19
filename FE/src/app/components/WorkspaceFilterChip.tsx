import { ReactNode } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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
    ? "hover:-translate-y-px hover:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_22px_rgba(0,0,0,0.34),0_0_18px_rgba(255,255,255,0.045)]"
    : "hover:-translate-y-px hover:shadow-sm";
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

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center rounded-full border px-4 text-sm font-medium transition-all duration-300 ease-out ${hoverLiftClassName} ${
        isActive
          ? `${currentTheme.primaryBg} ${currentTheme.primaryText} ${currentTheme.primaryBorder}`
          : `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} hover:${currentTheme.primaryBorder} hover:${currentTheme.primaryText} hover:ring-1 hover:${currentTheme.ring}`
      }`}
      aria-pressed={isActive}
    >
      <span className="inline-flex items-center gap-2 leading-none">
        <span>{label}</span>
        {shortcut}
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

  const content = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-300 ease-out ${
        disabled
          ? `${currentTheme.bg} ${currentTheme.textMuted} ${currentTheme.border}`
          : `${currentTheme.bg} ${currentTheme.textSecondary} ${currentTheme.border} ${hoverLiftClassName} hover:${currentTheme.primaryBorder} hover:${currentTheme.primaryText} hover:ring-1 hover:${currentTheme.ring}`
      }`}
    >
      <span className="inline-flex items-center gap-2 leading-none">
        <span>{label}</span>
        {shortcut}
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
