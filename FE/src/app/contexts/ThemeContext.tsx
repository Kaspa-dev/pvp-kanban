import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme =
  | "purple"
  | "ocean"
  | "sunset"
  | "forest"
  | "mono"
  | "berry"
  | "lagoon"
  | "citrus"
  | "cobalt";

export const AVAILABLE_THEMES: Theme[] = [
  "purple",
  "ocean",
  "sunset",
  "forest",
  "mono",
  "berry",
  "lagoon",
  "citrus",
  "cobalt",
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

// Provide default values to prevent context undefined errors during HMR
const defaultThemeContext: ThemeContextType = {
  theme: 'purple',
  setTheme: () => {},
  isDarkMode: false,
  setIsDarkMode: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('banban-theme');
    if (saved && AVAILABLE_THEMES.includes(saved as Theme)) {
      return saved as Theme;
    }
  } catch (error) {
    console.error('Error loading theme from localStorage:', error);
  }
  return 'purple';
}

function getInitialDarkMode(): boolean {
  try {
    const saved = localStorage.getItem('banban-darkmode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading dark mode from localStorage:', error);
  }
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  useEffect(() => {
    try {
      localStorage.setItem('banban-theme', theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('banban-darkmode', JSON.stringify(isDarkMode));
    } catch (error) {
      console.error('Error saving dark mode to localStorage:', error);
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Context now always has a value (default or actual), so just return it
  return context;
}

// Helper function to get theme colors based on dark mode
export function getThemeColors(theme: Theme, isDarkMode: boolean) {
  const accentThemes = {
    purple: {
      name: "Violet Rose",
      primary: "from-purple-500 to-pink-500",
      primaryHover: "from-purple-600 to-pink-600",
      primarySoft: "from-purple-500/10 to-pink-500/10",
      primarySoftStrong: "from-purple-500/20 to-pink-500/20",
      primarySolid: "bg-purple-500",
      primaryLight: isDarkMode ? "bg-purple-950/50" : "bg-purple-100",
      primaryBg: isDarkMode ? "bg-purple-950/50" : "bg-purple-100",
      primaryText: isDarkMode ? "text-purple-400" : "text-purple-600",
      primaryBorder: "border-purple-500",
      ring: isDarkMode ? "ring-purple-500" : "ring-purple-400",
      focus: isDarkMode ? "focus:ring-purple-500" : "focus:ring-purple-400",
      accentDivider: "border-purple-200/20 dark:border-purple-800/20",
      accentHoverRing: "group-hover:ring-purple-200 dark:group-hover:ring-purple-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-purple-950/50 hover:text-purple-400"
        : "hover:bg-purple-100 hover:text-purple-600",
    },
    ocean: {
      name: "Ocean Blue",
      primary: "from-blue-500 to-cyan-500",
      primaryHover: "from-blue-600 to-cyan-600",
      primarySoft: "from-blue-500/10 to-cyan-500/10",
      primarySoftStrong: "from-blue-500/20 to-cyan-500/20",
      primarySolid: "bg-blue-500",
      primaryLight: isDarkMode ? "bg-blue-950/50" : "bg-blue-100",
      primaryBg: isDarkMode ? "bg-blue-950/50" : "bg-blue-100",
      primaryText: isDarkMode ? "text-blue-400" : "text-blue-600",
      primaryBorder: "border-blue-500",
      ring: isDarkMode ? "ring-blue-500" : "ring-blue-400",
      focus: isDarkMode ? "focus:ring-blue-500" : "focus:ring-blue-400",
      accentDivider: "border-blue-200/20 dark:border-blue-800/20",
      accentHoverRing: "group-hover:ring-blue-200 dark:group-hover:ring-blue-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-blue-950/50 hover:text-blue-400"
        : "hover:bg-blue-100 hover:text-blue-600",
    },
    sunset: {
      name: "Sunset Orange",
      primary: "from-orange-500 to-red-500",
      primaryHover: "from-orange-600 to-red-600",
      primarySoft: "from-orange-500/10 to-red-500/10",
      primarySoftStrong: "from-orange-500/20 to-red-500/20",
      primarySolid: "bg-orange-500",
      primaryLight: isDarkMode ? "bg-orange-950/50" : "bg-orange-100",
      primaryBg: isDarkMode ? "bg-orange-950/50" : "bg-orange-100",
      primaryText: isDarkMode ? "text-orange-400" : "text-orange-600",
      primaryBorder: "border-orange-500",
      ring: isDarkMode ? "ring-orange-500" : "ring-orange-400",
      focus: isDarkMode ? "focus:ring-orange-500" : "focus:ring-orange-400",
      accentDivider: "border-orange-200/20 dark:border-orange-800/20",
      accentHoverRing: "group-hover:ring-orange-200 dark:group-hover:ring-orange-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-orange-950/50 hover:text-orange-400"
        : "hover:bg-orange-100 hover:text-orange-600",
    },
    forest: {
      name: "Forest Green",
      primary: "from-green-600 to-emerald-500",
      primaryHover: "from-green-700 to-emerald-600",
      primarySoft: "from-green-600/10 to-emerald-500/10",
      primarySoftStrong: "from-green-600/20 to-emerald-500/20",
      primarySolid: "bg-green-600",
      primaryLight: isDarkMode ? "bg-green-950/50" : "bg-green-100",
      primaryBg: isDarkMode ? "bg-green-950/50" : "bg-green-100",
      primaryText: isDarkMode ? "text-green-400" : "text-green-600",
      primaryBorder: "border-green-600",
      ring: isDarkMode ? "ring-green-500" : "ring-green-400",
      focus: isDarkMode ? "focus:ring-green-500" : "focus:ring-green-400",
      accentDivider: "border-green-200/20 dark:border-green-800/20",
      accentHoverRing: "group-hover:ring-green-200 dark:group-hover:ring-green-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-green-950/50 hover:text-green-400"
        : "hover:bg-green-100 hover:text-green-600",
    },
    mono: {
      name: "Mono Gray",
      primary: "from-gray-700 to-gray-900",
      primaryHover: "from-gray-800 to-black",
      primarySoft: "from-gray-500/10 to-gray-800/10",
      primarySoftStrong: "from-gray-500/20 to-gray-800/20",
      primarySolid: "bg-gray-700",
      primaryLight: isDarkMode ? "bg-gray-800" : "bg-gray-200",
      primaryBg: isDarkMode ? "bg-gray-800" : "bg-gray-200",
      primaryText: isDarkMode ? "text-gray-400" : "text-gray-700",
      primaryBorder: "border-gray-700",
      ring: isDarkMode ? "ring-gray-500" : "ring-gray-400",
      focus: isDarkMode ? "focus:ring-gray-500" : "focus:ring-gray-400",
      accentDivider: "border-gray-300/40 dark:border-gray-700/50",
      accentHoverRing: "group-hover:ring-gray-300 dark:group-hover:ring-gray-600",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-gray-800 hover:text-gray-300"
        : "hover:bg-gray-200 hover:text-gray-700",
    },
    berry: {
      name: "Berry Bloom",
      primary: "from-fuchsia-600 to-rose-500",
      primaryHover: "from-fuchsia-700 to-rose-600",
      primarySoft: "from-fuchsia-500/10 to-rose-500/10",
      primarySoftStrong: "from-fuchsia-500/20 to-rose-500/20",
      primarySolid: "bg-fuchsia-600",
      primaryLight: isDarkMode ? "bg-fuchsia-950/40" : "bg-fuchsia-100",
      primaryBg: isDarkMode ? "bg-fuchsia-950/40" : "bg-fuchsia-100",
      primaryText: isDarkMode ? "text-fuchsia-300" : "text-fuchsia-700",
      primaryBorder: "border-fuchsia-500",
      ring: isDarkMode ? "ring-fuchsia-500" : "ring-fuchsia-400",
      focus: isDarkMode ? "focus:ring-fuchsia-500" : "focus:ring-fuchsia-400",
      accentDivider: "border-fuchsia-200/20 dark:border-fuchsia-800/20",
      accentHoverRing: "group-hover:ring-fuchsia-200 dark:group-hover:ring-fuchsia-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-fuchsia-950/40 hover:text-fuchsia-300"
        : "hover:bg-fuchsia-100 hover:text-fuchsia-700",
    },
    lagoon: {
      name: "Lagoon Teal",
      primary: "from-teal-500 to-sky-500",
      primaryHover: "from-teal-600 to-sky-600",
      primarySoft: "from-teal-500/10 to-sky-500/10",
      primarySoftStrong: "from-teal-500/20 to-sky-500/20",
      primarySolid: "bg-teal-500",
      primaryLight: isDarkMode ? "bg-teal-950/40" : "bg-teal-100",
      primaryBg: isDarkMode ? "bg-teal-950/40" : "bg-teal-100",
      primaryText: isDarkMode ? "text-teal-300" : "text-teal-700",
      primaryBorder: "border-teal-500",
      ring: isDarkMode ? "ring-teal-500" : "ring-teal-400",
      focus: isDarkMode ? "focus:ring-teal-500" : "focus:ring-teal-400",
      accentDivider: "border-teal-200/20 dark:border-teal-800/20",
      accentHoverRing: "group-hover:ring-teal-200 dark:group-hover:ring-teal-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-teal-950/40 hover:text-teal-300"
        : "hover:bg-teal-100 hover:text-teal-700",
    },
    citrus: {
      name: "Citrus Lime",
      primary: "from-lime-500 to-amber-400",
      primaryHover: "from-lime-600 to-amber-500",
      primarySoft: "from-lime-500/10 to-amber-400/10",
      primarySoftStrong: "from-lime-500/20 to-amber-400/20",
      primarySolid: "bg-lime-500",
      primaryLight: isDarkMode ? "bg-lime-950/35" : "bg-lime-100",
      primaryBg: isDarkMode ? "bg-lime-950/35" : "bg-lime-100",
      primaryText: isDarkMode ? "text-lime-300" : "text-lime-700",
      primaryBorder: "border-lime-500",
      ring: isDarkMode ? "ring-lime-500" : "ring-lime-400",
      focus: isDarkMode ? "focus:ring-lime-500" : "focus:ring-lime-400",
      accentDivider: "border-lime-200/20 dark:border-lime-800/20",
      accentHoverRing: "group-hover:ring-lime-200 dark:group-hover:ring-lime-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-lime-950/35 hover:text-lime-300"
        : "hover:bg-lime-100 hover:text-lime-700",
    },
    cobalt: {
      name: "Cobalt Night",
      primary: "from-indigo-500 to-blue-600",
      primaryHover: "from-indigo-600 to-blue-700",
      primarySoft: "from-indigo-500/10 to-blue-600/10",
      primarySoftStrong: "from-indigo-500/20 to-blue-600/20",
      primarySolid: "bg-indigo-500",
      primaryLight: isDarkMode ? "bg-indigo-950/40" : "bg-indigo-100",
      primaryBg: isDarkMode ? "bg-indigo-950/40" : "bg-indigo-100",
      primaryText: isDarkMode ? "text-indigo-300" : "text-indigo-700",
      primaryBorder: "border-indigo-500",
      ring: isDarkMode ? "ring-indigo-500" : "ring-indigo-400",
      focus: isDarkMode ? "focus:ring-indigo-500" : "focus:ring-indigo-400",
      accentDivider: "border-indigo-200/20 dark:border-indigo-800/20",
      accentHoverRing: "group-hover:ring-indigo-200 dark:group-hover:ring-indigo-800",
      accentIconButtonHover: isDarkMode
        ? "hover:bg-indigo-950/40 hover:text-indigo-300"
        : "hover:bg-indigo-100 hover:text-indigo-700",
    },
  };

  const baseColors = isDarkMode
    ? {
        // Dark mode base colors
        bg: "bg-zinc-950",
        bgSecondary: "bg-zinc-950",
        bgTertiary: "bg-zinc-900",
        cardBg: "bg-zinc-900",
        text: "text-zinc-100",
        textSecondary: "text-zinc-200",
        textMuted: "text-zinc-400",
        border: "border-zinc-800",
        borderHover: "border-zinc-700",
        inputBg: "bg-zinc-950",
        inputBorder: "border-zinc-800",
      }
    : {
        // Light mode base colors
        bg: "bg-white",
        bgSecondary: "bg-gray-50",
        bgTertiary: "bg-gray-100",
        cardBg: "bg-white",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        textMuted: "text-gray-500",
        border: "border-gray-200",
        borderHover: "border-gray-300",
        inputBg: "bg-white",
        inputBorder: "border-gray-300",
      };

  // Badge colors based on theme
  const badgeColors = {
    purple: {
      todo: "bg-blue-500",
      inProgress: "bg-purple-500",
      inReview: "bg-yellow-500",
      done: "bg-green-500",
      backlog: "bg-gray-500",
    },
    ocean: {
      todo: "bg-sky-500",
      inProgress: "bg-blue-500",
      inReview: "bg-amber-500",
      done: "bg-teal-500",
      backlog: "bg-slate-500",
    },
    sunset: {
      todo: "bg-amber-500",
      inProgress: "bg-orange-500",
      inReview: "bg-yellow-600",
      done: "bg-emerald-500",
      backlog: "bg-stone-500",
    },
    forest: {
      todo: "bg-lime-500",
      inProgress: "bg-green-600",
      inReview: "bg-yellow-500",
      done: "bg-teal-600",
      backlog: "bg-gray-600",
    },
    mono: {
      todo: "bg-gray-500",
      inProgress: "bg-gray-700",
      inReview: "bg-gray-600",
      done: "bg-gray-900",
      backlog: "bg-gray-400",
    },
    berry: {
      todo: "bg-rose-400",
      inProgress: "bg-fuchsia-600",
      inReview: "bg-pink-500",
      done: "bg-emerald-500",
      backlog: "bg-slate-500",
    },
    lagoon: {
      todo: "bg-sky-400",
      inProgress: "bg-teal-500",
      inReview: "bg-cyan-500",
      done: "bg-emerald-500",
      backlog: "bg-slate-500",
    },
    citrus: {
      todo: "bg-amber-400",
      inProgress: "bg-lime-500",
      inReview: "bg-yellow-500",
      done: "bg-emerald-600",
      backlog: "bg-stone-500",
    },
    cobalt: {
      todo: "bg-sky-500",
      inProgress: "bg-indigo-500",
      inReview: "bg-violet-500",
      done: "bg-emerald-500",
      backlog: "bg-slate-500",
    },
  };

  return {
    ...accentThemes[theme],
    ...baseColors,
    isDark: isDarkMode,
    badge: badgeColors[theme],
  };
}

// Legacy themes object for backward compatibility (will be removed)
export const themes = {
  purple: {
    name: "Purple/Pink",
    primary: "from-purple-500 to-pink-500",
    primaryHover: "from-purple-600 to-pink-600",
    primarySolid: "bg-purple-500",
    primaryLight: "bg-purple-100",
    primaryBg: "bg-purple-100",
    primaryText: "text-purple-600",
    primaryBorder: "border-purple-500",
    ring: "ring-purple-400",
    focus: "focus:ring-purple-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-blue-500",
      inProgress: "bg-purple-500",
      inReview: "bg-yellow-500",
      done: "bg-green-500",
      backlog: "bg-gray-500",
    },
  },
  ocean: {
    name: "Ocean Blue",
    primary: "from-blue-500 to-cyan-500",
    primaryHover: "from-blue-600 to-cyan-600",
    primarySolid: "bg-blue-500",
    primaryLight: "bg-blue-100",
    primaryBg: "bg-blue-100",
    primaryText: "text-blue-600",
    primaryBorder: "border-blue-500",
    ring: "ring-blue-400",
    focus: "focus:ring-blue-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-sky-500",
      inProgress: "bg-blue-500",
      inReview: "bg-amber-500",
      done: "bg-teal-500",
      backlog: "bg-slate-500",
    },
  },
  sunset: {
    name: "Sunset Orange",
    primary: "from-orange-500 to-red-500",
    primaryHover: "from-orange-600 to-red-600",
    primarySolid: "bg-orange-500",
    primaryLight: "bg-orange-100",
    primaryBg: "bg-orange-100",
    primaryText: "text-orange-600",
    primaryBorder: "border-orange-500",
    ring: "ring-orange-400",
    focus: "focus:ring-orange-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-amber-500",
      inProgress: "bg-orange-500",
      inReview: "bg-yellow-600",
      done: "bg-emerald-500",
      backlog: "bg-stone-500",
    },
  },
  forest: {
    name: "Forest Green",
    primary: "from-green-600 to-emerald-500",
    primaryHover: "from-green-700 to-emerald-600",
    primarySolid: "bg-green-600",
    primaryLight: "bg-green-100",
    primaryBg: "bg-green-100",
    primaryText: "text-green-600",
    primaryBorder: "border-green-600",
    ring: "ring-green-400",
    focus: "focus:ring-green-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-lime-500",
      inProgress: "bg-green-600",
      inReview: "bg-yellow-500",
      done: "bg-teal-600",
      backlog: "bg-gray-600",
    },
  },
  mono: {
    name: "Mono Gray",
    primary: "from-gray-700 to-gray-900",
    primaryHover: "from-gray-800 to-black",
    primarySolid: "bg-gray-700",
    primaryLight: "bg-gray-200",
    primaryBg: "bg-gray-200",
    primaryText: "text-gray-700",
    primaryBorder: "border-gray-700",
    ring: "ring-gray-400",
    focus: "focus:ring-gray-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-gray-500",
      inProgress: "bg-gray-700",
      inReview: "bg-gray-600",
      done: "bg-gray-900",
      backlog: "bg-gray-400",
    },
  },
  berry: {
    name: "Berry Bloom",
    primary: "from-fuchsia-600 to-rose-500",
    primaryHover: "from-fuchsia-700 to-rose-600",
    primarySolid: "bg-fuchsia-600",
    primaryLight: "bg-fuchsia-100",
    primaryBg: "bg-fuchsia-100",
    primaryText: "text-fuchsia-700",
    primaryBorder: "border-fuchsia-500",
    ring: "ring-fuchsia-400",
    focus: "focus:ring-fuchsia-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-rose-400",
      inProgress: "bg-fuchsia-600",
      inReview: "bg-pink-500",
      done: "bg-emerald-500",
      backlog: "bg-slate-500",
    },
  },
  lagoon: {
    name: "Lagoon Teal",
    primary: "from-teal-500 to-sky-500",
    primaryHover: "from-teal-600 to-sky-600",
    primarySolid: "bg-teal-500",
    primaryLight: "bg-teal-100",
    primaryBg: "bg-teal-100",
    primaryText: "text-teal-700",
    primaryBorder: "border-teal-500",
    ring: "ring-teal-400",
    focus: "focus:ring-teal-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-sky-400",
      inProgress: "bg-teal-500",
      inReview: "bg-cyan-500",
      done: "bg-emerald-500",
      backlog: "bg-slate-500",
    },
  },
  citrus: {
    name: "Citrus Lime",
    primary: "from-lime-500 to-amber-400",
    primaryHover: "from-lime-600 to-amber-500",
    primarySolid: "bg-lime-500",
    primaryLight: "bg-lime-100",
    primaryBg: "bg-lime-100",
    primaryText: "text-lime-700",
    primaryBorder: "border-lime-500",
    ring: "ring-lime-400",
    focus: "focus:ring-lime-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-amber-400",
      inProgress: "bg-lime-500",
      inReview: "bg-yellow-500",
      done: "bg-emerald-600",
      backlog: "bg-stone-500",
    },
  },
  cobalt: {
    name: "Cobalt Night",
    primary: "from-indigo-500 to-blue-600",
    primaryHover: "from-indigo-600 to-blue-700",
    primarySolid: "bg-indigo-500",
    primaryLight: "bg-indigo-100",
    primaryBg: "bg-indigo-100",
    primaryText: "text-indigo-700",
    primaryBorder: "border-indigo-500",
    ring: "ring-indigo-400",
    focus: "focus:ring-indigo-400",
    bg: "bg-white",
    bgSecondary: "bg-gray-50",
    bgTertiary: "bg-gray-100",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    borderHover: "border-gray-300",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    isDark: false,
    badge: {
      todo: "bg-sky-500",
      inProgress: "bg-indigo-500",
      inReview: "bg-violet-500",
      done: "bg-emerald-500",
      backlog: "bg-slate-500",
    },
  },
};
