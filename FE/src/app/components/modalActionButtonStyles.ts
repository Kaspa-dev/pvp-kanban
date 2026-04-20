type ThemeColors = ReturnType<typeof import("../contexts/ThemeContext").getThemeColors>;

export function getPrimaryModalActionButtonClassName(currentTheme: ThemeColors) {
  return `inline-flex h-11 items-center justify-center leading-none bg-gradient-to-r ${currentTheme.primary} text-white rounded-xl shadow-lg transition-all duration-500 ease-out hover:scale-[1.03] hover:shadow-2xl hover:brightness-105 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg disabled:hover:brightness-100 ${currentTheme.focus}`;
}

export function getSecondaryModalActionButtonClassName(
  currentTheme: ThemeColors,
  textClassName: string,
) {
  return `inline-flex h-11 items-center justify-center leading-none border-2 ${currentTheme.border} ${textClassName} rounded-xl transition-all duration-500 ease-out hover:scale-[1.02] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
}
