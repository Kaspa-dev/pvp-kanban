import { Clock3 } from "lucide-react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { TaskStatus } from "../utils/cards";
import { getTaskColumnAgeDisplay } from "../utils/taskColumnAge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

interface TaskColumnAgeBadgeProps {
  statusEnteredAtUtc?: string | null;
  status: TaskStatus;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function TaskColumnAgeBadge({
  statusEnteredAtUtc,
  status,
  className,
  iconClassName,
  textClassName,
}: TaskColumnAgeBadgeProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const ageDisplay = getTaskColumnAgeDisplay(statusEnteredAtUtc, status);

  if (!ageDisplay) {
    return null;
  }

  const toneClassName =
    ageDisplay.tone === "stale"
      ? `${currentTheme.primaryText} font-semibold underline decoration-current/65 underline-offset-2`
      : ageDisplay.tone === "stuck"
        ? `${currentTheme.primaryText} font-semibold`
        : `${currentTheme.textMuted} font-normal`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("font-due-date inline-flex items-center gap-1.5 text-xs leading-none", toneClassName, className)}>
          <Clock3 className={cn("h-3.5 w-3.5", iconClassName)} />
          <span className={textClassName}>{ageDisplay.displayText}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>{ageDisplay.tooltipText}</TooltipContent>
    </Tooltip>
  );
}
