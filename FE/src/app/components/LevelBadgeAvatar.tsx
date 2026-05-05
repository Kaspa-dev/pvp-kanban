import type { CSSProperties } from "react";
import { AppAvatar } from "./AppAvatar";
import { cn } from "./ui/utils";

export type LevelBadgeVariant = "inner-ring" | "double-ring" | "inset-glow" | "progress-halo";

export type LevelTier = {
  name: string;
  minLevel: number;
  color: string;
  colorStrong: string;
  glow: string;
};

export const LEVEL_BADGE_VARIANTS: Array<{ key: LevelBadgeVariant; label: string; description: string }> = [
  {
    key: "inner-ring",
    label: "Inner Ring",
    description: "Quiet inset border for dense UI.",
  },
  {
    key: "double-ring",
    label: "Double Ring",
    description: "A second track for prestige.",
  },
  {
    key: "inset-glow",
    label: "Inset Glow",
    description: "Soft tier light inside the avatar edge.",
  },
  {
    key: "progress-halo",
    label: "Progress Halo",
    description: "Outer halo can later show next-level progress.",
  },
];

const LEVEL_TIERS: LevelTier[] = [
  { name: "Seed", minLevel: 1, color: "#94a3b8", colorStrong: "#64748b", glow: "rgba(148, 163, 184, 0.34)" },
  { name: "Copper", minLevel: 5, color: "#fb923c", colorStrong: "#ea580c", glow: "rgba(251, 146, 60, 0.34)" },
  { name: "Verdant", minLevel: 10, color: "#34d399", colorStrong: "#059669", glow: "rgba(52, 211, 153, 0.34)" },
  { name: "Signal", minLevel: 20, color: "#38bdf8", colorStrong: "#0284c7", glow: "rgba(56, 189, 248, 0.34)" },
  { name: "Violet", minLevel: 35, color: "#a78bfa", colorStrong: "#7c3aed", glow: "rgba(167, 139, 250, 0.36)" },
  { name: "Auric", minLevel: 50, color: "#facc15", colorStrong: "#ca8a04", glow: "rgba(250, 204, 21, 0.34)" },
  { name: "Crimson", minLevel: 75, color: "#fb7185", colorStrong: "#e11d48", glow: "rgba(251, 113, 133, 0.36)" },
  { name: "Mythic", minLevel: 100, color: "#f0abfc", colorStrong: "#c026d3", glow: "rgba(240, 171, 252, 0.38)" },
];

export function getLevelTier(level: number): LevelTier {
  return LEVEL_TIERS.reduce((current, tier) => (level >= tier.minLevel ? tier : current), LEVEL_TIERS[0]);
}

function getLevelProgress(level: number) {
  const tierIndex = LEVEL_TIERS.findIndex((tier) => tier.minLevel > level) - 1;
  const currentTierIndex = tierIndex >= 0 ? tierIndex : LEVEL_TIERS.length - 1;
  const currentTier = LEVEL_TIERS[currentTierIndex];
  const nextTier = LEVEL_TIERS[currentTierIndex + 1];

  if (!nextTier) {
    return 100;
  }

  return Math.max(8, Math.min(100, ((level - currentTier.minLevel) / (nextTier.minLevel - currentTier.minLevel)) * 100));
}

type LevelBadgeAvatarProps = {
  username: string;
  level: number;
  prestige: number;
  size?: number;
  variant: LevelBadgeVariant;
  isDarkMode?: boolean;
  className?: string;
};

export function LevelBadgeAvatar({
  username,
  level,
  prestige,
  size = 72,
  variant,
  isDarkMode = false,
  className,
}: LevelBadgeAvatarProps) {
  const tier = getLevelTier(level);
  const progress = getLevelProgress(level);
  const variantLabel = LEVEL_BADGE_VARIANTS.find((item) => item.key === variant)?.label ?? "Level badge";
  const shellSize = variant === "progress-halo" ? size + 18 : size + 14;
  const avatarLabel = `${username}, level ${level}, ${tier.name} tier, prestige ${prestige}, ${variantLabel} style`;
  const prestigeMark = prestige > 0 ? `P${prestige}` : "P0";
  const baseStyle = {
    width: shellSize,
    height: shellSize,
    "--level-color": tier.color,
    "--level-color-strong": tier.colorStrong,
    "--level-glow": tier.glow,
    "--level-progress": `${progress}%`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        isDarkMode ? "bg-zinc-950" : "bg-white",
        className,
      )}
      style={baseStyle}
      role="group"
      aria-label={avatarLabel}
    >
      {variant === "progress-halo" ? (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${tier.colorStrong} 0 ${progress}%, ${isDarkMode ? "#27272a" : "#e5e7eb"} ${progress}% 100%)`,
            boxShadow: `0 0 0 1px ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}, 0 18px 42px -28px ${tier.colorStrong}`,
          }}
          aria-hidden="true"
        />
      ) : null}

      {variant === "double-ring" ? (
        <span
          className="absolute inset-0 rounded-full border-[3px] border-dashed"
          style={{ borderColor: prestige > 0 ? tier.colorStrong : isDarkMode ? "#3f3f46" : "#cbd5e1" }}
          aria-hidden="true"
        />
      ) : null}

      <span
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-full",
          variant === "progress-halo" && "p-1",
          variant !== "progress-halo" && "p-[5px]",
        )}
        style={{
          boxShadow:
            variant === "inset-glow"
              ? `inset 0 0 0 3px ${tier.color}, inset 0 0 18px ${tier.glow}, 0 0 0 1px ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`
              : variant === "inner-ring"
                ? `inset 0 0 0 4px ${tier.color}, 0 0 0 1px ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`
                : `0 0 0 2px ${tier.color}, inset 0 0 0 1px ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`,
          background: isDarkMode ? "rgba(9,9,11,0.92)" : "rgba(255,255,255,0.92)",
        }}
      >
        <AppAvatar
          username={username}
          fullName={avatarLabel}
          size={size}
          interactive={false}
          enableBlink={false}
          showInitial={false}
          className={variant === "inset-glow" ? "saturate-[1.18]" : ""}
        />
        {variant === "inner-ring" || variant === "inset-glow" ? (
          <span
            className="pointer-events-none absolute inset-[6px] rounded-full"
            style={{
              boxShadow: `inset 0 0 0 ${variant === "inner-ring" ? 3 : 2}px ${tier.color}`,
            }}
            aria-hidden="true"
          />
        ) : null}
      </span>

      <span
        className={cn(
          "absolute -bottom-1.5 left-1/2 min-w-10 -translate-x-1/2 rounded-full border px-2 py-0.5 text-center text-[10px] font-black tracking-[0.12em]",
          isDarkMode ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-slate-200 bg-white text-slate-900",
        )}
        style={{ boxShadow: `0 8px 24px -18px ${tier.colorStrong}` }}
      >
        L{level}
      </span>

      <span
        className={cn(
          "absolute -right-2 top-1 rounded-full border px-1.5 py-0.5 text-[9px] font-black tracking-[0.12em]",
          prestige > 0
            ? "text-white"
            : isDarkMode
              ? "border-zinc-700 bg-zinc-900 text-zinc-500"
              : "border-slate-200 bg-slate-50 text-slate-400",
        )}
        style={prestige > 0 ? { background: `linear-gradient(135deg, ${tier.color}, ${tier.colorStrong})`, borderColor: tier.colorStrong } : undefined}
      >
        {prestigeMark}
      </span>
    </div>
  );
}
