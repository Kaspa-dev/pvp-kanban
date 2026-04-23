import { getThemeColors } from "../contexts/ThemeContext";

type ThemeColors = ReturnType<typeof getThemeColors>;

interface InputLikeControlOptions {
  selected?: boolean;
  disabled?: boolean;
  openState?: boolean;
  surfaceClassName?: string;
  selectedSurfaceClassName?: string;
}

function getFocusVisibleClassName(focusClassName: string) {
  return focusClassName.replace(/\bfocus:/g, "focus-visible:");
}

export function getInputLikeControlClassName(
  currentTheme: ThemeColors,
  options: InputLikeControlOptions = {},
) {
  const {
    selected = false,
    disabled = false,
    openState = false,
    surfaceClassName = currentTheme.inputBg,
    selectedSurfaceClassName = currentTheme.primaryBg,
  } = options;

  const baseClassName = [
    "border-2",
    "rounded-xl",
    "transition-[border-color,box-shadow,color,background-color]",
    "duration-300",
    "ease-out",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:border-transparent",
    getFocusVisibleClassName(currentTheme.focus),
    openState ? `data-[state=open]:border-transparent data-[state=open]:ring-2 ${currentTheme.ring}` : "",
  ].join(" ");

  if (disabled) {
    return `${baseClassName} ${currentTheme.inputBorder} ${surfaceClassName} cursor-not-allowed opacity-60`;
  }

  if (selected) {
    return `${baseClassName} ${currentTheme.primaryBorder} ${selectedSurfaceClassName}`;
  }

  return `${baseClassName} ${currentTheme.inputBorder} ${surfaceClassName} hover:${currentTheme.inputBorder} hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] dark:hover:shadow-[0_0_0_1px_color-mix(in_srgb,white_12%,transparent)]`;
}

interface NativeInputFieldOptions {
  surfaceClassName?: string;
  textClassName?: string;
}

export function getNativeInputFieldClassName(
  currentTheme: ThemeColors,
  options: NativeInputFieldOptions = {},
) {
  const {
    surfaceClassName = currentTheme.inputBg,
    textClassName = currentTheme.text,
  } = options;

  return `border-2 rounded-xl transition-[border-color,box-shadow,color,background-color] duration-300 ease-out focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${currentTheme.inputBorder} ${surfaceClassName} ${textClassName}`;
}
