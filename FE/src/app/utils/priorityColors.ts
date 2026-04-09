// Centralized priority color system
// Updated to use colored icons instead of emoji markers.

export type Priority = "low" | "medium" | "high" | "critical";

export interface PriorityConfig {
  color: string;
  colorDark: string;
  label: string;
  tooltip: string;
}

export const PRIORITY_COLORS: Record<Priority, PriorityConfig> = {
  low: {
    color: "#22c55e",
    colorDark: "#22c55e",
    label: "Low",
    tooltip: "Low priority - can be done later",
  },
  medium: {
    color: "#eab308",
    colorDark: "#facc15",
    label: "Medium",
    tooltip: "Medium priority - normal importance",
  },
  high: {
    color: "#ef4444",
    colorDark: "#ef4444",
    label: "High",
    tooltip: "High priority - should be completed soon",
  },
  critical: {
    color: "#0f172a",
    colorDark: "#f1f5f9",
    label: "Critical",
    tooltip: "Critical priority - needs immediate attention",
  },
};

export function getPriorityColor(priority?: Priority, isDarkMode: boolean = false): string {
  if (!priority) return "transparent";
  const config = PRIORITY_COLORS[priority];
  return isDarkMode ? config.colorDark : config.color;
}

export function getPriorityIndicator(priority?: Priority): PriorityConfig | null {
  if (!priority) return null;
  return PRIORITY_COLORS[priority];
}

export function getPriorityLabel(priority: Priority): string {
  return PRIORITY_COLORS[priority].label;
}
