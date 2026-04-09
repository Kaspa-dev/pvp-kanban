import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";

interface UserProfileChipProps {
  username: string;
  subtitle: string;
  onClick?: () => void;
  tooltip?: string;
}

export function UserProfileChip({
  username,
  subtitle,
  onClick,
  tooltip,
}: UserProfileChipProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const content = onClick ? (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all cursor-pointer ${
        isDarkMode
          ? `border-transparent hover:${currentTheme.primaryBorder} hover:shadow-sm`
          : "border-transparent hover:bg-gray-100"
      }`}
      type="button"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${currentTheme.primary} text-sm font-bold text-white shadow-sm pointer-events-none`}>
        {username.charAt(0).toUpperCase()}
      </div>
      <div className="hidden min-w-0 pointer-events-none sm:flex flex-col items-start">
        <span className={`max-w-[140px] truncate text-sm font-semibold leading-tight ${currentTheme.text}`}>
          {username}
        </span>
        <span className={`text-xs leading-tight ${currentTheme.textMuted}`}>
          {subtitle}
        </span>
      </div>
    </button>
  ) : (
    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${currentTheme.primary} text-sm font-bold text-white shadow-sm`}>
        {username.charAt(0).toUpperCase()}
      </div>
      <div className="hidden min-w-0 sm:flex flex-col items-start">
        <span className={`max-w-[140px] truncate text-sm font-semibold leading-tight ${currentTheme.text}`}>
          {username}
        </span>
        <span className={`text-xs leading-tight ${currentTheme.textMuted}`}>
          {subtitle}
        </span>
      </div>
    </div>
  );

  if (!tooltip) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
