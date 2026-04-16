import { Priority } from "../utils/cards";
import { getPriorityColor, PRIORITY_COLORS } from "../utils/priorityColors";
import { PriorityIcon } from "./PriorityIcon";

interface PriorityBadgeProps {
  priority: Priority;
  isDarkMode?: boolean;
  compact?: boolean;
  variant?: "card" | "table";
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

export function PriorityBadge({
  priority,
  isDarkMode = false,
  compact = false,
  variant,
}: PriorityBadgeProps) {
  const color = getPriorityColor(priority, isDarkMode);
  const label = PRIORITY_COLORS[priority].label;
  const resolvedVariant = variant ?? (compact ? "table" : "card");
  const isTableVariant = resolvedVariant === "table";
  const textColor = isDarkMode && priority === "critical" ? "#e2e8f0" : color;
  const backgroundAlpha = isTableVariant
    ? (isDarkMode ? 0.08 : 0.045)
    : (isDarkMode ? 0.12 : 0.07);
  const borderAlpha = isTableVariant
    ? (isDarkMode ? 0.24 : 0.16)
    : (isDarkMode ? 0.28 : 0.2);

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border font-medium leading-none ${
        isTableVariant
          ? "h-6 gap-1.5 rounded-md px-2.5 text-[11px] tracking-[0.01em]"
          : "h-7 gap-1.5 rounded-lg px-2.5 text-xs tracking-[0.01em]"
      }`}
      style={{
        color: textColor,
        backgroundColor: hexToRgba(color, backgroundAlpha),
        borderColor: hexToRgba(color, borderAlpha),
      }}
    >
      <PriorityIcon
        priority={priority}
        isDarkMode={isDarkMode}
        className={isTableVariant ? "h-3.5 w-3.5" : "h-3.5 w-3.5"}
        colorOverride={textColor}
      />
      <span>{label}</span>
    </span>
  );
}
