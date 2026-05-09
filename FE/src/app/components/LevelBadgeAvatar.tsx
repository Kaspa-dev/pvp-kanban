/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties, ReactNode } from "react";
import { AppAvatar } from "./AppAvatar";
import { CompassCutLevelFrame } from "./CompassCutLevelFrame";
import { RailCornersLevelFrame } from "./RailCornersLevelFrame";
import { cn } from "./ui/utils";
import {
  getLevelTier,
  LEVEL_BADGE_VARIANTS,
  LEVEL_TIERS,
  type LevelBadgeVariant,
  type LevelTier,
} from "../utils/levelBadges";

export {
  getLevelTier,
  LEVEL_BADGE_VARIANTS,
  LEVEL_TIERS,
  type LevelBadgeVariant,
  type LevelTier,
};

type LevelBadgeAvatarProps = {
  username: string;
  level: number;
  variant: LevelBadgeVariant;
  size?: number;
  isDarkMode?: boolean;
  className?: string;
};

type RingGeometry = {
  shellSize: number;
  center: number;
  outerRadius: number;
  innerRadius: number;
  outerCircumference: number;
  innerCircumference: number;
  trackColor: string;
  quietTrackColor: string;
  shellColor: string;
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

function renderRingVariant(variant: LevelBadgeVariant, tier: LevelTier, geometry: RingGeometry): ReactNode {
  const {
    shellSize,
    center,
    outerRadius,
    innerRadius,
    outerCircumference,
    innerCircumference,
    trackColor,
    quietTrackColor,
    shellColor,
  } = geometry;

  if (variant === "wide-break") {
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={quietTrackColor} strokeWidth="2" />
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.22} ${outerCircumference * 0.28} ${outerCircumference * 0.22} ${outerCircumference * 0.28}`}
          transform={`rotate(-28 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={tier.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.42} ${innerCircumference * 0.58}`}
          transform={`rotate(108 ${center} ${center})`}
        />
      </>
    );
  }

  if (variant === "open-gates") {
    const gateAngles = [0, 90, 180, 270];
    return (
      <>
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={trackColor} strokeWidth="1.5" />
        {gateAngles.map((angle) => {
          const start = polarToCartesian(center, outerRadius, angle - 11);
          const end = polarToCartesian(center, outerRadius, angle + 11);
          return (
            <path
              key={`gate-${angle}`}
              d={`M ${start.x} ${start.y} A ${outerRadius} ${outerRadius} 0 0 1 ${end.x} ${end.y}`}
              fill="none"
              stroke={angle % 180 === 0 ? tier.colorStrong : tier.color}
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}
      </>
    );
  }

  if (variant === "orbit-nodes") {
    const nodeAngles = [32, 128, 212, 308];
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={quietTrackColor} strokeWidth="2.2" />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={tier.color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.18} ${innerCircumference * 0.08}`}
          transform={`rotate(10 ${center} ${center})`}
        />
        {nodeAngles.map((angle) => {
          const point = polarToCartesian(center, outerRadius, angle);
          return (
            <circle
              key={`node-${angle}`}
              cx={point.x}
              cy={point.y}
              r="4.1"
              fill={tier.colorStrong}
              stroke={shellColor}
              strokeWidth="1.8"
            />
          );
        })}
      </>
    );
  }

  if (variant === "corner-clamps") {
    const inset = 5;
    const clamp = 21;
    const short = 10;
    return (
      <>
        <path d={`M ${center - short} ${inset} H ${inset + clamp} Q ${inset} ${inset} ${inset} ${inset + clamp} V ${center - short}`} fill="none" stroke={tier.colorStrong} strokeWidth="4.4" strokeLinecap="round" />
        <path d={`M ${center + short} ${inset} H ${shellSize - inset - clamp} Q ${shellSize - inset} ${inset} ${shellSize - inset} ${inset + clamp} V ${center - short}`} fill="none" stroke={tier.colorStrong} strokeWidth="4.4" strokeLinecap="round" />
        <path d={`M ${center - short} ${shellSize - inset} H ${inset + clamp} Q ${inset} ${shellSize - inset} ${inset} ${shellSize - inset - clamp} V ${center + short}`} fill="none" stroke={tier.color} strokeWidth="4.4" strokeLinecap="round" />
        <path d={`M ${center + short} ${shellSize - inset} H ${shellSize - inset - clamp} Q ${shellSize - inset} ${shellSize - inset} ${shellSize - inset} ${shellSize - inset - clamp} V ${center + short}`} fill="none" stroke={tier.color} strokeWidth="4.4" strokeLinecap="round" />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.5" />
      </>
    );
  }

  if (variant === "bracket-tabs") {
    const tabWidth = 20;
    const tabHeight = 7;
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={trackColor} strokeWidth="2" />
        <rect x={center - tabWidth / 2} y="1" width={tabWidth} height={tabHeight} rx="3.5" fill={tier.colorStrong} stroke={shellColor} strokeWidth="1.3" />
        <rect x={center - tabWidth / 2} y={shellSize - tabHeight - 1} width={tabWidth} height={tabHeight} rx="3.5" fill={tier.colorStrong} stroke={shellColor} strokeWidth="1.3" />
        <rect x="1" y={center - tabWidth / 2} width={tabHeight} height={tabWidth} rx="3.5" fill={tier.color} stroke={shellColor} strokeWidth="1.3" />
        <rect x={shellSize - tabHeight - 1} y={center - tabWidth / 2} width={tabHeight} height={tabWidth} rx="3.5" fill={tier.color} stroke={shellColor} strokeWidth="1.3" />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={tier.color} strokeWidth="1.9" />
      </>
    );
  }

  if (variant === "dash-track") {
    return (
      <>
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={quietTrackColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="2 6"
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.54} ${innerCircumference * 0.46}`}
          transform={`rotate(-118 ${center} ${center})`}
        />
      </>
    );
  }

  if (variant === "echelon") {
    return (
      <>
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.2} ${outerCircumference * 0.12} ${outerCircumference * 0.1} ${outerCircumference * 0.58}`}
          transform={`rotate(-55 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius - 5}
          fill="none"
          stroke={tier.color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.28} ${outerCircumference * 0.72}`}
          transform={`rotate(82 ${center} ${center})`}
        />
        <circle cx={center} cy={center} r={innerRadius - 2} fill="none" stroke={quietTrackColor} strokeWidth="1.5" />
      </>
    );
  }

  if (variant === "compass-cut") {
    const diamondSize = 4.5;
    const points = [0, 90, 180, 270].map((angle) => polarToCartesian(center, outerRadius + 0.2, angle));
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={tier.colorStrong} strokeWidth="3.6" strokeDasharray={`${outerCircumference * 0.18} ${outerCircumference * 0.07}`} />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={trackColor} strokeWidth="1.8" />
        {points.map((point, index) => (
          <rect
            key={`cut-${index}`}
            x={point.x - diamondSize}
            y={point.y - diamondSize}
            width={diamondSize * 2}
            height={diamondSize * 2}
            rx="2"
            fill={shellColor}
            stroke={index % 2 === 0 ? tier.colorStrong : tier.color}
            strokeWidth="1.6"
            transform={`rotate(45 ${point.x} ${point.y})`}
          />
        ))}
      </>
    );
  }

  if (variant === "offset-rails") {
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.5" />
        <circle
          cx={center}
          cy={center}
          r={outerRadius - 1}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.34} ${outerCircumference * 0.66}`}
          transform={`rotate(-78 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={tier.color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.3} ${innerCircumference * 0.7}`}
          transform={`rotate(104 ${center} ${center})`}
        />
      </>
    );
  }

  if (variant === "crown-gaps") {
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={quietTrackColor} strokeWidth="2" />
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.2} ${outerCircumference * 0.12} ${outerCircumference * 0.2} ${outerCircumference * 0.48}`}
          transform={`rotate(-84 ${center} ${center})`}
        />
        {[-12, 0, 12].map((offset) => (
          <rect
            key={`crown-${offset}`}
            x={center + offset - 2.6}
            y="1.5"
            width="5.2"
            height={offset === 0 ? 10 : 7}
            rx="2.6"
            fill={offset === 0 ? tier.colorStrong : tier.color}
            stroke={shellColor}
            strokeWidth="1"
          />
        ))}
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={tier.color} strokeWidth="1.7" />
      </>
    );
  }

  if (variant === "lunar-bars") {
    return (
      <>
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.6" />
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.18} ${outerCircumference * 0.32} ${outerCircumference * 0.18} ${outerCircumference * 0.32}`}
          transform={`rotate(0 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius + 2}
          fill="none"
          stroke={tier.color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.18} ${innerCircumference * 0.32} ${innerCircumference * 0.18} ${innerCircumference * 0.32}`}
          transform={`rotate(180 ${center} ${center})`}
        />
      </>
    );
  }

  if (variant === "pinwheel") {
    const bladeAngles = [16, 106, 196, 286];
    return (
      <>
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.5" />
        {bladeAngles.map((angle, index) => (
          <circle
            key={`blade-${angle}`}
            cx={center}
            cy={center}
            r={index % 2 === 0 ? outerRadius : outerRadius - 3}
            fill="none"
            stroke={index % 2 === 0 ? tier.colorStrong : tier.color}
            strokeWidth={index % 2 === 0 ? "4.8" : "3.4"}
            strokeLinecap="round"
            strokeDasharray={`${outerCircumference * 0.13} ${outerCircumference * 0.87}`}
            transform={`rotate(${angle} ${center} ${center})`}
          />
        ))}
      </>
    );
  }

  if (variant === "rail-corners") {
    const rail = 22;
    const inset = 4.5;
    return (
      <>
        <path d={`M ${inset + rail} ${inset} H ${inset + 8} Q ${inset} ${inset} ${inset} ${inset + 8} V ${inset + rail}`} fill="none" stroke={tier.colorStrong} strokeWidth="4" strokeLinecap="round" />
        <path d={`M ${shellSize - inset - rail} ${inset} H ${shellSize - inset - 8} Q ${shellSize - inset} ${inset} ${shellSize - inset} ${inset + 8} V ${inset + rail}`} fill="none" stroke={tier.color} strokeWidth="4" strokeLinecap="round" />
        <path d={`M ${inset + rail} ${shellSize - inset} H ${inset + 8} Q ${inset} ${shellSize - inset} ${inset} ${shellSize - inset - 8} V ${shellSize - inset - rail}`} fill="none" stroke={tier.color} strokeWidth="4" strokeLinecap="round" />
        <path d={`M ${shellSize - inset - rail} ${shellSize - inset} H ${shellSize - inset - 8} Q ${shellSize - inset} ${shellSize - inset} ${shellSize - inset} ${shellSize - inset - 8} V ${shellSize - inset - rail}`} fill="none" stroke={tier.colorStrong} strokeWidth="4" strokeLinecap="round" />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={trackColor} strokeWidth="1.4" />
      </>
    );
  }

  if (variant === "signal-pips") {
    const pipAngles = [35, 58, 81, 104];
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={trackColor} strokeWidth="1.8" />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="3.1"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.5} ${innerCircumference * 0.5}`}
          transform={`rotate(132 ${center} ${center})`}
        />
        {pipAngles.map((angle, index) => {
          const point = polarToCartesian(center, outerRadius + 0.4, angle);
          return (
            <circle
              key={`pip-${angle}`}
              cx={point.x}
              cy={point.y}
              r={2.2 + index * 0.35}
              fill={index > 1 ? tier.colorStrong : tier.color}
              stroke={shellColor}
              strokeWidth="1.1"
            />
          );
        })}
      </>
    );
  }

  if (variant === "visor") {
    return (
      <>
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.4" />
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.26} ${outerCircumference * 0.24} ${outerCircumference * 0.26} ${outerCircumference * 0.24}`}
          transform={`rotate(45 ${center} ${center})`}
        />
        <path d={`M ${center - 24} ${center} H ${center - 14}`} stroke={tier.color} strokeWidth="3" strokeLinecap="round" />
        <path d={`M ${center + 14} ${center} H ${center + 24}`} stroke={tier.color} strokeWidth="3" strokeLinecap="round" />
      </>
    );
  }

  if (variant === "halo-slices") {
    return (
      <>
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 7"
          transform={`rotate(4 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.24} ${outerCircumference * 0.76}`}
          transform={`rotate(-38 ${center} ${center})`}
        />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.4" />
      </>
    );
  }

  if (variant === "offset-square") {
    const rectInset = 6;
    return (
      <>
        <rect
          x={rectInset}
          y={rectInset + 1.5}
          width={shellSize - rectInset * 2}
          height={shellSize - rectInset * 2}
          rx="18"
          fill="none"
          stroke={quietTrackColor}
          strokeWidth="2"
        />
        <path d={`M ${rectInset + 11} ${rectInset + 1.5} H ${center - 7}`} stroke={tier.colorStrong} strokeWidth="4.5" strokeLinecap="round" />
        <path d={`M ${center + 8} ${shellSize - rectInset + 1.5} H ${shellSize - rectInset - 12}`} stroke={tier.colorStrong} strokeWidth="4.5" strokeLinecap="round" />
        <path d={`M ${rectInset} ${center + 7} V ${shellSize - rectInset - 12}`} stroke={tier.color} strokeWidth="3.5" strokeLinecap="round" />
        <path d={`M ${shellSize - rectInset} ${rectInset + 12} V ${center - 7}`} stroke={tier.color} strokeWidth="3.5" strokeLinecap="round" />
      </>
    );
  }

  if (variant === "double-bite") {
    const biteAngles = [70, 250];
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={tier.colorStrong} strokeWidth="4.7" />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={tier.color} strokeWidth="2" />
        {biteAngles.map((angle) => {
          const point = polarToCartesian(center, outerRadius, angle);
          return (
            <circle
              key={`bite-${angle}`}
              cx={point.x}
              cy={point.y}
              r="7.2"
              fill={shellColor}
              stroke={quietTrackColor}
              strokeWidth="1"
            />
          );
        })}
      </>
    );
  }

  if (variant === "north-star") {
    const starAngles = [0, 90, 180, 270];
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={trackColor} strokeWidth="1.8" />
        <circle
          cx={center}
          cy={center}
          r={innerRadius + 1}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.2} ${innerCircumference * 0.3}`}
          transform={`rotate(-18 ${center} ${center})`}
        />
        {starAngles.map((angle) => {
          const point = polarToCartesian(center, outerRadius, angle);
          return (
            <rect
              key={`star-${angle}`}
              x={point.x - 4}
              y={point.y - 4}
              width="8"
              height="8"
              rx="1.8"
              fill={angle % 180 === 0 ? tier.colorStrong : tier.color}
              stroke={shellColor}
              strokeWidth="1.2"
              transform={`rotate(45 ${point.x} ${point.y})`}
            />
          );
        })}
      </>
    );
  }

  if (variant === "rivet-ring") {
    const rivetAngles = [20, 65, 110, 155, 205, 250, 295, 340];
    return (
      <>
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.6" />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * 0.16} ${innerCircumference * 0.18}`}
          transform={`rotate(22 ${center} ${center})`}
        />
        {rivetAngles.map((angle) => {
          const point = polarToCartesian(center, outerRadius, angle);
          return (
            <circle key={`rivet-${angle}`} cx={point.x} cy={point.y} r="2.2" fill={tier.color} stroke={shellColor} strokeWidth="1" />
          );
        })}
      </>
    );
  }

  if (variant === "wave-arc") {
    return (
      <>
        <path
          d={`M ${center - 30} ${center - 25} C ${center - 16} ${center - 37}, ${center + 14} ${center - 13}, ${center + 30} ${center - 25}`}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d={`M ${center - 30} ${center + 25} C ${center - 14} ${center + 12}, ${center + 16} ${center + 37}, ${center + 30} ${center + 25}`}
          fill="none"
          stroke={tier.color}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.5" />
      </>
    );
  }

  if (variant === "split-bands") {
    return (
      <>
        {[-14, -5, 5, 14].map((offset, index) => (
          <path
            key={`band-left-${offset}`}
            d={`M ${center - 36} ${center + offset} H ${center - 25}`}
            stroke={index % 2 === 0 ? tier.colorStrong : tier.color}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
        {[-14, -5, 5, 14].map((offset, index) => (
          <path
            key={`band-right-${offset}`}
            d={`M ${center + 25} ${center + offset} H ${center + 36}`}
            stroke={index % 2 === 0 ? tier.color : tier.colorStrong}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.5" />
      </>
    );
  }

  if (variant === "thin-keel") {
    return (
      <>
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={tier.colorStrong}
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * 0.46} ${outerCircumference * 0.54}`}
          transform={`rotate(-84 ${center} ${center})`}
        />
        <path
          d={`M ${center - 14} ${shellSize - 7} L ${center} ${shellSize - 1.5} L ${center + 14} ${shellSize - 7}`}
          fill="none"
          stroke={tier.color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={trackColor} strokeWidth="1.4" />
      </>
    );
  }

  if (variant === "orbital-brackets") {
    const bracketAngles = [22, 112, 202, 292];
    return (
      <>
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke={quietTrackColor} strokeWidth="1.4" />
        {bracketAngles.map((angle, index) => (
          <circle
            key={`orbital-bracket-${angle}`}
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke={index % 2 === 0 ? tier.colorStrong : tier.color}
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeDasharray={`${outerCircumference * 0.09} ${outerCircumference * 0.91}`}
            transform={`rotate(${angle} ${center} ${center})`}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <circle cx={center} cy={center} r={outerRadius} fill="none" stroke={quietTrackColor} strokeWidth="2" />
      <circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill="none"
        stroke={tier.colorStrong}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeDasharray={`${outerCircumference * 0.28} ${outerCircumference * 0.22} ${outerCircumference * 0.18} ${outerCircumference * 0.32}`}
        transform={`rotate(-48 ${center} ${center})`}
      />
      <circle
        cx={center}
        cy={center}
        r={innerRadius}
        fill="none"
        stroke={tier.color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeDasharray={`${innerCircumference * 0.34} ${innerCircumference * 0.12} ${innerCircumference * 0.18} ${innerCircumference * 0.36}`}
        transform={`rotate(58 ${center} ${center})`}
      />
    </>
  );
}

export function LevelBadgeAvatar({
  username,
  level,
  variant,
  size = 72,
  isDarkMode = false,
  className,
}: LevelBadgeAvatarProps) {
  const tier = getLevelTier(level);
  const shellSize = size + 16;
  const center = shellSize / 2;
  const outerRadius = center - 3;
  const innerRadius = center - 8.5;
  const geometry: RingGeometry = {
    shellSize,
    center,
    outerRadius,
    innerRadius,
    outerCircumference: getCircumference(outerRadius),
    innerCircumference: getCircumference(innerRadius),
    trackColor: isDarkMode ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)",
    quietTrackColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
    shellColor: isDarkMode ? "#09090b" : "#ffffff",
  };
  const variantLabel = LEVEL_BADGE_VARIANTS.find((item) => item.key === variant)?.label ?? "Ring variant";

  if (variant === "compass-cut") {
    return (
      <CompassCutLevelFrame
        level={level}
        size={size}
        isDarkMode={isDarkMode}
        reserveShellSpace
        className={cn(isDarkMode ? "bg-zinc-950" : "bg-white", className)}
        style={{
          "--level-color": tier.color,
          "--level-color-strong": tier.colorStrong,
          "--level-glow": tier.glow,
        } as CSSProperties}
      >
        <AppAvatar
          username={username}
          fullName={`${username}, level ${level}`}
          size={size}
          interactive={false}
          enableBlink={false}
          showInitial={false}
        />
      </CompassCutLevelFrame>
    );
  }

  if (variant === "rail-corners") {
    return (
      <RailCornersLevelFrame
        level={level}
        size={size}
        isDarkMode={isDarkMode}
        reserveShellSpace
        className={cn(isDarkMode ? "bg-zinc-950" : "bg-white", className)}
        style={{
          "--level-color": tier.color,
          "--level-color-strong": tier.colorStrong,
          "--level-glow": tier.glow,
        } as CSSProperties}
      >
        <AppAvatar
          username={username}
          fullName={`${username}, level ${level}`}
          size={size}
          interactive={false}
          enableBlink={false}
          showInitial={false}
        />
      </RailCornersLevelFrame>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-visible rounded-full",
        isDarkMode ? "bg-zinc-950" : "bg-white",
        className,
      )}
      style={{
        width: shellSize,
        height: shellSize,
        "--level-color": tier.color,
        "--level-color-strong": tier.colorStrong,
        "--level-glow": tier.glow,
      } as CSSProperties}
      role="group"
      aria-label={`${username}, level ${level}, ${variantLabel}`}
    >
      <svg
        className="pointer-events-none absolute inset-0 overflow-visible"
        viewBox={`0 0 ${shellSize} ${shellSize}`}
        aria-hidden="true"
      >
        {renderRingVariant(variant, tier, geometry)}
      </svg>

      <span
        className="relative z-[1] inline-flex items-center justify-center rounded-full p-[5px]"
        style={{
          background: isDarkMode ? "rgba(9,9,11,0.88)" : "rgba(255,255,255,0.9)",
          boxShadow: `0 0 0 1px ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)"}`,
        }}
      >
        <AppAvatar
          username={username}
          fullName={`${username}, level ${level}`}
          size={size}
          interactive={false}
          enableBlink={false}
          showInitial={false}
        />
      </span>

      <span
        className="pointer-events-none absolute -right-2 top-1 z-[2] inline-flex h-5 min-w-8 items-center justify-center rounded-full border px-1.5 text-[11px] font-bold leading-none text-white tabular-nums"
        style={{
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
