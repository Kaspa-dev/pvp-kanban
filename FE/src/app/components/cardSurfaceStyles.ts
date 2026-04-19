import { getThemeColors } from "../contexts/ThemeContext";

type ThemeColors = ReturnType<typeof getThemeColors>;

export function getNeutralElevatedCardSurfaceClassName(isDarkMode: boolean) {
  return isDarkMode ? "bg-neutral-950/95" : "bg-white";
}

export function getNeutralElevatedCardHoverClassName(
  currentTheme: ThemeColors,
  isDarkMode: boolean,
) {
  return isDarkMode
    ? `hover:${currentTheme.primaryBorder} hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_44px_rgba(0,0,0,0.46),0_0_34px_rgba(255,255,255,0.08)]`
    : `hover:${currentTheme.primaryBorder} hover:shadow-xl hover:-translate-y-1`;
}
