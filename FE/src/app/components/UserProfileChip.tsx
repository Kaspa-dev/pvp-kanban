import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { AppAvatar } from "./AppAvatar";

interface UserProfileChipProps {
  username: string;
  fullName?: string;
  subtitle: string;
  onClick?: () => void;
  tooltip?: string;
}

export function UserProfileChip({
  username,
  fullName,
  subtitle,
  onClick,
  tooltip,
}: UserProfileChipProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const content = onClick ? (
    <button
      onClick={onClick}
      className={`group flex cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2 transition-all duration-200 hover:shadow-sm ${currentTheme.accentIconButtonHover}`}
      type="button"
    >
      <AppAvatar
        username={username}
        fullName={fullName}
        size={32}
        className="pointer-events-none shadow-sm"
      />
      <div className="hidden min-w-0 pointer-events-none sm:flex flex-col items-start">
        <span className={`max-w-[140px] truncate text-sm font-semibold leading-tight transition-colors ${currentTheme.text} group-hover:${currentTheme.primaryText}`}>
          {username}
        </span>
        <span className={`text-xs leading-tight transition-colors ${currentTheme.textMuted} group-hover:${currentTheme.primaryText}`}>
          {subtitle}
        </span>
      </div>
    </button>
  ) : (
    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
      <AppAvatar
        username={username}
        fullName={fullName}
        size={32}
        className="shadow-sm"
      />
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
      <TooltipContent side="bottom" sideOffset={8}>{tooltip ?? fullName ?? username}</TooltipContent>
    </Tooltip>
  );
}
