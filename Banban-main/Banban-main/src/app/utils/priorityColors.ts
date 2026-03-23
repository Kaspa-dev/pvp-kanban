// Centralized priority color system
// Updated to be more intuitive: Green → Yellow → Red → Black

export type Priority = "low" | "medium" | "high" | "critical";

export interface PriorityConfig {
  color: string;
  colorDark: string; // Color for dark mode
  emoji: string;
  label: string;
  tooltip: string;
}

export const PRIORITY_COLORS: Record<Priority, PriorityConfig> = {
  low: {
    color: "#22c55e", // Green
    colorDark: "#22c55e", // Same green works in dark mode
    emoji: "🟢",
    label: "Low",
    tooltip: "Low priority - can be done later",
  },
  medium: {
    color: "#eab308", // Yellow
    colorDark: "#facc15", // Slightly brighter yellow for dark mode
    emoji: "🟡",
    label: "Medium",
    tooltip: "Medium priority - normal importance",
  },
  high: {
    color: "#ef4444", // Red
    colorDark: "#ef4444", // Same red works in dark mode
    emoji: "🔴",
    label: "High",
    tooltip: "High priority - should be completed soon",
  },
  critical: {
    color: "#0f172a", // Very dark slate (almost black)
    colorDark: "#f1f5f9", // Light gray/white for dark mode
    emoji: "⚫",
    label: "Critical",
    tooltip: "Critical priority - needs immediate attention",
  },
};

/**
 * Get priority color based on priority level and theme mode
 */
export function getPriorityColor(priority?: Priority, isDarkMode: boolean = false): string {
  if (!priority) return "transparent";
  const config = PRIORITY_COLORS[priority];
  return isDarkMode ? config.colorDark : config.color;
}

/**
 * Get priority indicator (emoji + label + tooltip)
 */
export function getPriorityIndicator(priority?: Priority): PriorityConfig | null {
  if (!priority) return null;
  return PRIORITY_COLORS[priority];
}

/**
 * Get priority display name (capitalized)
 */
export function getPriorityLabel(priority: Priority): string {
  return PRIORITY_COLORS[priority].label;
}
