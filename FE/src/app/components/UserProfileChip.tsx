import { useEffect, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { fetchCurrentUserGamificationSummary } from "../utils/gamification";
import type { GamificationSummary } from "../utils/gamification";
import { AppAvatar } from "./AppAvatar";
import { LevelProgressCard } from "./LevelProgressCard";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface UserProfileChipProps {
  username: string;
  fullName?: string;
  subtitle: string;
  level?: number | null;
  gamificationSummary?: GamificationSummary | null;
  onClick?: () => void;
}

export function UserProfileChip({
  username,
  fullName,
  subtitle,
  level,
  gamificationSummary,
  onClick,
}: UserProfileChipProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [isOpen, setIsOpen] = useState(false);
  const [loadedSummary, setLoadedSummary] = useState<GamificationSummary | null>(null);
  const [hasRequestedSummary, setHasRequestedSummary] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const isMountedRef = useRef(true);

  const summary = gamificationSummary ?? loadedSummary;
  const displayedLevel = summary?.currentLevel ?? level ?? null;
  const profilePopoverSurfaceClassName = isDarkMode
    ? "border-zinc-800/95 bg-zinc-950/92 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.92)]"
    : "border-slate-200 bg-white/96 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.42)]";

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const loadSummaryIfNeeded = () => {
    if (gamificationSummary || loadedSummary || hasRequestedSummary || isLoadingSummary) {
      return;
    }

    setHasRequestedSummary(true);
    setIsLoadingSummary(true);
    setSummaryError(false);

    void fetchCurrentUserGamificationSummary()
      .then((nextSummary) => {
        if (!isMountedRef.current) {
          return;
        }

        setLoadedSummary(nextSummary);
      })
      .catch(() => {
        if (!isMountedRef.current) {
          return;
        }

        setSummaryError(true);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoadingSummary(false);
        }
      });
  };

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);

    if (nextIsOpen) {
      loadSummaryIfNeeded();
    }
  };

  const trigger = (
    <button
      aria-label="Open account progress menu"
      className={`group flex cursor-pointer items-center gap-4 rounded-2xl px-3 py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 ${currentTheme.focus} ${currentTheme.accentIconButtonHover}`}
      type="button"
    >
      <AppAvatar
        username={username}
        fullName={fullName}
        size={40}
        level={displayedLevel}
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
  );

  if (!onClick) {
    return (
      <div className="flex items-center gap-4 rounded-lg px-3 py-2">
        <AppAvatar
          username={username}
          fullName={fullName}
          size={40}
          level={displayedLevel}
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
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={12}
        className={`relative w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border p-3.5 backdrop-blur-xl ${profilePopoverSurfaceClassName}`}
      >
        <div className={`pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
        <div className={`pointer-events-none absolute -bottom-16 left-4 h-28 w-28 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />
        <div className="relative z-10">
          <LevelProgressCard
            username={username}
            fullName={fullName ?? username}
            level={displayedLevel}
            summary={summary}
            variant="orbit-ribbon-console"
            dataVariant="checkpoint-path"
            isLoading={isLoadingSummary}
            hasError={summaryError}
            showAmbientGrid={false}
            onViewProfile={() => {
              setIsOpen(false);
              onClick();
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
