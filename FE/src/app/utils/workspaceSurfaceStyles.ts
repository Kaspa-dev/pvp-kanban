type WorkspaceThemeColors = {
  bgSecondary: string;
  border: string;
  borderHover: string;
  cardBg: string;
  inputBg: string;
  inputBorder: string;
  textMuted: string;
  primarySoft: string;
};

export function getWorkspaceControlSurfaceClassName() {
  return "bg-input-background bg-white dark:bg-input/30";
}

export function getWorkspaceControlHoverClassName(currentTheme: Pick<WorkspaceThemeColors, "borderHover">) {
  return `hover:${currentTheme.borderHover} hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10`;
}

export function getWorkspaceSubtleHoverSurfaceClassName(isDarkMode: boolean) {
  return isDarkMode ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.04]";
}

export function getWorkspaceSurfaceStyles(
  currentTheme: WorkspaceThemeColors,
  isDarkMode: boolean,
) {
  const controlSurfaceClassName = getWorkspaceControlSurfaceClassName();
  const controlSurfaceHoverClassName = getWorkspaceControlHoverClassName(currentTheme);
  const subtleHoverSurfaceClassName = getWorkspaceSubtleHoverSurfaceClassName(isDarkMode);

  const backgroundBlobs = isDarkMode
    ? [
        {
          className:
            "absolute left-1/4 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-white/4 via-zinc-300/3 to-transparent blur-3xl animate-pulse",
          style: { animationDuration: "8s" },
        },
        {
          className:
            "absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-gradient-to-tr from-zinc-200/4 via-white/3 to-transparent blur-3xl animate-pulse",
          style: { animationDuration: "10s", animationDelay: "2s" },
        },
        {
          className:
            "absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-gradient-to-br from-zinc-100/3 via-white/2 to-transparent blur-3xl animate-pulse",
          style: { animationDuration: "12s", animationDelay: "4s" },
        },
      ]
    : [
        {
          className: `absolute left-1/4 top-0 h-96 w-96 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl animate-pulse`,
          style: { animationDuration: "8s" },
        },
        {
          className: `absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl animate-pulse`,
          style: { animationDuration: "10s", animationDelay: "2s" },
        },
        {
          className: `absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl animate-pulse`,
          style: { animationDuration: "12s", animationDelay: "4s" },
        },
      ];

  return {
    pageClassName: `relative min-h-screen overflow-hidden ${currentTheme.bgSecondary}`,
    backgroundLayerClassName: "pointer-events-none absolute inset-0 overflow-hidden",
    backgroundBlobs,
    glassHeaderClassName: `relative z-10 border-b ${currentTheme.border} backdrop-blur-xl`,
    glassHeaderStyle: {
      backgroundColor: isDarkMode ? "rgba(12, 12, 14, 0.88)" : "rgba(255, 255, 255, 0.9)",
    },
    glassSidebarStyle: {
      backgroundColor: isDarkMode ? "rgba(12, 12, 14, 0.96)" : "rgba(255, 255, 255, 0.96)",
    },
    elevatedPanelSurfaceClassName: `${currentTheme.cardBg} border ${currentTheme.border} shadow-lg`,
    elevatedSurfaceClassName: `${currentTheme.cardBg} ${currentTheme.border}`,
    subtleSurfaceClassName: `${currentTheme.bgSecondary} ${currentTheme.border}`,
    controlSurfaceClassName,
    controlSurfaceHoverClassName,
    subtleHoverSurfaceClassName,
    mutedIconButtonClassName: `bg-transparent ${currentTheme.textMuted} ${subtleHoverSurfaceClassName}`,
    inputSurfaceClassName: `${currentTheme.inputBg} ${currentTheme.inputBorder}`,
    inputSurfaceStyle: {
      backgroundColor: isDarkMode ? "#09090b" : "#ffffff",
    },
    panelSurfaceClassName: `backdrop-blur-xl ${currentTheme.bgSecondary} ${currentTheme.border}`,
    panelSurfaceStyle: {
      backgroundColor: isDarkMode ? "rgba(18, 18, 20, 0.88)" : "rgba(255, 255, 255, 0.88)",
    },
  };
}
