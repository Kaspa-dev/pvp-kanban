import type { ButtonHTMLAttributes, ReactNode } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";

interface WorkspaceSecondaryActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export function WorkspaceSecondaryActionButton({
  icon,
  children,
  className = "",
  disabled,
  ...buttonProps
}: WorkspaceSecondaryActionButtonProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const disabledClassName = disabled
    ? "cursor-not-allowed opacity-60 hover:scale-100 hover:shadow-sm"
    : "hover:scale-[1.03] hover:shadow-lg";
  const hoverOverlayClassName = disabled ? "" : "group-hover:opacity-100";
  const iconMotionClassName = disabled ? "" : "group-hover:-rotate-6 group-hover:scale-110";

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      disabled={disabled}
      className={`font-ui-condensed group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border-2 px-5 py-3.5 text-sm font-semibold tracking-[0.01em] ${currentTheme.primaryBorder} ${currentTheme.primaryText} bg-gradient-to-r ${currentTheme.primarySoft} shadow-sm transition-all duration-300 ease-out focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus} ${disabledClassName} ${className}`}
    >
      <span
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${currentTheme.primarySoftStrong} opacity-0 transition-opacity duration-300 ease-out ${hoverOverlayClassName}`}
        aria-hidden="true"
      />
      <span className="relative inline-flex items-center gap-2.5">
        {icon ? (
          <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-300 ease-out ${iconMotionClassName}`}>
            {icon}
          </span>
        ) : null}
        <span>{children}</span>
      </span>
    </button>
  );
}
