import { HelpCircle, LogOut, Settings } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { UserProfileChip } from "./UserProfileChip";
import { BanBanLogo } from "./BanBanLogo";

interface ToolbarProps {
  onOpenSettings: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onReplayCurrentHints?: () => void;
  helpCoachmarkId?: string;
  userProfile?: {
    username: string;
    subtitle: string;
  };
}

export function Toolbar({
  onOpenSettings,
  onLogout,
  onProfileClick,
  onReplayCurrentHints,
  helpCoachmarkId,
  userProfile,
}: ToolbarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);

  const iconButtonClassName = `group relative z-20 inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${
    isDarkMode
      ? "bg-transparent text-zinc-400 hover:bg-white/[0.05]"
      : "bg-transparent text-slate-500 hover:bg-black/[0.04]"
  }`;

  return (
    <header
      className={workspaceSurface.glassHeaderClassName}
      style={workspaceSurface.glassHeaderStyle}
    >
      <div className="flex h-[4.75rem] w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <BanBanLogo size="lg" />
        </div>

        <div className="flex items-center justify-end gap-2">
          {userProfile && onProfileClick && (
            <UserProfileChip
              username={userProfile.username}
              subtitle={userProfile.subtitle}
              onClick={onProfileClick}
              tooltip="Open profile"
            />
          )}

          {onReplayCurrentHints && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onReplayCurrentHints}
                  className={iconButtonClassName}
                  data-coachmark={helpCoachmarkId}
                  type="button"
                >
                  <HelpCircle className="w-5 h-5 pointer-events-none" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>Replay coachmarks</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenSettings}
                className={iconButtonClassName}
                type="button"
              >
                <Settings className="w-5 h-5 pointer-events-none" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Open settings</TooltipContent>
          </Tooltip>

          {onLogout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className={iconButtonClassName}
                  type="button"
                >
                  <LogOut className="w-5 h-5 pointer-events-none" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>Log out</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  );
}
