export function getMilestoneProgressTrackClassName(isDarkMode: boolean) {
  return isDarkMode ? "bg-zinc-800" : "bg-zinc-200";
}

export function getMilestoneProgressFillClassName(isDarkMode: boolean) {
  return isDarkMode
    ? "bg-zinc-300 shadow-[0_0_18px_rgba(244,244,245,0.14)]"
    : "bg-zinc-600 shadow-[0_0_14px_rgba(63,63,70,0.12)]";
}
