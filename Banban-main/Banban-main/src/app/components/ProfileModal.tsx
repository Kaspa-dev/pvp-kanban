import { X, User, Mail, Lock, Camera, Award, Zap, TrendingUp, CheckCircle2, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { UserProgress, getLevelName, getProgressPercent, getXPForCurrentLevel, getXPNeededForNextLevel, getXPRemainingForNextLevel, calculateLevel } from "../utils/gamification";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProgress: UserProgress;
  onUpdateProfile: (updates: Partial<UserProgress>) => void;
  tasksCompleted: number;
  userTotalXP: number;
}

export function ProfileModal({ isOpen, onClose, userProgress, onUpdateProfile, tasksCompleted, userTotalXP }: ProfileModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [username, setUsername] = useState(userProgress.username);
  const [email, setEmail] = useState(userProgress.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setUsername(userProgress.username);
    setEmail(userProgress.email);
  }, [userProgress]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Validate password if changing
    if (newPassword && newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    onUpdateProfile({
      username,
      email,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const handleAvatarUpload = () => {
    // Mock avatar upload
    alert("Avatar upload would go here (mock only)");
  };

  // Calculate level and stats based on user's actual XP from their completed tasks
  const userLevel = calculateLevel(userTotalXP);
  const progressPercent = getProgressPercent(userTotalXP, userLevel);
  const xpInLevel = getXPForCurrentLevel(userTotalXP, userLevel);
  const xpNeeded = getXPNeededForNextLevel(userLevel);
  const xpRemaining = getXPRemainingForNextLevel(userTotalXP, userLevel);
  const rankTitle = getLevelName(userLevel);

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
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Profile</h2>
          <button
            onClick={onClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.textSecondary} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showSuccess && (
          <div className={`mb-4 p-3 bg-green-100 border-2 border-green-500 rounded-xl text-green-800 font-medium`}>
            ✓ Profile updated successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* XP & Level Section */}
          <div className={`p-4 ${currentTheme.isDark ? 'bg-gradient-to-br from-gray-800 to-gray-750' : 'bg-gradient-to-br from-gray-50 to-gray-100'} rounded-2xl border-2 ${currentTheme.border}`}>
            {/* Compact Header - Level, Rank, XP on one line */}
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
                <span className="font-bold text-base">{userProgress.xp}</span>
                <span className="text-xs">XP</span>
              </div>
            </div>
            
            {/* Compact Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-medium ${currentTheme.textSecondary}`}>Progress to Level {userLevel + 1}</span>
                <span className={`font-bold ${currentTheme.text}`}>{progressPercent}%</span>
              </div>
              <div className={`w-full h-2 ${currentTheme.isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden shadow-inner`}>
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

          {/* Stats Section - Compact 4 Cards in a Row */}
          <div className={`p-4 ${currentTheme.isDark ? 'bg-gradient-to-br from-gray-800 to-gray-750' : 'bg-gradient-to-br from-gray-50 to-gray-100'} rounded-2xl border-2 ${currentTheme.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className={`w-4 h-4 ${currentTheme.primaryText}`} />
              <h3 className={`text-base font-bold ${currentTheme.text}`}>Stats</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {/* Tasks Completed */}
              <div className={`p-3 ${currentTheme.isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${currentTheme.isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>Tasks</span>
                </div>
                <p className={`text-xl font-bold ${currentTheme.text}`}>{tasksCompleted || 0}</p>
              </div>

              {/* Total XP */}
              <div className={`p-3 ${currentTheme.isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className={`w-3.5 h-3.5 ${currentTheme.primaryText}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>Total XP</span>
                </div>
                <p className={`text-xl font-bold ${currentTheme.text}`}>{userTotalXP || 0}</p>
              </div>

              {/* Current Rank */}
              <div className={`p-3 ${currentTheme.isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className={`w-3.5 h-3.5 ${currentTheme.primaryText}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>Rank</span>
                </div>
                <p className={`text-xs font-bold ${currentTheme.text} leading-tight`}>{rankTitle}</p>
              </div>

              {/* Next Level */}
              <div className={`p-3 ${currentTheme.isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg border-2 ${currentTheme.border}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Award className={`w-3.5 h-3.5 ${currentTheme.primaryText}`} />
                  <span className={`text-xs font-medium ${currentTheme.textSecondary}`}>To Lv{userLevel + 1}</span>
                </div>
                <p className={`text-xl font-bold ${currentTheme.text}`}>{xpRemaining}</p>
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className={`flex items-center gap-6 p-6 ${currentTheme.isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl border-2 ${currentTheme.border}`}>
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-r ${currentTheme.primary} flex items-center justify-center text-white font-bold text-3xl shadow-lg`}
            >
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${currentTheme.text} mb-2`}>Profile Picture</h3>
              <button
                onClick={handleAvatarUpload}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${currentTheme.primary} text-white font-medium rounded-xl hover:scale-105 transition-all shadow-md`}
              >
                <Camera className="w-4 h-4" />
                Upload Photo
              </button>
              <p className={`text-xs ${currentTheme.textMuted} mt-2`}>Max size: 5MB. JPG, PNG, GIF</p>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Username
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all`}
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all`}
                placeholder="Enter email"
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className={`pt-4 border-t-2 ${currentTheme.border}`}>
            <h3 className={`text-lg font-bold ${currentTheme.text} mb-4`}>Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="current-password" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                  Current Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all`}
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all`}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className={`block text-sm font-semibold ${currentTheme.textSecondary} mb-2`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textMuted}`} />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all`}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 px-5 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}