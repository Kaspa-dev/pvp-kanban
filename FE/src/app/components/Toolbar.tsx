import { HelpCircle, LogOut, Settings } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { UserProfileChip } from "./UserProfileChip";
import { BanBanLogo } from "./BanBanLogo";
import { UtilityIconButton } from "./UtilityIconButton";

const XP_PULSE_EASE = [0.16, 1, 0.3, 1] as const;

interface ToolbarProps {
  onOpenSettings: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onReplayCurrentHints?: () => void;
  helpCoachmarkId?: string;
  xpPulseAmount?: number;
  xpPulseKey?: number;
  userProfile?: {
    username: string;
    fullName?: string;
    subtitle: string;
  };
}

function NavbarXpPulse({
  amount,
  pulseKey,
}: {
  amount?: number;
  pulseKey?: number;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const shouldReduceMotion = useReducedMotion();

  if (!amount || amount <= 0) {
    return null;
  }

  return (
    <motion.span
      key={`${pulseKey ?? 0}-${amount}`}
      role="status"
      aria-live="polite"
      className={`font-due-date pointer-events-none absolute right-[calc(100%+0.65rem)] top-1/2 z-30 whitespace-nowrap text-sm font-semibold leading-none ${currentTheme.primaryText}`}
      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 8, y: "-50%", scale: shouldReduceMotion ? 1 : 0.96 }}
      animate={{ opacity: [0, 1, 1, 0], x: shouldReduceMotion ? 0 : [8, -2, -7, -14], y: "-50%", scale: shouldReduceMotion ? 1 : [0.96, 1.02, 1, 0.98] }}
      transition={{ duration: shouldReduceMotion ? 1.15 : 1.85, times: [0, 0.2, 0.68, 1], ease: XP_PULSE_EASE }}
    >
      +{new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)} XP
    </motion.span>
  );
}

function NavbarProfilePulseRing({
  amount,
  pulseKey,
}: {
  amount?: number;
  pulseKey?: number;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const shouldReduceMotion = useReducedMotion();

  if (!amount || amount <= 0) {
    return null;
  }

  return (
    <motion.span
      key={`profile-ring-${pulseKey ?? 0}-${amount}`}
      aria-hidden="true"
      className={`pointer-events-none absolute left-3 top-1/2 z-20 h-11 w-11 rounded-full border ${currentTheme.primaryBorder}`}
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.86, y: "-50%" }}
      animate={{ opacity: [0, 0.72, 0.34, 0], scale: shouldReduceMotion ? [1, 1, 1, 1] : [0.86, 1.08, 1.24, 1.36], y: "-50%" }}
      transition={{ duration: shouldReduceMotion ? 1.15 : 1.75, times: [0, 0.18, 0.58, 1], ease: XP_PULSE_EASE }}
    />
  );
}

export function Toolbar({
  onOpenSettings,
  onLogout,
  onProfileClick,
  onReplayCurrentHints,
  helpCoachmarkId,
  xpPulseAmount,
  xpPulseKey,
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
            <div className="relative flex items-center">
              <NavbarXpPulse amount={xpPulseAmount} pulseKey={xpPulseKey} />
              <NavbarProfilePulseRing amount={xpPulseAmount} pulseKey={xpPulseKey} />
              <UserProfileChip
                username={userProfile.username}
                fullName={userProfile.fullName}
                subtitle={userProfile.subtitle}
                onClick={onProfileClick}
              />
            </div>
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
