import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "purple" | "ocean" | "sunset" | "forest" | "mono";

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
    if (saved && ['purple', 'ocean', 'sunset', 'forest', 'mono'].includes(saved)) {
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
      name: "Purple/Pink",
      primary: "from-purple-500 to-pink-500",
      primaryHover: "from-purple-600 to-pink-600",
      primarySolid: "bg-purple-500",
      primaryLight: isDarkMode ? "bg-purple-950/50" : "bg-purple-100",
      primaryBg: isDarkMode ? "bg-purple-950/50" : "bg-purple-100",
      primaryText: isDarkMode ? "text-purple-400" : "text-purple-600",
      primaryBorder: "border-purple-500",
      ring: isDarkMode ? "ring-purple-500" : "ring-purple-400",
      focus: isDarkMode ? "focus:ring-purple-500" : "focus:ring-purple-400",
    },
    ocean: {
      name: "Ocean Blue",
      primary: "from-blue-500 to-cyan-500",
      primaryHover: "from-blue-600 to-cyan-600",
      primarySolid: "bg-blue-500",
      primaryLight: isDarkMode ? "bg-blue-950/50" : "bg-blue-100",
      primaryBg: isDarkMode ? "bg-blue-950/50" : "bg-blue-100",
      primaryText: isDarkMode ? "text-blue-400" : "text-blue-600",
      primaryBorder: "border-blue-500",
      ring: isDarkMode ? "ring-blue-500" : "ring-blue-400",
      focus: isDarkMode ? "focus:ring-blue-500" : "focus:ring-blue-400",
    },
    sunset: {
      name: "Sunset Orange",
      primary: "from-orange-500 to-red-500",
      primaryHover: "from-orange-600 to-red-600",
      primarySolid: "bg-orange-500",
      primaryLight: isDarkMode ? "bg-orange-950/50" : "bg-orange-100",
      primaryBg: isDarkMode ? "bg-orange-950/50" : "bg-orange-100",
      primaryText: isDarkMode ? "text-orange-400" : "text-orange-600",
      primaryBorder: "border-orange-500",
      ring: isDarkMode ? "ring-orange-500" : "ring-orange-400",
      focus: isDarkMode ? "focus:ring-orange-500" : "focus:ring-orange-400",
    },
    forest: {
      name: "Forest Green",
      primary: "from-green-600 to-emerald-500",
      primaryHover: "from-green-700 to-emerald-600",
      primarySolid: "bg-green-600",
      primaryLight: isDarkMode ? "bg-green-950/50" : "bg-green-100",
      primaryBg: isDarkMode ? "bg-green-950/50" : "bg-green-100",
      primaryText: isDarkMode ? "text-green-400" : "text-green-600",
      primaryBorder: "border-green-600",
      ring: isDarkMode ? "ring-green-500" : "ring-green-400",
      focus: isDarkMode ? "focus:ring-green-500" : "focus:ring-green-400",
    },
    mono: {
      name: "Mono Gray",
      primary: "from-gray-700 to-gray-900",
      primaryHover: "from-gray-800 to-black",
      primarySolid: "bg-gray-700",
      primaryLight: isDarkMode ? "bg-gray-800" : "bg-gray-200",
      primaryBg: isDarkMode ? "bg-gray-800" : "bg-gray-200",
      primaryText: isDarkMode ? "text-gray-400" : "text-gray-700",
      primaryBorder: "border-gray-700",
      ring: isDarkMode ? "ring-gray-500" : "ring-gray-400",
      focus: isDarkMode ? "focus:ring-gray-500" : "focus:ring-gray-400",
    },
  };

  const baseColors = isDarkMode
    ? {
        // Dark mode base colors
        bg: "bg-gray-950",
        bgSecondary: "bg-gray-900",
        bgTertiary: "bg-gray-850",
        cardBg: "bg-gray-800",
        text: "text-gray-100",
        textSecondary: "text-gray-200",
        textMuted: "text-gray-300",
        border: "border-gray-600",
        borderHover: "border-gray-500",
        inputBg: "bg-gray-900",
        inputBorder: "border-gray-600",
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
};