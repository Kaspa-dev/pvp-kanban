import type { CSSProperties, ReactNode } from "react";
import { getLevelTier, type LevelMarkerVariant } from "../utils/levelBadges";
import { cn } from "./ui/utils";
import { renderLevelMarker } from "./RailCornersLevelFrame";

type NorthStarLevelFrameProps = {
  children: ReactNode;
  level: number;
  size: number;
  isDarkMode: boolean;
  className?: string;
  style?: CSSProperties;
  reserveShellSpace?: boolean;
  levelMarkerVariant?: LevelMarkerVariant;
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

export function NorthStarLevelFrame({
  children,
  level,
  size,
  isDarkMode,
  className,
  style,
  reserveShellSpace = false,
  levelMarkerVariant = "gradient-pill",
}: NorthStarLevelFrameProps) {
  const tier = getLevelTier(level);
  const scale = size / 74;
  const shellInset = Math.max(3, 8 * scale);
  const shellSize = size + shellInset * 2;
  const center = shellSize / 2;
  const outerRadius = center - Math.max(1.2, 3 * scale);
  const innerRadius = center - Math.max(3.6, 7.5 * scale);
  const innerCircumference = getCircumference(innerRadius);
  const trackColor = isDarkMode ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)";
  const shellColor = isDarkMode ? "#09090b" : "#ffffff";
  const starSize = Math.max(3.2, 4 * scale);
  const starAngles = [0, 90, 180, 270];
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
          stroke={trackColor}
          strokeWidth={Math.max(0.9, 1.8 * scale)}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth={Math.max(1.5, 2.4 * scale)}
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.2} ${innerCircumference * 0.3}`}
          transform={`rotate(-18 ${center} ${center})`}
        />
        {starAngles.map((angle) => {
          const point = polarToCartesian(center, outerRadius, angle);

          return (
            <rect
              key={`north-star-${angle}`}
              x={point.x - starSize}
              y={point.y - starSize}
              width={starSize * 2}
              height={starSize * 2}
              rx={Math.max(1.2, 1.8 * scale)}
              fill={angle % 180 === 0 ? tier.colorStrong : tier.color}
              stroke={shellColor}
              strokeWidth={Math.max(0.8, 1.2 * scale)}
              transform={`rotate(45 ${point.x} ${point.y})`}
            />
          );
        })}
      </svg>

      <span
        className="relative z-[1] inline-flex items-center justify-center rounded-full"
        style={{
          background: isDarkMode ? "rgba(9,9,11,0.88)" : "rgba(255,255,255,0.9)",
        }}
      >
        {children}
      </span>

      {renderLevelMarker({
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
      })}
    </span>
  );
}
