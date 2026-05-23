import type { ButtonHTMLAttributes, ReactNode } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { cn } from "./ui/utils";

interface StagingTaskActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export function StagingTaskActionButton({
  icon,
  children,
  className,
  type = "button",
  ...buttonProps
}: StagingTaskActionButtonProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <button
      {...buttonProps}
      type={type}
      className={cn(
        "group inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        currentTheme.focus,
        currentTheme.border,
        currentTheme.textSecondary,
        isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-white",
        `hover:${currentTheme.primaryText}`,
        className,
      )}
    >
      {icon ? <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">{icon}</span> : null}
      <span className="leading-none">{children}</span>
    </button>
  );
}
