import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getLevelTier, normalizeAvatarLevel } from "../utils/levelBadges";
import { cn } from "./ui/utils";

type LevelNumberBadgeProps = {
  level: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
};

export function LevelNumberBadge({ level, size = "md", className }: LevelNumberBadgeProps) {
  const normalizedLevel = normalizeAvatarLevel(level);
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  if (!normalizedLevel) {
    return (
      <span
        className={cn(
          "font-due-date inline-flex shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums",
          size === "sm" ? "h-7 min-w-7 px-2 text-[0.68rem]" : "h-8 min-w-8 px-2.5 text-xs",
          currentTheme.border,
          currentTheme.textMuted,
          isDarkMode ? "bg-zinc-900" : "bg-slate-100",
          className,
        )}
      >
        -
      </span>
    );
  }

  const tier = getLevelTier(normalizedLevel);

  return (
    <span
      className={cn(
        "font-due-date inline-flex shrink-0 items-center justify-center rounded-full border font-semibold leading-none text-white tabular-nums",
        size === "sm" ? "h-7 min-w-7 px-2 text-[0.68rem]" : "h-8 min-w-8 px-2.5 text-xs",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${tier.color}, ${tier.colorStrong})`,
        borderColor: isDarkMode ? "rgba(9,9,11,0.95)" : "rgba(255,255,255,0.95)",
        boxShadow: `0 0 0 2px ${tier.colorStrong}, 0 8px 18px -12px ${tier.colorStrong}`,
        textShadow: "0 1px 1px rgba(15,23,42,0.38)",
      }}
      aria-label={`Level ${normalizedLevel}`}
    >
      {normalizedLevel}
    </span>
  );
}
