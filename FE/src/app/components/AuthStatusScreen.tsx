import { LoaderCircle } from 'lucide-react';
import { getThemeColors, useTheme } from '../contexts/ThemeContext';

interface AuthStatusScreenProps {
  title: string;
}

export function AuthStatusScreen({ title }: AuthStatusScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-6 py-10 ${currentTheme.bg}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <LoaderCircle
          className={`h-16 w-16 animate-spin ${currentTheme.primaryText}`}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <p className={`text-base ${currentTheme.textMuted}`}>{title}</p>
      </div>
    </div>
  );
}
