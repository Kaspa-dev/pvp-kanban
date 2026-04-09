import { ArrowDown, ArrowUp, Minus, OctagonAlert } from "lucide-react";
import { Priority } from "../utils/cards";
import { getPriorityColor } from "../utils/priorityColors";

interface PriorityIconProps {
  priority: Priority;
  isDarkMode?: boolean;
  className?: string;
  colorOverride?: string;
}

export function PriorityIcon({
  priority,
  isDarkMode = false,
  className = "w-4 h-4",
  colorOverride,
}: PriorityIconProps) {
  const color = colorOverride ?? getPriorityColor(priority, isDarkMode);

  switch (priority) {
    case "low":
      return <ArrowDown className={className} style={{ color }} strokeWidth={2.4} aria-hidden="true" />;
    case "medium":
      return <Minus className={className} style={{ color }} strokeWidth={2.6} aria-hidden="true" />;
    case "high":
      return <ArrowUp className={className} style={{ color }} strokeWidth={2.4} aria-hidden="true" />;
    case "critical":
      return <OctagonAlert className={className} style={{ color }} strokeWidth={2.2} aria-hidden="true" />;
    default:
      return null;
  }
}
