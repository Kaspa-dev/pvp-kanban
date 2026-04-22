import { getThemeColors } from "../contexts/ThemeContext";

type ThemeColors = ReturnType<typeof getThemeColors>;

interface IconActionButtonOptions {
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "pill";
  emphasis?: "default" | "elevated";
}

export function getIconActionButtonFrameClassName(options: Pick<IconActionButtonOptions, "size" | "shape"> = {}) {
  const { size = "sm", shape = "rounded" } = options;
  const sizeClassName = size === "lg" ? "h-11 w-11" : size === "md" ? "h-9 w-9" : "h-8 w-8";
  const shapeClassName = shape === "pill" ? "rounded-full" : "rounded-lg";
  return `inline-flex ${sizeClassName} items-center justify-center ${shapeClassName}`;
}

export function getIconActionButtonClassName(
  currentTheme: ThemeColors,
  options: IconActionButtonOptions = {},
) {
  const { emphasis = "default" } = options;
  const emphasisClassName =
    emphasis === "elevated"
      ? "transition-colors"
      : "transition-colors";

  return `${currentTheme.textMuted} ${getIconActionButtonFrameClassName(options)} ${emphasisClassName} ${currentTheme.accentIconButtonHover}`;
}

export function getDisabledIconActionButtonClassName(
  currentTheme: ThemeColors,
  options: Pick<IconActionButtonOptions, "size" | "shape"> = {},
) {
  return `${currentTheme.textMuted} ${getIconActionButtonFrameClassName(options)} cursor-not-allowed opacity-55 shadow-none`;
}
