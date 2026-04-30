import { Priority } from "../utils/cards";
import { getPriorityColor, PRIORITY_COLORS } from "../utils/priorityColors";

interface PriorityBadgeProps {
  priority: Priority;
  isDarkMode?: boolean;
  compact?: boolean;
  variant?: "card" | "table";
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
  const textClassName = isDarkMode ? "text-gray-900" : "text-white";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border border-transparent font-semibold leading-none ${
        isTableVariant
          ? "h-7 rounded-xl px-3 text-xs tracking-[0.01em]"
          : "h-8 rounded-xl px-3.5 text-sm tracking-[0.01em]"
      } ${textClassName}`}
      style={{
        backgroundColor: color,
      }}
    >
      {label}
    </span>
  );
}
