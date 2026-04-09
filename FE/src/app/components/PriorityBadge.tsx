import { Priority } from "../utils/cards";
import { getPriorityColor, PRIORITY_COLORS } from "../utils/priorityColors";
import { PriorityIcon } from "./PriorityIcon";

interface PriorityBadgeProps {
  priority: Priority;
  isDarkMode?: boolean;
  compact?: boolean;
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
}: PriorityBadgeProps) {
  const color = getPriorityColor(priority, isDarkMode);
  const label = PRIORITY_COLORS[priority].label;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${
        compact ? "gap-1.5 px-2.5 py-1 text-[11px]" : "gap-1.5 px-2.5 py-1 text-xs"
      }`}
      style={{
        color,
        backgroundColor: hexToRgba(color, isDarkMode ? 0.18 : 0.12),
        borderColor: hexToRgba(color, isDarkMode ? 0.3 : 0.2),
      }}
    >
      <PriorityIcon priority={priority} isDarkMode={isDarkMode} className="h-3.5 w-3.5" />
      <span>{label}</span>
    </span>
  );
}
