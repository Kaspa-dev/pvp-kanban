import { getThemeColors } from "../contexts/ThemeContext";

type ThemeColors = ReturnType<typeof getThemeColors>;

interface IconActionButtonOptions {
  size?: "sm" | "md";
  shape?: "rounded" | "pill";
}

export function getIconActionButtonClassName(
  currentTheme: ThemeColors,
  options: IconActionButtonOptions = {},
) {
  const { size = "sm", shape = "rounded" } = options;
  const sizeClassName = size === "md" ? "h-9 w-9" : "h-8 w-8";
  const shapeClassName = shape === "pill" ? "rounded-full" : "rounded-lg";

  return `${currentTheme.textMuted} inline-flex ${sizeClassName} items-center justify-center ${shapeClassName} transition-colors ${currentTheme.accentIconButtonHover}`;
}
