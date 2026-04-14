import { X, User } from "lucide-react";
import { useEffect } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { CustomScrollArea } from "./CustomScrollArea";
import { PreferencesSettingsSections } from "./PreferencesSettingsSections";
import { useLocalStorageBoolean } from "../hooks/useLocalStorageBoolean";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
}

export function SettingsModal({ isOpen, onClose, onOpenProfile }: SettingsModalProps) {
  const { theme, isDarkMode } = useTheme();
  const [gamificationEnabled, setGamificationEnabled] = useLocalStorageBoolean("settings.gamification", true);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorageBoolean("settings.notifications", true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-2xl mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col`}
        style={{ height: "min(90vh, 48rem)" }}
      >
        <div className={`flex items-center justify-between border-b-2 ${currentTheme.border} px-8 py-6 shrink-0`}>
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Settings</h2>
          <button
            onClick={onClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-8 py-6">
          <CustomScrollArea className="h-full min-h-0" viewportClassName="h-full min-h-0 pr-4">
            <div className="space-y-6 px-1 py-1">
              <PreferencesSettingsSections
                gamificationEnabled={gamificationEnabled}
                onGamificationChange={setGamificationEnabled}
                notificationsEnabled={notificationsEnabled}
                onNotificationsChange={setNotificationsEnabled}
              />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className={`w-5 h-5 ${currentTheme.primaryText}`} />
                  <h3 className={`text-lg font-bold ${currentTheme.text}`}>Account</h3>
                </div>
                <button
                  onClick={() => {
                    onOpenProfile?.();
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center shadow-md`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${currentTheme.text}`}>Profile & Account Settings</p>
                      <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>Manage your profile and preferences</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 ${currentTheme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </CustomScrollArea>
        </div>

        <div className={`px-8 py-6 border-t-2 ${currentTheme.border} ${currentTheme.cardBg} shrink-0`}>
          <button
            onClick={onClose}
            className={`w-full px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
