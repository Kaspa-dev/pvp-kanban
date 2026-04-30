import type { CSSProperties } from "react";

import { Priority } from "../utils/cards";
import { getPriorityColor } from "../utils/priorityColors";

import "./PriorityAccent.css";

interface PriorityAccentProps {
  priority: Priority;
  isDarkMode?: boolean;
}

interface AccentConfig {
  variant: "segments" | "dots";
  width: string;
  top: string;
  bottom: string;
  left: string;
  segmentHeight: string;
  gap: string;
  dashTemplate: string;
  dotSize: string;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const safeHex = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  const red = Number.parseInt(safeHex.slice(0, 2), 16);
  const green = Number.parseInt(safeHex.slice(2, 4), 16);
  const blue = Number.parseInt(safeHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getAccentConfig(priority: Priority): AccentConfig {
  switch (priority) {
    case "low":
      return {
        variant: "segments",
        width: "3px",
        top: "12px",
        bottom: "12px",
        left: "8px",
        segmentHeight: "100%",
        gap: "2px",
        dashTemplate: "1fr 1fr 1fr 1fr 1fr 1fr",
        dotSize: "0px",
      };
    case "medium":
      return {
        variant: "segments",
        width: "4px",
        top: "12px",
        bottom: "12px",
        left: "8px",
        segmentHeight: "100%",
        gap: "4px",
        dashTemplate: "1fr 1fr 1fr",
        dotSize: "0px",
      };
    case "high":
      return {
        variant: "segments",
        width: "5px",
        top: "11px",
        bottom: "11px",
        left: "8px",
        segmentHeight: "100%",
        gap: "4px",
        dashTemplate: "1fr 1fr",
        dotSize: "0px",
      };
    case "critical":
      return {
        variant: "segments",
        width: "6px",
        top: "10px",
        bottom: "10px",
        left: "8px",
        segmentHeight: "100%",
        gap: "0px",
        dashTemplate: "1fr",
        dotSize: "0px",
      };
    default:
      return {
        variant: "segments",
        width: "3px",
        top: "12px",
        bottom: "12px",
        left: "8px",
        segmentHeight: "100%",
        gap: "2px",
        dashTemplate: "1fr 1fr 1fr 1fr 1fr 1fr",
        dotSize: "0px",
      };
  }
}

function getSegmentCount(priority: Priority) {
  switch (priority) {
    case "low":
      return 6;
    case "medium":
      return 3;
    case "high":
      return 2;
    case "critical":
      return 1;
    default:
      return 0;
  }
}

export function PriorityAccent({
  priority,
  isDarkMode = false,
}: PriorityAccentProps) {
  const accentColor = getPriorityColor(priority, isDarkMode);
  const config = getAccentConfig(priority);
  const segmentCount = getSegmentCount(priority);

  const style = {
    "--priority-accent-width": config.width,
    "--priority-accent-top": config.top,
    "--priority-accent-bottom": config.bottom,
    "--priority-accent-left": config.left,
    "--priority-accent-color": accentColor,
    "--priority-accent-shadow": hexToRgba(accentColor, isDarkMode ? 0.22 : 0.14),
    "--priority-accent-segment-height": config.segmentHeight,
    "--priority-accent-gap": config.gap,
    "--priority-accent-dash-template": config.dashTemplate,
    "--priority-accent-dot-size": config.dotSize,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`priority-accent priority-accent--${priority}`}
      style={style}
    >
      {config.variant === "dots" ? (
        <span className="priority-accent__dots" />
      ) : (
        <span className="priority-accent__segments">
          {Array.from({ length: segmentCount }).map((_, index) => (
            <span key={`${priority}-${index}`} className="priority-accent__segment" />
          ))}
        </span>
      )}
    </div>
  );
}
