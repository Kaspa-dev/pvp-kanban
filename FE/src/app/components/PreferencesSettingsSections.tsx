import { Bell, Moon, Palette, Sparkles, Sun, Zap } from "lucide-react";
import { AVAILABLE_THEMES, getThemeColors, useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";

interface PreferencesSettingsSectionsProps {
  gamificationEnabled: boolean;
  onGamificationChange: (nextValue: boolean) => void;
  notificationsEnabled: boolean;
  onNotificationsChange: (nextValue: boolean) => void;
}

export function PreferencesSettingsSections({
  gamificationEnabled,
  onGamificationChange,
  notificationsEnabled,
  onNotificationsChange,
}: PreferencesSettingsSectionsProps) {
  const { theme, setTheme, isDarkMode, setIsDarkMode } = useTheme();
  const {
    preferences,
    isLoading: isPreferencesLoading,
    errorMessage: preferencesError,
    updatePreferences,
    clearError,
  } = useUserPreferences();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const handleCoachmarkToggle = (checked: boolean) => {
    clearError();
    void updatePreferences({ coachmarksEnabled: checked });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Palette className={`h-5 w-5 ${currentTheme.primaryText}`} />
          <h3 className={`text-lg font-bold ${currentTheme.text}`}>Appearance</h3>
        </div>

        <div className="mb-4">
          <p className={`mb-3 text-sm font-semibold ${currentTheme.textSecondary}`}>Mode</p>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full rounded-xl border-2 p-4 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ""}`}
            type="button"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className={`h-5 w-5 ${currentTheme.primaryText}`} />
                ) : (
                  <Sun className={`h-5 w-5 ${currentTheme.primaryText}`} />
                )}
                <div className="text-left">
                  <p className={`font-semibold ${currentTheme.text}`}>
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </p>
                  <p className={`mt-0.5 text-xs ${currentTheme.textMuted}`}>
                    {isDarkMode ? "Using dark interface" : "Using light interface"}
                  </p>
                </div>
              </div>
              <div
                className={`relative h-6 w-12 rounded-full transition-colors ${
                  isDarkMode ? `bg-gradient-to-r ${currentTheme.primary}` : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    isDarkMode ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </button>
        </div>

        <div>
          <p className={`mb-3 text-sm font-semibold ${currentTheme.textSecondary}`}>Accent Theme</p>
          <p className={`mb-4 text-xs ${currentTheme.textMuted}`}>
            Choose the accent color family that should appear across buttons, highlights, and status details.
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {AVAILABLE_THEMES.map((themeKey) => {
              const themeData = getThemeColors(themeKey, isDarkMode);
              const isActive = theme === themeKey;

              return (
                <button
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className={`flex items-center justify-between rounded-xl border-2 p-3 transition-all ${
                    isActive
                      ? `${currentTheme.border} ring-2 ${currentTheme.focus}`
                      : `${currentTheme.border} hover:${currentTheme.borderHover}`
                  } ${currentTheme.isDark ? currentTheme.bgSecondary : ""}`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${themeData.primary} shadow-md`} />
                    <span className={`text-sm font-medium ${currentTheme.text}`}>{themeData.name}</span>
                  </div>
                  {isActive && (
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r ${themeData.primary}`}>
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Zap className={`h-5 w-5 ${currentTheme.primaryText}`} />
          <h3 className={`text-lg font-bold ${currentTheme.text}`}>Gamification</h3>
        </div>
        <button
          onClick={() => onGamificationChange(!gamificationEnabled)}
          className={`w-full rounded-xl border-2 p-4 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ""}`}
          type="button"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className={`font-semibold ${currentTheme.text}`}>XP & Level System</p>
              <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>
                Earn experience points and level up by completing tasks.
              </p>
            </div>
            <div
              className={`relative h-6 w-12 rounded-full transition-colors ${
                gamificationEnabled ? `bg-gradient-to-r ${currentTheme.primary}` : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                  gamificationEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </div>
        </button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Bell className={`h-5 w-5 ${currentTheme.primaryText}`} />
          <h3 className={`text-lg font-bold ${currentTheme.text}`}>Notifications</h3>
        </div>
        <button
          onClick={() => onNotificationsChange(!notificationsEnabled)}
          className={`w-full rounded-xl border-2 p-4 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ""}`}
          type="button"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className={`font-semibold ${currentTheme.text}`}>Task Update Notifications</p>
              <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>
                Keep track of task changes and completions while you work.
              </p>
            </div>
            <div
              className={`relative h-6 w-12 rounded-full transition-colors ${
                notificationsEnabled ? `bg-gradient-to-r ${currentTheme.primary}` : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                  notificationsEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </div>
        </button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className={`h-5 w-5 ${currentTheme.primaryText}`} />
          <h3 className={`text-lg font-bold ${currentTheme.text}`}>Coachmarks</h3>
        </div>
        <button
          onClick={() => handleCoachmarkToggle(!preferences.coachmarksEnabled)}
          disabled={isPreferencesLoading}
          className={`w-full rounded-xl border-2 p-4 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ""} disabled:cursor-not-allowed disabled:opacity-70`}
          type="button"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <p className={`font-semibold ${currentTheme.text}`}>Coachmarks</p>
              <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>
                Show guided walkthroughs in projects, boards, and staging.
              </p>
              {preferencesError && (
                <p className="mt-2 text-xs text-red-600">{preferencesError}</p>
              )}
            </div>
            <div
              className={`relative h-6 w-12 rounded-full transition-colors ${
                preferences.coachmarksEnabled ? `bg-gradient-to-r ${currentTheme.primary}` : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                  preferences.coachmarksEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
