import type { ComponentType } from "react";
import { Check, HelpCircle, Moon, Palette, Sparkles, Sun } from "lucide-react";
import { AVAILABLE_THEMES, getThemeColors, useTheme, type Theme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ThemeColors = ReturnType<typeof getThemeColors>;

interface SettingsSectionHeaderProps {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tooltip: string;
  currentTheme: ThemeColors;
}

interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  currentTheme: ThemeColors;
  isDarkMode: boolean;
}

function SettingsSectionHeader({
  id,
  icon: Icon,
  title,
  description,
  tooltip,
  currentTheme,
}: SettingsSectionHeaderProps) {
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${currentTheme.primaryText}`} />
        <h3 id={id} className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
          {title}
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={helpIconButtonClassName} aria-label={`${title} settings help`}>
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
      <p className={`text-sm ${currentTheme.textMuted}`}>{description}</p>
    </div>
  );
}

function ToggleSwitch({ checked, disabled = false, currentTheme, isDarkMode }: ToggleSwitchProps) {
  const offTrackClassName = isDarkMode
    ? "border-zinc-700 bg-zinc-900"
    : "border-slate-300 bg-slate-100";
  const thumbClassName = isDarkMode ? "bg-zinc-50" : "bg-white";

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-all duration-300 ${
        checked ? `border-transparent bg-gradient-to-r ${currentTheme.primary}` : offTrackClassName
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow-md transition-transform duration-300 ${thumbClassName} ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </span>
  );
}

function getSettingsRowClassName(currentTheme: ThemeColors, isDarkMode: boolean, disabled = false) {
  const surfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-gray-50";
  return `w-full rounded-xl border-2 p-4 text-left transition-[border-color,box-shadow,color,background-color,transform] duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${
    disabled
      ? `cursor-not-allowed opacity-70 ${currentTheme.border} ${surfaceClassName}`
      : `${currentTheme.inputBorder} ${surfaceClassName} hover:${currentTheme.borderHover} hover:shadow-[0_14px_34px_-30px_rgba(15,23,42,0.45)]`
  }`;
}

function getThemeButtonClassName(
  currentTheme: ThemeColors,
  isDarkMode: boolean,
  isActive: boolean,
) {
  const surfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-gray-50";
  return `flex min-h-14 items-center justify-between rounded-xl border-2 p-3 text-left transition-[border-color,box-shadow,color,background-color,transform] duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${
    isActive
      ? `${currentTheme.border} ${surfaceClassName} shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ring-2 ${currentTheme.focus}`
      : `${currentTheme.inputBorder} ${surfaceClassName} hover:${currentTheme.borderHover}`
  }`;
}

export function PreferencesSettingsSections() {
  const { theme, setTheme, isDarkMode, setIsDarkMode } = useTheme();
  const {
    preferences,
    isLoading: isPreferencesLoading,
    errorMessage: preferencesError,
    updatePreferences,
    clearError,
  } = useUserPreferences();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const sectionDividerClassName = isDarkMode
    ? "h-px rounded-full bg-zinc-800"
    : "h-px rounded-full bg-gray-200";

  const handleCoachmarkToggle = (checked: boolean) => {
    clearError();
    void updatePreferences({ coachmarksEnabled: checked });
  };

  const renderThemeButton = (themeKey: Theme) => {
    const themeData = getThemeColors(themeKey, isDarkMode);
    const isActive = theme === themeKey;

    return (
      <button
        key={themeKey}
        type="button"
        onClick={() => setTheme(themeKey)}
        className={getThemeButtonClassName(currentTheme, isDarkMode, isActive)}
        aria-pressed={isActive}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={`h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${themeData.primary} shadow-md`} />
          <span className={`truncate text-sm font-semibold ${currentTheme.text}`}>{themeData.name}</span>
        </span>
        {isActive ? (
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r ${themeData.primary}`}>
            <Check className="h-3 w-3 text-white" />
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <section className="space-y-5" aria-labelledby="settings-appearance-heading">
        <SettingsSectionHeader
          id="settings-appearance-heading"
          icon={Palette}
          title="Appearance"
          description="Choose the interface mode and accent color used across controls, highlights, and focus states."
          tooltip="Appearance settings are local to your device and update the interface immediately."
          currentTheme={currentTheme}
        />

        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={getSettingsRowClassName(currentTheme, isDarkMode)}
          aria-pressed={isDarkMode}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${currentTheme.primary}`}>
                {isDarkMode ? (
                  <Moon className="h-5 w-5 text-white" />
                ) : (
                  <Sun className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className={`font-semibold ${currentTheme.text}`}>
                  {isDarkMode ? "Dark mode" : "Light mode"}
                </p>
                <p className={`mt-0.5 text-xs ${currentTheme.textMuted}`}>
                  Toggle the main interface brightness.
                </p>
              </div>
            </div>
            <ToggleSwitch checked={isDarkMode} currentTheme={currentTheme} isDarkMode={isDarkMode} />
          </div>
        </button>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm font-semibold ${currentTheme.textSecondary}`}>Accent theme</p>
            <span className={`font-due-date text-xs ${currentTheme.textMuted}`}>{AVAILABLE_THEMES.length} options</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {AVAILABLE_THEMES.map(renderThemeButton)}
          </div>
        </div>
      </section>

      <div className={`-mx-1 ${sectionDividerClassName}`} aria-hidden="true" />

      <section className="space-y-5" aria-labelledby="settings-coachmarks-heading">
        <SettingsSectionHeader
          id="settings-coachmarks-heading"
          icon={Sparkles}
          title="Coachmarks"
          description="Control whether guided hints appear around supported project and board flows."
          tooltip="Coachmarks can be replayed from pages that support hints. Turning this off hides the guided walkthroughs."
          currentTheme={currentTheme}
        />

        <button
          type="button"
          onClick={() => handleCoachmarkToggle(!preferences.coachmarksEnabled)}
          disabled={isPreferencesLoading}
          className={getSettingsRowClassName(currentTheme, isDarkMode, isPreferencesLoading)}
          aria-pressed={preferences.coachmarksEnabled}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-left">
              <p className={`font-semibold ${currentTheme.text}`}>
                Guided hints
              </p>
              <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>
                {preferences.coachmarksEnabled ? "Coachmarks are enabled." : "Coachmarks are hidden."}
              </p>
              {preferencesError ? (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{preferencesError}</p>
              ) : null}
            </div>
            <ToggleSwitch
              checked={preferences.coachmarksEnabled}
              disabled={isPreferencesLoading}
              currentTheme={currentTheme}
              isDarkMode={isDarkMode}
            />
          </div>
        </button>
      </section>
    </div>
  );
}
