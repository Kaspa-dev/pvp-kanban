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
  const isCritical = priority === "critical";

  return (
    <svg
      className={className}
      style={{ color }}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {priority === "low" && (
        <path
          d="M3 4.2L6 7.1L9 4.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {priority === "medium" && (
        <path
          d="M3.2 6H8.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      )}
      {priority === "high" && (
        <path
          d="M3 7.8L6 4.9L9 7.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {isCritical && (
        <rect
          x="3.2"
          y="3.2"
          width="5.6"
          height="5.6"
          rx="1"
          fill="currentColor"
        />
      )}
    </svg>
  );
}
