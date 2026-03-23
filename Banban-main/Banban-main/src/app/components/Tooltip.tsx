import { ReactNode, useState } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, delay = 500, position = "top" }: TooltipProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
    }
  };

  const getArrowStyles = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent";
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent";
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          className={`absolute ${getPositionStyles()} z-[100] pointer-events-none animate-in fade-in zoom-in-95 duration-200`}
          style={{ minWidth: "max-content", maxWidth: "250px" }}
        >
          <div
            className={`px-3 py-2 rounded-lg shadow-xl text-xs font-medium ${
              isDarkMode
                ? "bg-gray-100 text-gray-900 border border-gray-200"
                : "bg-gray-900 text-white border border-gray-700"
            }`}
          >
            {content}
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 ${getArrowStyles()}`}
              style={{
                borderWidth: "4px",
                borderStyle: "solid",
                borderColor: isDarkMode ? "#e5e7eb" : "#1f2937",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
