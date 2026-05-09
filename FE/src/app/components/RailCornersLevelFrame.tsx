/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties, ReactNode } from "react";
import { getLevelTier, type LevelMarkerVariant } from "../utils/levelBadges";
import { cn } from "./ui/utils";

type RailCornersLevelFrameProps = {
  children: ReactNode;
  level: number;
  size: number;
  isDarkMode: boolean;
  className?: string;
  style?: CSSProperties;
  reserveShellSpace?: boolean;
  levelMarkerVariant?: LevelMarkerVariant;
  showLevelMarker?: boolean;
};

export type LevelMarkerRenderInput = {
  level: number;
  variant: LevelMarkerVariant;
  tier: ReturnType<typeof getLevelTier>;
  scale: number;
  isDarkMode: boolean;
  chipTop: number;
  chipRight: number;
  chipHeight: number;
  chipMinWidth: number;
  chipFontSize: number;
  shellInset: number;
  reserveShellSpace: boolean;
};

export function renderLevelMarker({
  level,
  variant,
  tier,
  scale,
  isDarkMode,
  chipTop,
  chipRight,
  chipHeight,
  chipMinWidth,
  chipFontSize,
  shellInset,
  reserveShellSpace,
}: LevelMarkerRenderInput) {
  const commonStyle = {
    minWidth: chipMinWidth,
    height: chipHeight,
    paddingInline: Math.max(4, 6 * scale),
    fontSize: chipFontSize,
    background: `linear-gradient(135deg, ${tier.color}, ${tier.colorStrong})`,
    borderColor: "rgba(255,255,255,0.55)",
    boxShadow: `0 8px 18px -12px ${tier.colorStrong}, inset 0 1px 0 rgba(255,255,255,0.35)`,
    letterSpacing: "-0.03em",
    textShadow: "0 1px 1px rgba(15,23,42,0.38)",
  } satisfies CSSProperties;
  const baseClassName = "pointer-events-none absolute z-[2] inline-flex items-center justify-center border font-bold leading-none text-white tabular-nums";

  if (variant === "data-plate") {
    return (
      <span
        className={cn(baseClassName, "rounded-md")}
        style={{
          ...commonStyle,
          top: chipTop + 2 * scale,
          right: chipRight,
          borderRadius: 6 * scale,
          background: isDarkMode ? "rgba(15,23,42,0.96)" : "rgba(248,250,252,0.98)",
          color: tier.colorStrong,
          borderColor: tier.colorStrong,
          boxShadow: `inset 0 0 0 1px ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
          textShadow: "none",
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  if (variant === "notched-ticket") {
    return (
      <span
        className={cn(baseClassName, "rounded-sm")}
        style={{
          ...commonStyle,
          top: chipTop,
          right: chipRight,
          clipPath: "polygon(10% 0, 90% 0, 100% 28%, 100% 72%, 90% 100%, 10% 100%, 0 72%, 0 28%)",
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  if (variant === "glass-lozenge") {
    return (
      <span
        className={cn(baseClassName, "rounded-full")}
        style={{
          ...commonStyle,
          top: chipTop,
          right: chipRight,
          background: isDarkMode ? "rgba(148,163,184,0.36)" : "rgba(255,255,255,0.72)",
          color: isDarkMode ? "#ffffff" : tier.colorStrong,
          backdropFilter: "blur(8px)",
          borderColor: isDarkMode ? "rgba(255,255,255,0.42)" : "rgba(15,23,42,0.18)",
          textShadow: isDarkMode ? "0 1px 1px rgba(15,23,42,0.42)" : "none",
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  if (variant === "diamond-pin") {
    const diamondSize = Math.max(23, 32 * scale);
    return (
      <span
        className={cn(baseClassName, "rounded-md")}
        style={{
          top: chipTop - 1 * scale,
          right: chipRight + 2 * scale,
          width: diamondSize,
          height: diamondSize,
          paddingInline: 0,
          fontSize: chipFontSize,
          background: `linear-gradient(135deg, ${tier.color}, ${tier.colorStrong})`,
          borderColor: "rgba(255,255,255,0.58)",
          boxShadow: `0 8px 18px -12px ${tier.colorStrong}, inset 0 1px 0 rgba(255,255,255,0.35)`,
          transform: "rotate(45deg)",
          textShadow: "0 1px 1px rgba(15,23,42,0.38)",
        }}
        aria-hidden="true"
      >
        <span style={{ transform: "rotate(-45deg)" }}>{level}</span>
      </span>
    );
  }

  if (variant === "corner-flag") {
    return (
      <span
        className={cn(baseClassName, "rounded-tl-lg rounded-br-lg")}
        style={{
          ...commonStyle,
          top: chipTop - 2 * scale,
          right: chipRight - 1 * scale,
          borderTopRightRadius: 2 * scale,
          background: `linear-gradient(160deg, ${tier.colorStrong}, ${tier.color})`,
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  if (variant === "orbit-dot") {
    const dotSize = Math.max(20, 28 * scale);
    return (
      <span
        className={cn(baseClassName, "rounded-full")}
        style={{
          top: chipTop - 4 * scale,
          right: chipRight - 6 * scale,
          width: dotSize,
          height: dotSize,
          minWidth: dotSize,
          paddingInline: 0,
          fontSize: chipFontSize,
          background: `linear-gradient(135deg, ${tier.color}, ${tier.colorStrong})`,
          borderColor: isDarkMode ? "rgba(9,9,11,0.95)" : "rgba(255,255,255,0.95)",
          boxShadow: `0 0 0 ${Math.max(1, 2 * scale)}px ${tier.colorStrong}, 0 8px 18px -12px ${tier.colorStrong}`,
          textShadow: "0 1px 1px rgba(15,23,42,0.38)",
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  if (variant === "bracket-tag") {
    return (
      <span
        className={cn(baseClassName, "rounded-md")}
        style={{
          ...commonStyle,
          top: chipTop,
          right: chipRight,
          background: isDarkMode ? "rgba(9,9,11,0.92)" : "rgba(255,255,255,0.96)",
          color: tier.colorStrong,
          borderColor: tier.colorStrong,
          boxShadow: `-4px 0 0 -2px ${tier.color}, 4px 0 0 -2px ${tier.color}, inset 0 1px 0 rgba(255,255,255,0.25)`,
          textShadow: "none",
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  if (variant === "bottom-dock") {
    return (
      <span
        className={cn(baseClassName, "rounded-full")}
        style={{
          ...commonStyle,
          left: "50%",
          bottom: reserveShellSpace ? -4 * scale : -4 * scale - shellInset,
          transform: "translateX(-50%)",
          minWidth: Math.max(24, 36 * scale),
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  if (variant === "vertical-tab") {
    return (
      <span
        className={cn(baseClassName, "rounded-full")}
        style={{
          ...commonStyle,
          top: "50%",
          right: reserveShellSpace ? -7 * scale : -7 * scale - shellInset,
          transform: "translateY(-50%)",
          minWidth: Math.max(18, 23 * scale),
          height: Math.max(24, 34 * scale),
          paddingInline: Math.max(3, 4 * scale),
          borderRadius: 999,
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    );
  }

  return (
    <span
      className={cn(baseClassName, "rounded-full")}
      style={{
        ...commonStyle,
        top: chipTop,
        right: chipRight,
      }}
      aria-hidden="true"
    >
      {level}
    </span>
  );
}

export function RailCornersLevelFrame({
  children,
  level,
  size,
  isDarkMode,
  className,
  style,
  reserveShellSpace = false,
  levelMarkerVariant = "gradient-pill",
  showLevelMarker = true,
}: RailCornersLevelFrameProps) {
  const tier = getLevelTier(level);
  const scale = size / 74;
  const shellInset = Math.max(3, 8 * scale);
  const shellSize = size + shellInset * 2;
  const center = shellSize / 2;
  const innerRadius = center - Math.max(3.6, 8.5 * scale);
  const frameInset = Math.max(2.4, 4.5 * scale);
  const cornerRail = Math.max(10, 22 * scale);
  const cornerBend = Math.max(4, 8 * scale);
  const strokeWidth = Math.max(1.7, 4 * scale);
  const trackStrokeWidth = Math.max(0.9, 1.4 * scale);
  const trackColor = isDarkMode ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)";
  const chipTopOffset = 4 * scale;
  const chipRightOffset = -8 * scale;
  const chipTop = reserveShellSpace ? chipTopOffset : chipTopOffset - shellInset;
  const chipRight = reserveShellSpace ? chipRightOffset : chipRightOffset - shellInset;
  const chipHeight = Math.max(13, 20 * scale);
  const chipMinWidth = Math.max(22, 32 * scale);
  const chipFontSize = Math.max(9, 11 * scale);

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-full", className)}
      style={{
        width: reserveShellSpace ? shellSize : size,
        height: reserveShellSpace ? shellSize : size,
        ...style,
      }}
    >
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 overflow-visible"
        style={{
          width: shellSize,
          height: shellSize,
          transform: "translate(-50%, -50%)",
          filter: `drop-shadow(0 0 ${Math.max(5, size * 0.12)}px ${tier.glow})`,
        }}
        viewBox={`0 0 ${shellSize} ${shellSize}`}
        aria-hidden="true"
      >
        <path
          d={`M ${frameInset + cornerRail} ${frameInset} H ${frameInset + cornerBend} Q ${frameInset} ${frameInset} ${frameInset} ${frameInset + cornerBend} V ${frameInset + cornerRail}`}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${shellSize - frameInset - cornerRail} ${frameInset} H ${shellSize - frameInset - cornerBend} Q ${shellSize - frameInset} ${frameInset} ${shellSize - frameInset} ${frameInset + cornerBend} V ${frameInset + cornerRail}`}
          fill="none"
          stroke={tier.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${frameInset + cornerRail} ${shellSize - frameInset} H ${frameInset + cornerBend} Q ${frameInset} ${shellSize - frameInset} ${frameInset} ${shellSize - frameInset - cornerBend} V ${shellSize - frameInset - cornerRail}`}
          fill="none"
          stroke={tier.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${shellSize - frameInset - cornerRail} ${shellSize - frameInset} H ${shellSize - frameInset - cornerBend} Q ${shellSize - frameInset} ${shellSize - frameInset} ${shellSize - frameInset} ${shellSize - frameInset - cornerBend} V ${shellSize - frameInset - cornerRail}`}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={trackColor} strokeWidth={trackStrokeWidth} />
      </svg>

      <span
        className="relative z-[1] inline-flex items-center justify-center rounded-full"
        style={{
          background: isDarkMode ? "rgba(9,9,11,0.88)" : "rgba(255,255,255,0.9)",
        }}
      >
        {children}
      </span>

      {showLevelMarker ? renderLevelMarker({
        level,
        variant: levelMarkerVariant,
        tier,
        scale,
        isDarkMode,
        chipTop,
        chipRight,
        chipHeight,
        chipMinWidth,
        chipFontSize,
        shellInset,
        reserveShellSpace,
      }) : null}
    </span>
  );
}
