import { HelpCircle, LogOut, Settings } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { UserProfileChip } from "./UserProfileChip";
import { BanBanLogo } from "./BanBanLogo";
import { UtilityIconButton } from "./UtilityIconButton";

interface ToolbarProps {
  onOpenSettings: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onReplayCurrentHints?: () => void;
  helpCoachmarkId?: string;
  userProfile?: {
    username: string;
    fullName?: string;
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

  const iconButtonClassName = "group relative z-20 overflow-hidden rounded-2xl";

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
              fullName={userProfile.fullName}
              subtitle={userProfile.subtitle}
              onClick={onProfileClick}
              tooltip="Open profile"
            />
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <UtilityIconButton
                onClick={onReplayCurrentHints}
                disabled={!onReplayCurrentHints}
                size="lg"
                emphasis="elevated"
                className={iconButtonClassName}
                data-coachmark={helpCoachmarkId}
              >
                <HelpCircle className="w-5 h-5 pointer-events-none" />
              </UtilityIconButton>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
              {onReplayCurrentHints ? "Replay coachmarks" : "No hints available right now"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <UtilityIconButton
                onClick={onOpenSettings}
                size="lg"
                emphasis="elevated"
                className={iconButtonClassName}
              >
                <Settings className="w-5 h-5 pointer-events-none" />
              </UtilityIconButton>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Open settings</TooltipContent>
          </Tooltip>

          {onLogout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <UtilityIconButton
                  onClick={onLogout}
                  size="lg"
                  emphasis="elevated"
                  className={iconButtonClassName}
                >
                  <LogOut className="w-5 h-5 pointer-events-none" />
                </UtilityIconButton>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>Log out</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  );
}
