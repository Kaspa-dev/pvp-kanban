import { X, User as UserIcon, Mail, AtSign, Award, Zap, TrendingUp, CheckCircle2, Trophy, ShieldAlert } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { UserProgress, getLevelName, getProgressPercent, getXPForCurrentLevel, getXPNeededForNextLevel, getXPRemainingForNextLevel, calculateLevel } from "../utils/gamification";
import type { User } from "../utils/auth";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  userProgress: UserProgress;
  tasksCompleted: number;
  userTotalXP: number;
}

export function ProfileModal({ isOpen, onClose, user, userProgress, tasksCompleted, userTotalXP }: ProfileModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  if (!isOpen) return null;

  const userLevel = calculateLevel(userTotalXP);
  const progressPercent = getProgressPercent(userTotalXP, userLevel);
  const xpInLevel = getXPForCurrentLevel(userTotalXP, userLevel);
  const xpNeeded = getXPNeededForNextLevel(userLevel);
  const xpRemaining = getXPRemainingForNextLevel(userTotalXP, userLevel);
  const rankTitle = getLevelName(userLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-3xl p-8 mx-4 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Profile</h2>
          <button
            onClick={onClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className={`p-4 ${currentTheme.isDark ? "bg-gradient-to-br from-gray-800 to-gray-750" : "bg-gradient-to-br from-gray-50 to-gray-100"} rounded-2xl border-2 ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center text-white shadow-lg`}>
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-bold ${currentTheme.text}`}>Level {userLevel}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
                    {rankTitle}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 ${currentTheme.textSecondary}`}>
                <Zap className="w-4 h-4" />
                <span className="font-bold text-base">{userTotalXP}</span>
                <span className="text-xs">XP</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-medium ${currentTheme.textSecondary}`}>Progress to Level {userLevel + 1}</span>
                <span className={`font-bold ${currentTheme.text}`}>{progressPercent}%</span>
              </div>
              <div className={`w-full h-2 ${currentTheme.isDark ? "bg-gray-700" : "bg-gray-200"} rounded-full overflow-hidden shadow-inner`}>
                <div
                  className={`h-full bg-gradient-to-r ${currentTheme.primary} transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className={`flex items-center justify-between text-xs mt-1 ${currentTheme.textMuted}`}>
                <span>{xpInLevel} / {xpNeeded} XP</span>
                <span>{xpRemaining} remaining</span>
              </div>
            </div>
          </div>

          <div className={`p-4 ${currentTheme.isDark ? "bg-gradient-to-br from-gray-800 to-gray-750" : "bg-gradient-to-br from-gray-50 to-gray-100"} rounded-2xl border-2 ${currentTheme.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className={`w-4 h-4 ${currentTheme.primaryText}`} />
              <h3 className={`text-base font-bold ${currentTheme.text}`}>Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className={`p-3 ${currentTheme.isDark ? "bg-gray-700" : "bg-white"} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${currentTheme.isDark ? "text-green-400" : "text-green-600"}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>Tasks</span>
                </div>
                <p className={`text-xl font-bold ${currentTheme.text}`}>{tasksCompleted || 0}</p>
              </div>

              <div className={`p-3 ${currentTheme.isDark ? "bg-gray-700" : "bg-white"} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className={`w-3.5 h-3.5 ${currentTheme.primaryText}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>Total XP</span>
                </div>
                <p className={`text-xl font-bold ${currentTheme.text}`}>{userTotalXP || 0}</p>
              </div>

              <div className={`p-3 ${currentTheme.isDark ? "bg-gray-700" : "bg-white"} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className={`w-3.5 h-3.5 ${currentTheme.primaryText}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>Rank</span>
                </div>
                <p className={`text-xs font-bold ${currentTheme.text} leading-tight`}>{rankTitle}</p>
              </div>

              <div className={`p-3 ${currentTheme.isDark ? "bg-gray-700" : "bg-white"} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Award className={`w-3.5 h-3.5 ${currentTheme.primaryText}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>To Lv{userLevel + 1}</span>
                </div>
                <p className={`text-xl font-bold ${currentTheme.text}`}>{xpRemaining}</p>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-6 p-6 ${currentTheme.isDark ? "bg-gray-800" : "bg-gray-50"} rounded-2xl border-2 ${currentTheme.border}`}>
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-r ${currentTheme.primary} flex items-center justify-center text-white font-bold text-3xl shadow-lg`}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${currentTheme.text} mb-1`}>{user.displayName}</h3>
              <p className={`text-sm ${currentTheme.textSecondary} mb-3`}>@{user.username}</p>
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                <ShieldAlert className={`w-4 h-4 ${currentTheme.primaryText}`} />
                <span className={`text-sm ${currentTheme.textSecondary}`}>
                  Profile editing and password changes are intentionally read-only in this phase.
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="display-name" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                Display Name
              </label>
              <div className="relative">
                <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <input
                  id="display-name"
                  type="text"
                  value={user.displayName}
                  readOnly
                  className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                Username
              </label>
              <div className="relative">
                <AtSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <input
                  id="username"
                  type="text"
                  value={user.username}
                  readOnly
                  className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  readOnly
                  className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl`}
                />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${currentTheme.border} ${currentTheme.bgSecondary}`}>
            <p className={`text-sm ${currentTheme.textSecondary}`}>
              Current board progress is tracked locally for this authenticated account.
            </p>
            <p className={`text-xs ${currentTheme.textMuted} mt-2`}>
              Stored display name: {userProgress.username || user.displayName}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className={`px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg`}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
