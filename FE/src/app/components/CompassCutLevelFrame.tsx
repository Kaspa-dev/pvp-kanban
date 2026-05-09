import type { CSSProperties, ReactNode } from "react";
import { getLevelTier } from "../utils/levelBadges";
import { cn } from "./ui/utils";

type CompassCutLevelFrameProps = {
  children: ReactNode;
  level: number;
  size: number;
  isDarkMode: boolean;
  className?: string;
  style?: CSSProperties;
  reserveShellSpace?: boolean;
};

function getCircumference(radius: number) {
  return 2 * Math.PI * radius;
}

function polarToCartesian(center: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

export function CompassCutLevelFrame({
  children,
  level,
  size,
  isDarkMode,
  className,
  style,
  reserveShellSpace = false,
}: CompassCutLevelFrameProps) {
  const tier = getLevelTier(level);
  const scale = size / 74;
  const shellInset = Math.max(3, 8 * scale);
  const shellSize = size + shellInset * 2;
  const center = shellSize / 2;
  const outerRadius = center - Math.max(1.2, 3 * scale);
  const innerRadius = center - Math.max(3.6, 8.5 * scale);
  const outerCircumference = getCircumference(outerRadius);
  const shellColor = isDarkMode ? "#09090b" : "#ffffff";
  const trackColor = isDarkMode ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)";
  const ringStrokeWidth = Math.max(1.6, 3.6 * scale);
  const trackStrokeWidth = Math.max(0.9, 1.8 * scale);
  const cutSize = Math.max(2, 4 * scale);
  const cutStrokeWidth = Math.max(0.75, 1.6 * scale);
  const cutPoints = [0, 90, 180, 270].map((angle) => polarToCartesian(center, outerRadius + 0.2, angle));
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
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth={ringStrokeWidth}
          strokeDasharray={`${outerCircumference * 0.18} ${outerCircumference * 0.07}`}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={trackStrokeWidth}
        />
        {cutPoints.map((point, index) => (
          <rect
            key={`compass-cut-${index}`}
            x={point.x - cutSize}
            y={point.y - cutSize}
            width={cutSize * 2}
            height={cutSize * 2}
            rx={Math.max(1.2, 2 * scale)}
            fill={shellColor}
            stroke={index % 2 === 0 ? tier.colorStrong : tier.color}
            strokeWidth={cutStrokeWidth}
            transform={`rotate(45 ${point.x} ${point.y})`}
          />
        ))}
      </svg>

      <span
        className="relative z-[1] inline-flex items-center justify-center rounded-full"
        style={{
          background: isDarkMode ? "rgba(9,9,11,0.88)" : "rgba(255,255,255,0.9)",
        }}
      >
        {children}
      </span>

      <span
        className="pointer-events-none absolute z-[2] inline-flex items-center justify-center rounded-full border font-bold leading-none text-white tabular-nums"
        style={{
          top: chipTop,
          right: chipRight,
          minWidth: chipMinWidth,
          height: chipHeight,
          paddingInline: Math.max(4, 6 * scale),
          fontSize: chipFontSize,
          background: `linear-gradient(135deg, ${tier.color}, ${tier.colorStrong})`,
          borderColor: "rgba(255,255,255,0.55)",
          boxShadow: `0 8px 18px -12px ${tier.colorStrong}, inset 0 1px 0 rgba(255,255,255,0.35)`,
          letterSpacing: "-0.03em",
          textShadow: "0 1px 1px rgba(15,23,42,0.38)",
        }}
        aria-hidden="true"
      >
        {level}
      </span>
    </span>
  );
}
