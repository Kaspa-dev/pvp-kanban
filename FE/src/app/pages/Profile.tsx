import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  AtSign,
  Award,
  KeyRound,
  Mail,
  Save,
  ShieldAlert,
  Trash2,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { BanBanLogo } from "../components/BanBanLogo";
import { PreferencesSettingsSections } from "../components/PreferencesSettingsSections";
import { useLocalStorageBoolean } from "../hooks/useLocalStorageBoolean";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import {
  changeCurrentUserPassword,
  deleteCurrentUserAccount,
  DeleteCurrentUserBlockedResponse,
  isApiError,
  updateCurrentUserProfile,
} from "../utils/auth";
import {
  fetchCurrentUserProgress,
  getDefaultUserProgress,
  getLevelName,
  getProgressPercent,
  getXPForCurrentLevel,
  getXPNeededForNextLevel,
  getXPRemainingForNextLevel,
  UserProgress,
} from "../utils/gamification";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

function createProfileFormState(user: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}): ProfileFormState {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
  };
}

function parseDeleteBlockedPayload(payload: unknown): DeleteCurrentUserBlockedResponse | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Partial<DeleteCurrentUserBlockedResponse>;
  if (
    typeof candidate.message !== "string" ||
    typeof candidate.ownedBoardsCount !== "number" ||
    typeof candidate.ownedTeamsCount !== "number" ||
    typeof candidate.reportedTasksCount !== "number"
  ) {
    return null;
  }

  return {
    message: candidate.message,
    ownedBoardsCount: candidate.ownedBoardsCount,
    ownedTeamsCount: candidate.ownedTeamsCount,
    reportedTasksCount: candidate.reportedTasksCount,
  };
}

export function Profile() {
  const navigate = useNavigate();
  const { user, logout, setCurrentUser } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);

  const [gamificationEnabled, setGamificationEnabled] = useLocalStorageBoolean("settings.gamification", true);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorageBoolean("settings.notifications", true);

  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    if (!user) {
      return getDefaultUserProgress();
    }

    return {
      ...getDefaultUserProgress(),
      username: user.displayName,
      email: user.email,
    };
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => (
    user ? createProfileFormState(user) : { firstName: "", lastName: "", username: "", email: "" }
  ));
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteBlocked, setDeleteBlocked] = useState<DeleteCurrentUserBlockedResponse | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm(createProfileFormState(user));
    setUserProgress((current) => ({
      ...current,
      username: user.displayName,
      email: user.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isActive = true;

    const loadProgress = async () => {
      setIsLoadingProgress(true);
      try {
        const progress = await fetchCurrentUserProgress();
        if (!isActive) {
          return;
        }

        setUserProgress({
          username: user.displayName,
          email: user.email,
          xp: progress.xp,
          level: progress.level,
          tasksCompleted: progress.tasksCompleted,
        });
      } catch {
        if (!isActive) {
          return;
        }

        setUserProgress((current) => ({
          ...current,
          username: user.displayName,
          email: user.email,
        }));
      } finally {
        if (isActive) {
          setIsLoadingProgress(false);
        }
      }
    };

    void loadProgress();

    return () => {
      isActive = false;
    };
  }, [user]);

  const profileDisplayName = useMemo(() => (
    `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`.trim()
  ), [profileForm.firstName, profileForm.lastName]);

  const profileIsDirty = useMemo(() => {
    if (!user) {
      return false;
    }

    return (
      profileForm.firstName !== user.firstName ||
      profileForm.lastName !== user.lastName ||
      profileForm.username !== user.username ||
      profileForm.email !== user.email
    );
  }, [profileForm, user]);

  const userLevel = userProgress.level;
  const progressPercent = getProgressPercent(userProgress.xp, userLevel);
  const xpInLevel = getXPForCurrentLevel(userProgress.xp, userLevel);
  const xpNeeded = getXPNeededForNextLevel(userLevel);
  const xpRemaining = getXPRemainingForNextLevel(userProgress.xp, userLevel);
  const rankTitle = getLevelName(userLevel);
  const sectionShellClassName = `rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]`;
  const pillClassName = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.textSecondary}`;
  const inputClassName = `w-full rounded-2xl border-2 px-4 py-3 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} focus:outline-none focus:ring-2 ${currentTheme.focus}`;
  const iconInputClassName = `w-full rounded-2xl border-2 pl-11 pr-4 py-3 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} focus:outline-none focus:ring-2 ${currentTheme.focus}`;
  const infoMessageClassName = "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700";
  const errorMessageClassName = "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

  if (!user) {
    return null;
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const trimmedProfile = {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
    };

    if (!trimmedProfile.firstName || !trimmedProfile.lastName || !trimmedProfile.username || !trimmedProfile.email) {
      setProfileError("All profile fields are required.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedUser = await updateCurrentUserProfile(trimmedProfile);
      setCurrentUser(updatedUser);
      setProfileForm(createProfileFormState(updatedUser));
      setUserProgress((current) => ({
        ...current,
        username: updatedUser.displayName,
        email: updatedUser.email,
      }));
      setProfileSuccess("Your profile details were updated.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update your profile right now.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      setPasswordError("Fill in all password fields before saving.");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changeCurrentUserPassword(passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordSuccess("Your password was changed successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change your password right now.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteError("");
    setDeleteBlocked(null);

    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm account removal.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      await deleteCurrentUserAccount();
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        const blockedPayload = parseDeleteBlockedPayload(error.payload);
        if (blockedPayload) {
          setDeleteBlocked(blockedPayload);
        }
      }

      setDeleteError(error instanceof Error ? error.message : "Unable to delete your account right now.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className={workspaceSurface.pageClassName}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <header
        className={workspaceSurface.glassHeaderClassName}
        style={workspaceSurface.glassHeaderStyle}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <BanBanLogo size="lg" />
          <button
            onClick={() => navigate("/app")}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${currentTheme.border} ${currentTheme.textSecondary} ${currentTheme.bg} transition-colors hover:${currentTheme.borderHover}`}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
        <section className={`relative overflow-hidden rounded-[2.25rem] border ${currentTheme.border} ${currentTheme.cardBg} p-8 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.55)]`}>
          <div className={`absolute -right-10 top-0 h-72 w-72 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.45fr_0.85fr]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className={`flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-gradient-to-br ${currentTheme.primary} text-3xl font-bold text-white shadow-lg`}>
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-4">
                <span className={pillClassName}>
                  <ShieldAlert className={`h-3.5 w-3.5 ${currentTheme.primaryText}`} />
                  Premium account hub
                </span>
                <div>
                  <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${currentTheme.textMuted}`}>
                    Account Center
                  </p>
                  <h1 className={`mt-3 text-4xl font-semibold tracking-tight ${currentTheme.text}`}>{profileDisplayName || user.displayName}</h1>
                  <p className={`mt-2 text-sm ${currentTheme.textSecondary}`}>
                    @{profileForm.username} | {profileForm.email}
                  </p>
                </div>
                <p className={`max-w-2xl text-base leading-7 ${currentTheme.textSecondary}`}>
                  Keep your profile polished, tune your workspace comfort, and handle security-critical changes without bouncing between screens.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className={`rounded-[1.5rem] border p-4 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Identity</p>
                    <p className={`mt-3 text-sm font-medium ${currentTheme.text}`}>Visible everywhere</p>
                    <p className={`mt-1 text-sm leading-6 ${currentTheme.textSecondary}`}>Boards, mentions, and shared spaces refresh from this profile instantly.</p>
                  </div>
                  <div className={`rounded-[1.5rem] border p-4 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Experience</p>
                    <p className={`mt-3 text-sm font-medium ${currentTheme.text}`}>{userProgress.tasksCompleted} tasks closed</p>
                    <p className={`mt-1 text-sm leading-6 ${currentTheme.textSecondary}`}>Your progress stays close while you manage the rest of your account.</p>
                  </div>
                  <div className={`rounded-[1.5rem] border p-4 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>Security</p>
                    <p className={`mt-3 text-sm font-medium ${currentTheme.text}`}>One trusted place</p>
                    <p className={`mt-1 text-sm leading-6 ${currentTheme.textSecondary}`}>Password changes and deletion controls stay separate and clearly explained.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div className={`rounded-[1.75rem] border p-6 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className={`h-5 w-5 ${currentTheme.primaryText}`} />
                  <span className={`text-lg font-semibold ${currentTheme.text}`}>Level {userLevel}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
                  {rankTitle}
                </span>
              </div>

              <div className={`mb-3 flex items-center gap-2 ${currentTheme.textSecondary}`}>
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{userProgress.xp} XP earned</span>
                {isLoadingProgress && <span className={`text-xs ${currentTheme.textMuted}`}>Refreshing...</span>}
              </div>

              <div className="mb-2 flex items-center justify-between text-xs">
                <span className={currentTheme.textSecondary}>Progress to Level {userLevel + 1}</span>
                <span className={`font-semibold ${currentTheme.text}`}>{progressPercent}%</span>
              </div>

              <div className={`h-2.5 w-full overflow-hidden rounded-full ${currentTheme.isDark ? "bg-gray-700/80" : "bg-slate-200"}`}>
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${currentTheme.primary} transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className={`mt-2 flex items-center justify-between text-xs ${currentTheme.textMuted}`}>
                <span>{xpInLevel} / {xpNeeded} XP</span>
                <span>{xpRemaining} to go</span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className={`rounded-[1.25rem] border p-3 ${currentTheme.border} ${currentTheme.bg}`}>
                  <p className={`text-xs font-medium ${currentTheme.textMuted}`}>Tasks</p>
                  <p className={`mt-1 text-xl font-semibold ${currentTheme.text}`}>{userProgress.tasksCompleted}</p>
                </div>
                <div className={`rounded-[1.25rem] border p-3 ${currentTheme.border} ${currentTheme.bg}`}>
                  <p className={`text-xs font-medium ${currentTheme.textMuted}`}>XP</p>
                  <p className={`mt-1 text-xl font-semibold ${currentTheme.text}`}>{userProgress.xp}</p>
                </div>
                <div className={`rounded-[1.25rem] border p-3 ${currentTheme.border} ${currentTheme.bg}`}>
                  <p className={`text-xs font-medium ${currentTheme.textMuted}`}>Rank</p>
                  <p className={`mt-1 text-sm font-semibold ${currentTheme.text}`}>{rankTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className={sectionShellClassName}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>Public identity</p>
                <h2 className={`mt-3 text-3xl font-semibold tracking-tight ${currentTheme.text}`}>Profile Details</h2>
                <p className={`mt-2 text-sm leading-6 ${currentTheme.textMuted}`}>
                  Update the information teammates see across boards and activity.
                </p>
              </div>
              <div className={pillClassName}>
                Changes apply immediately
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>First Name</span>
                  <div className="relative">
                    <UserIcon className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
                      className={iconInputClassName}
                      placeholder="Enter your first name"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>Last Name</span>
                  <div className="relative">
                    <UserIcon className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
                      className={iconInputClassName}
                      placeholder="Enter your last name"
                    />
                  </div>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>Username</span>
                  <div className="relative">
                    <AtSign className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
                      className={iconInputClassName}
                      placeholder="Choose a username"
                    />
                  </div>
                  <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                    This is how teammates can search for and mention you.
                  </p>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>Email</span>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} />
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                      className={iconInputClassName}
                      placeholder="name@example.com"
                    />
                  </div>
                  <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                    Future sign-ins will use this email address after you save.
                  </p>
                </label>
              </div>

              {profileError && (
                <div className={errorMessageClassName}>
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className={infoMessageClassName}>
                  {profileSuccess}
                </div>
              )}

              <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-6 ${currentTheme.border}`}>
                <p className={`text-sm ${currentTheme.textMuted}`}>
                  Display name preview: <span className={`font-semibold ${currentTheme.text}`}>{profileDisplayName || "Incomplete name"}</span>
                </p>
                <button
                  type="submit"
                  disabled={!profileIsDirty || isSavingProfile}
                  className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg transition-all ${currentTheme.primary} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </section>

          <section className={sectionShellClassName}>
            <div className="mb-6">
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>Workspace comfort</p>
              <h2 className={`mt-3 text-3xl font-semibold tracking-tight ${currentTheme.text}`}>Preferences</h2>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textMuted}`}>
                Tailor your workspace visuals and assistance settings.
              </p>
            </div>
            <PreferencesSettingsSections
              gamificationEnabled={gamificationEnabled}
              onGamificationChange={setGamificationEnabled}
              notificationsEnabled={notificationsEnabled}
              onNotificationsChange={setNotificationsEnabled}
            />
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={sectionShellClassName}>
            <div className="mb-6 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${currentTheme.primary} text-white shadow-md`}>
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>Access protection</p>
                <h2 className={`mt-3 text-3xl font-semibold tracking-tight ${currentTheme.text}`}>Security</h2>
                <p className={`mt-2 text-sm leading-6 ${currentTheme.textMuted}`}>
                  Change your password with your current credentials.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handlePasswordSubmit}>
              <label className="block">
                <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>Current Password</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className={inputClassName}
                  placeholder="Enter your current password"
                />
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>New Password</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className={inputClassName}
                  placeholder="Choose a new password"
                />
                <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                  Passwords must be at least 8 characters long.
                </p>
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>Confirm New Password</span>
                <input
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmNewPassword: event.target.value }))}
                  className={inputClassName}
                  placeholder="Re-enter your new password"
                />
              </label>

              {passwordError && (
                <div className={errorMessageClassName}>
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className={infoMessageClassName}>
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPassword}
                className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg transition-all ${currentTheme.primary} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <KeyRound className="h-4 w-4" />
                {isChangingPassword ? "Updating..." : "Change Password"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-red-200 bg-[linear-gradient(180deg,rgba(254,242,242,0.96),rgba(255,255,255,0.94))] p-8 shadow-[0_28px_90px_-55px_rgba(153,27,27,0.5)]">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-red-500/10 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">Destructive action</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-red-950">Danger Zone</h2>
                <p className="mt-2 text-sm leading-6 text-red-800">
                  Permanently remove your account when it is safe to do so. This action cannot be undone.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleDeleteAccount}>
              <div className="rounded-[1.5rem] border border-red-200 bg-white/90 px-4 py-4 text-sm text-red-900 shadow-sm">
                Account deletion is blocked while you still own boards or teams, or while tasks still point to you as the reporter.
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-red-900">Type DELETE to confirm</span>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  className="w-full rounded-2xl border-2 border-red-200 bg-white px-4 py-3 text-red-950 focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="DELETE"
                  aria-describedby="delete-account-hint"
                />
                <p id="delete-account-hint" className="mt-2 text-xs text-red-700">
                  You will be signed out immediately if deletion succeeds.
                </p>
              </label>

              {deleteBlocked && (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">{deleteBlocked.message}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Owned boards: {deleteBlocked.ownedBoardsCount}</li>
                        <li>Owned teams: {deleteBlocked.ownedTeamsCount}</li>
                        <li>Reported tasks: {deleteBlocked.reportedTasksCount}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {deleteError && (
                <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <button
                type="submit"
                disabled={isDeletingAccount}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

