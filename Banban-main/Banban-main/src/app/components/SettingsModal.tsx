import { X, Palette, Zap, Bell, User, Moon, Sun } from "lucide-react";
import { useTheme, getThemeColors, Theme } from "../contexts/ThemeContext";
import { useEffect, useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
}

export function SettingsModal({ isOpen, onClose, onOpenProfile }: SettingsModalProps) {
  const { theme, setTheme, isDarkMode, setIsDarkMode } = useTheme();
  
  // Load settings from localStorage
  const [gamificationEnabled, setGamificationEnabled] = useState(() => {
    const saved = localStorage.getItem('settings.gamification');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('settings.notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('settings.gamification', JSON.stringify(gamificationEnabled));
  }, [gamificationEnabled]);
  
  useEffect(() => {
    localStorage.setItem('settings.notifications', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

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
      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-2xl p-8 mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Settings</h2>
          <button
            onClick={onClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Appearance Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className={`w-5 h-5 ${currentTheme.primaryText}`} />
              <h3 className={`text-lg font-bold ${currentTheme.text}`}>Appearance</h3>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="mb-4">
              <p className={`text-sm font-semibold ${currentTheme.textSecondary} mb-3`}>Mode</p>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon className={`w-5 h-5 ${currentTheme.primaryText}`} />
                    ) : (
                      <Sun className={`w-5 h-5 ${currentTheme.primaryText}`} />
                    )}
                    <div className="text-left">
                      <p className={`font-semibold ${currentTheme.text}`}>
                        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                      </p>
                      <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
                        {isDarkMode ? 'Using dark interface' : 'Using light interface'}
                      </p>
                    </div>
                  </div>
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${
                    isDarkMode 
                      ? `bg-gradient-to-r ${currentTheme.primary}` 
                      : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </button>
            </div>

            {/* Accent Theme Selector */}
            <div>
              <p className={`text-sm font-semibold ${currentTheme.textSecondary} mb-3`}>Accent Theme</p>
              <div className="grid grid-cols-2 gap-3">
                {(['purple', 'ocean', 'sunset', 'forest', 'mono'] as Theme[]).map((themeKey) => {
                  const themeData = getThemeColors(themeKey, isDarkMode);
                  const isActive = theme === themeKey;
                  return (
                    <button
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        isActive
                          ? `${currentTheme.border} ring-2 ${currentTheme.focus}`
                          : `${currentTheme.border} hover:${currentTheme.borderHover}`
                      } ${currentTheme.isDark ? currentTheme.bgSecondary : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${themeData.primary} shadow-md`} />
                        <span className={`font-medium text-sm ${currentTheme.text}`}>{themeData.name}</span>
                      </div>
                      {isActive && (
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${themeData.primary} flex items-center justify-center`}>
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          {/* Gamification Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-5 h-5 ${currentTheme.primaryText}`} />
              <h3 className={`text-lg font-bold ${currentTheme.text}`}>Gamification</h3>
            </div>
            <button
              onClick={() => setGamificationEnabled(!gamificationEnabled)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className={`font-semibold ${currentTheme.text}`}>XP & Level System</p>
                  <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                    Earn experience points and level up by completing tasks
                  </p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${
                  gamificationEnabled 
                    ? `bg-gradient-to-r ${currentTheme.primary}` 
                    : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    gamificationEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </button>
          </div>

          {/* Notifications Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className={`w-5 h-5 ${currentTheme.primaryText}`} />
              <h3 className={`text-lg font-bold ${currentTheme.text}`}>Notifications</h3>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${currentTheme.border} hover:${currentTheme.borderHover} ${currentTheme.isDark ? currentTheme.bgSecondary : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className={`font-semibold ${currentTheme.text}`}>Task Update Notifications</p>
                  <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                    Get notified when tasks are updated or completed
                  </p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled 
                    ? `bg-gradient-to-r ${currentTheme.primary}` 
                    : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </button>
          </div>

          {/* Account Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className={`w-5 h-5 ${currentTheme.primaryText}`} />
              <h3 className={`text-lg font-bold ${currentTheme.text}`}>Account</h3>
            </div>
            <button
              onClick={() => {
                onOpenProfile();
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

        <button
          onClick={onClose}
          className={`w-full mt-6 px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg`}
        >
          Done
        </button>
      </div>
    </div>
  );
}
