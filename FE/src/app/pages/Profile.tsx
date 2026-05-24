import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Award,
  CalendarDays,
  ClipboardCheck,
  Edit3,
  LoaderCircle,
  Mail,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { AppAvatar } from "../components/AppAvatar";
import { CoachmarkOverlay } from "../components/CoachmarkOverlay";
import { LevelNumberBadge } from "../components/LevelNumberBadge";
import { getMilestoneProgressFillClassName, getMilestoneProgressTrackClassName } from "../components/profile/milestoneProgressStyles";
import { SettingsModal } from "../components/SettingsModal";
import { Toolbar } from "../components/Toolbar";
import { getPanelEyebrowClassName } from "../components/typographyStyles";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";
import { useGamificationSummary } from "../contexts/GamificationSummaryContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { usePageCoachmarks } from "../hooks/usePageCoachmarks";
import {
  deleteCurrentUserAccount,
  isApiError,
  NAME_MAX_LENGTH,
  updateCurrentUserProfile,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  type DeleteCurrentUserBlockedResponse,
} from "../utils/auth";
import { getDefaultGamificationSummary } from "../utils/gamification";
import {
  fetchCurrentUserMilestones,
  formatMilestoneDate,
  getDefaultUserMilestonesResponse,
  type UserMilestoneSummary,
} from "../utils/milestones";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

type ProfileFormState = {
  username: string;
  firstName: string;
  lastName: string;
};

function createProfileFormState(user: {
  username: string;
  firstName: string;
  lastName: string;
}): ProfileFormState {
  return {
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
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
  const {
    preferences,
    hasFetched: hasFetchedPreferences,
    markFlowCompleted,
  } = useUserPreferences();
  const {
    summary: loadedGamificationSummary,
    isLoading: isLoadingProgress,
  } = useGamificationSummary();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const panelEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => (
    user ? createProfileFormState(user) : { username: "", firstName: "", lastName: "" }
  ));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteBlocked, setDeleteBlocked] = useState<DeleteCurrentUserBlockedResponse | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [milestoneSummary, setMilestoneSummary] = useState<UserMilestoneSummary>(() => getDefaultUserMilestonesResponse().summary);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  const [milestonesError, setMilestonesError] = useState("");

  const coachmarks = usePageCoachmarks({
    flowId: "profile-overview",
    coachmarksEnabled: preferences.coachmarksEnabled,
    completedFlows: preferences.completedFlows,
    hasFetchedPreferences,
    isBlocked:
      isSettingsOpen ||
      isEditingProfile ||
      isSavingProfile ||
      isDeletingAccount ||
      isLoadingProgress ||
      isLoadingMilestones,
    onFlowCompleted: (flowId) => {
      void markFlowCompleted(flowId);
    },
  });

  useEffect(() => {
    if (!user || isEditingProfile) {
      return;
    }

    setProfileForm(createProfileFormState(user));
  }, [isEditingProfile, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isActive = true;

    const loadMilestones = async () => {
      setIsLoadingMilestones(true);
      setMilestonesError("");

      try {
        const response = await fetchCurrentUserMilestones();
        if (!isActive) {
          return;
        }

        setMilestoneSummary(response.summary);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setMilestoneSummary(getDefaultUserMilestonesResponse().summary);
        setMilestonesError(error instanceof Error ? error.message : "Unable to load milestones right now.");
      } finally {
        if (isActive) {
          setIsLoadingMilestones(false);
        }
      }
    };

    void loadMilestones();

    return () => {
      isActive = false;
    };
  }, [user]);

  const gamificationSummary = loadedGamificationSummary ?? getDefaultGamificationSummary();
  const fullName = useMemo(() => {
    if (!user) {
      return "";
    }

    return `${user.firstName} ${user.lastName}`.trim() || user.displayName || user.username;
  }, [user]);

  const quickStats = useMemo(() => [
    {
      label: "Lifetime XP",
      value: `${formatNumber(gamificationSummary.lifetimeXp)} XP`,
      icon: Zap,
    },
    {
      label: "Tasks Closed",
      value: formatNumber(gamificationSummary.tasksCompleted),
      icon: ClipboardCheck,
    },
    {
      label: "This Week",
      value: `+${formatNumber(gamificationSummary.weeklyXp)} XP`,
      icon: CalendarDays,
    },
    {
      label: "This Month",
      value: `+${formatNumber(gamificationSummary.monthlyXp)} XP`,
      icon: Sparkles,
    },
  ], [gamificationSummary]);

  const milestonePercent = milestoneSummary.totalCount > 0
    ? Math.round((milestoneSummary.unlockedCount / milestoneSummary.totalCount) * 100)
    : 0;
  const progressPercent = Math.max(0, Math.min(100, gamificationSummary.progressPercent));
  const nextLevel = gamificationSummary.xpForNextLevel > 0 ? gamificationSummary.currentLevel + 1 : null;
  const levelProgressLabel = nextLevel
    ? `${formatNumber(gamificationSummary.currentLevelXp)} / ${formatNumber(gamificationSummary.xpForNextLevel)} XP`
    : `${formatNumber(gamificationSummary.lifetimeXp)} lifetime XP`;
  const levelProgressHint = nextLevel
    ? `${formatNumber(gamificationSummary.xpRemainingForNextLevel)} XP until Level ${nextLevel}`
    : "Current level cap reached";
  const highlightedMilestones = milestoneSummary.recentUnlocked.length > 0
    ? milestoneSummary.recentUnlocked.slice(0, 3)
    : milestoneSummary.upcoming.slice(0, 3);
  const highlightedMilestoneMode = milestoneSummary.recentUnlocked.length > 0 ? "recent" : "upcoming";
  const trimmedProfileForm = useMemo(() => ({
    username: profileForm.username.trim(),
    firstName: profileForm.firstName.trim(),
    lastName: profileForm.lastName.trim(),
  }), [profileForm]);
  const isProfileDirty = user
    ? trimmedProfileForm.username !== user.username ||
      trimmedProfileForm.firstName !== user.firstName ||
      trimmedProfileForm.lastName !== user.lastName
    : false;
  const isProfileFormComplete = Boolean(
    trimmedProfileForm.username &&
    trimmedProfileForm.firstName &&
    trimmedProfileForm.lastName,
  );
  const canSaveProfile = isProfileDirty && isProfileFormComplete && !isSavingProfile;
  const inputClassName = `w-full rounded-2xl border-2 px-4 py-3 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} focus:outline-none focus:ring-2 ${currentTheme.focus}`;
  const iconInputClassName = `w-full rounded-2xl border-2 py-3 pl-11 pr-4 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} focus:outline-none focus:ring-2 ${currentTheme.focus}`;
  const errorMessageClassName = isDarkMode
    ? "rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
    : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleStartEditingProfile = () => {
    if (!user) {
      return;
    }

    setProfileForm(createProfileFormState(user));
    setIsEditingProfile(true);
  };

  const handleCancelEditingProfile = () => {
    if (user) {
      setProfileForm(createProfileFormState(user));
    }

    setIsEditingProfile(false);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canSaveProfile) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedUser = await updateCurrentUserProfile({
        email: user.email,
        username: trimmedProfileForm.username,
        firstName: trimmedProfileForm.firstName,
        lastName: trimmedProfileForm.lastName,
      });

      setCurrentUser(updatedUser);
      setProfileForm(createProfileFormState(updatedUser));
      setIsEditingProfile(false);
      showSuccessToast("Profile updated.");
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Unable to update your profile right now.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (deleteConfirmation !== "DELETE" || isDeletingAccount) {
      return;
    }

    setDeleteBlocked(null);
    setIsDeletingAccount(true);

    try {
      await deleteCurrentUserAccount();
      showSuccessToast("Account deleted.");
      await logout();
      navigate("/login");
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setDeleteBlocked(parseDeleteBlockedPayload(error.payload));
        showErrorToast(error.message);
      } else {
        showErrorToast(error instanceof Error ? error.message : "Unable to delete your account right now.");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={workspaceSurface.pageClassName}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <Toolbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onProfileClick={() => navigate("/app/profile")}
        onReplayCurrentHints={preferences.coachmarksEnabled ? coachmarks.startFlow : undefined}
        userProfile={{
          username: user.username,
          fullName,
          subtitle: user.email,
        }}
      />

      <main className="relative z-10 px-6 py-10">
        <div className="mx-auto flex w-full max-w-[1850px] flex-col gap-6">
          <section className={`${workspaceSurface.elevatedPanelSurfaceClassName} relative overflow-hidden rounded-[2rem] px-6 py-7 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.55)] lg:px-8 lg:py-8`}>
            <div className={`absolute -right-16 top-0 h-80 w-80 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
            <div className={`absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} />

            <div className="relative flex min-w-0 flex-col gap-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between" data-coachmark="profile-identity">
                <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-center">
                  <AppAvatar
                    username={user.username}
                    size={104}
                    fullName={fullName}
                    level={null}
                    className="shrink-0 shadow-[0_26px_60px_-34px_rgba(15,23,42,0.55)]"
                  />

                  <div className="min-w-0 flex-1">
                    {!isEditingProfile ? (
                      <>
                        <h1 className={`font-ui-condensed mt-3 text-4xl font-semibold tracking-[0.01em] ${currentTheme.text} lg:text-5xl`}>
                          {fullName}
                        </h1>
                        <div className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${currentTheme.textSecondary}`}>
                          <span className="inline-flex items-center gap-2">
                            <UserRound className={`h-4 w-4 ${currentTheme.primaryText}`} />
                            @{user.username}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Mail className={`h-4 w-4 ${currentTheme.primaryText}`} />
                            {user.email}
                          </span>
                        </div>
                      </>
                    ) : (
                      <form className="space-y-5" onSubmit={handleProfileSubmit}>
                        <div className="grid gap-4 md:grid-cols-3">
                          <label className="block">
                            <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>First name</span>
                            <input
                              type="text"
                              value={profileForm.firstName}
                              maxLength={NAME_MAX_LENGTH}
                              onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
                              className={inputClassName}
                              placeholder="First name"
                            />
                            <p className={`mt-2 flex items-center justify-between gap-3 text-xs ${currentTheme.textMuted}`}>
                              <span>Up to {NAME_MAX_LENGTH} characters.</span>
                              <span className="font-due-date">{profileForm.firstName.length}/{NAME_MAX_LENGTH}</span>
                            </p>
                          </label>
                          <label className="block">
                            <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>Last name</span>
                            <input
                              type="text"
                              value={profileForm.lastName}
                              maxLength={NAME_MAX_LENGTH}
                              onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
                              className={inputClassName}
                              placeholder="Last name"
                            />
                            <p className={`mt-2 flex items-center justify-between gap-3 text-xs ${currentTheme.textMuted}`}>
                              <span>Up to {NAME_MAX_LENGTH} characters.</span>
                              <span className="font-due-date">{profileForm.lastName.length}/{NAME_MAX_LENGTH}</span>
                            </p>
                          </label>
                          <label className="block">
                            <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>Nickname</span>
                            <div className="relative">
                              <AtSign className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} />
                              <input
                                type="text"
                                value={profileForm.username}
                                maxLength={USERNAME_MAX_LENGTH}
                                onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
                                className={iconInputClassName}
                                placeholder="Nickname"
                              />
                            </div>
                            <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                              {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters.
                            </p>
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="submit"
                            disabled={!canSaveProfile}
                            className={`font-ui-condensed inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold tracking-[0.01em] text-white shadow-lg transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${currentTheme.focus} ${currentTheme.primary}`}
                          >
                            {isSavingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditingProfile}
                            disabled={isSavingProfile}
                            className={`font-ui-condensed inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.textSecondary} ${currentTheme.focus}`}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={handleStartEditingProfile}
                    className={`font-ui-condensed group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold tracking-[0.01em] text-white shadow-lg transition-all duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus} ${currentTheme.primary}`}
                  >
                    <Edit3 className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-3deg]" />
                    Edit profile
                  </button>
                ) : null}
              </div>

                <div className={`rounded-[1.5rem] border px-5 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`} data-coachmark="profile-level-progress">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className={`font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                          Level <span className="font-due-date">{gamificationSummary.currentLevel}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-left lg:text-right">
                      {isLoadingProgress ? (
                        <Skeleton className="h-6 w-36 rounded-lg lg:ml-auto" />
                      ) : (
                        <p className={`font-due-date text-lg font-semibold ${currentTheme.text}`}>
                          {Math.round(progressPercent)}%
                        </p>
                      )}
                      <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>{levelProgressHint}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <LevelNumberBadge level={gamificationSummary.currentLevel} size="sm" />
                    <div className={`h-3 overflow-hidden rounded-full ${isDarkMode ? "bg-zinc-800" : "bg-slate-200"}`} aria-hidden="true">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${currentTheme.primary} transition-[width] duration-500`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {nextLevel ? (
                      <LevelNumberBadge level={nextLevel} size="sm" />
                    ) : (
                      <span className={`font-due-date rounded-full px-3 py-1.5 text-xs font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
                        CAP
                      </span>
                    )}
                  </div>

                  <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 text-sm ${currentTheme.textMuted}`}>
                    <span className="font-due-date">{levelProgressLabel}</span>
                  </div>
                </div>

                <div className={`grid gap-3 border-t pt-6 ${currentTheme.border} sm:grid-cols-2 xl:grid-cols-4`} data-coachmark="profile-xp-stats">
                  {quickStats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div
                        key={stat.label}
                        className={`group rounded-[1.35rem] border px-4 py-4 ${currentTheme.border} ${currentTheme.bgSecondary} transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:${currentTheme.borderHover} hover:shadow-[0_18px_45px_-34px_rgba(15,23,42,0.55)]`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className={panelEyebrowClassName}>{stat.label}</p>
                          <Icon className={`h-4 w-4 ${currentTheme.primaryText}`} />
                        </div>
                        {isLoadingProgress ? (
                          <Skeleton className="mt-4 h-7 w-24 rounded-lg" />
                        ) : (
                          <p className={`font-due-date mt-4 text-2xl font-semibold leading-none ${currentTheme.text}`}>
                            {stat.value}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
            </div>
          </section>

          <section className={`rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} px-6 py-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)]`} data-coachmark="profile-milestones">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary} shadow-md`}>
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className={`font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                      Milestones
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-6 border-t pt-6 ${currentTheme.border}`}>
              {milestonesError ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${isDarkMode ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}
                  role="alert"
                  aria-live="assertive"
                >
                  {milestonesError}
                </div>
              ) : null}

              {isLoadingMilestones ? (
                <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className={`rounded-[1.5rem] border px-5 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                    <Skeleton className="h-4 w-28 rounded-lg" />
                    <Skeleton className="mt-5 h-8 w-32 rounded-lg" />
                    <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
                  </div>
                  <div className={`rounded-[1.5rem] border px-5 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                    <Skeleton className="h-4 w-36 rounded-lg" />
                    <div className="mt-5 space-y-4">
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className={`flex flex-col justify-between rounded-[1.5rem] border px-5 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <p className={`font-due-date mt-4 text-4xl font-semibold leading-none ${currentTheme.text}`}>
                        {milestonePercent}%
                      </p>
                      <p className={`pb-0.5 text-sm ${currentTheme.textMuted}`}>
                        <span className={`font-due-date font-semibold ${currentTheme.text}`}>
                          {milestoneSummary.unlockedCount}
                        </span>{" "}
                        unlocked,{" "}
                        <span className={`font-due-date font-semibold ${currentTheme.text}`}>
                          {Math.max(milestoneSummary.totalCount - milestoneSummary.unlockedCount, 0)}
                        </span>{" "}
                        locked
                      </p>
                    </div>
                    <div className={`mt-6 h-2.5 overflow-hidden rounded-full ${getMilestoneProgressTrackClassName(isDarkMode)}`} aria-hidden="true">
                      <div
                        className={`h-full rounded-full ${getMilestoneProgressFillClassName(isDarkMode)}`}
                        style={{ width: `${milestonePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                          {highlightedMilestoneMode === "recent" ? "Recent milestones" : "Upcoming milestones"}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/app/profile/milestones")}
                        className={`font-ui-condensed group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold tracking-[0.01em] text-white shadow-lg transition-all duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus} ${currentTheme.primary}`}
                      >
                        View all
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </button>
                    </div>

                    <div className={`mt-5 divide-y ${currentTheme.border}`}>
                      {highlightedMilestones.length > 0 ? (
                        highlightedMilestones.map((milestone) => (
                          <div key={milestone.key} className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{milestone.title}</p>
                              <p className={`mt-1 line-clamp-2 text-sm leading-6 ${currentTheme.textMuted}`}>
                                {highlightedMilestoneMode === "recent"
                                  ? `Unlocked ${formatMilestoneDate(milestone.unlockedAtUtc)}`
                                  : milestone.description}
                              </p>
                            </div>
                            <span className={`font-due-date shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${currentTheme.primaryBg} ${currentTheme.primaryText}`}>
                              {highlightedMilestoneMode === "recent" ? "Done" : "Next"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className={`py-4 text-sm ${currentTheme.textMuted}`}>
                          No milestones yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={`rounded-[2rem] border px-6 py-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)] ${isDarkMode ? "border-red-400/20 bg-red-950/10" : "border-red-200 bg-red-50/70"}`} data-coachmark="profile-danger-zone">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isDarkMode ? "bg-red-400/15 text-red-200" : "bg-red-100 text-red-700"}`}>
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className={`font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                      Delete account
                    </h2>
                    <p className={`mt-2 max-w-3xl text-sm leading-6 ${currentTheme.textMuted}`}>
                      Permanently remove your account and personal profile data. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <form className="w-full max-w-xl space-y-4" onSubmit={handleDeleteAccount}>
                <label className="block">
                  <span className={`mb-2 block text-sm font-semibold ${currentTheme.textSecondary}`}>
                    Type DELETE to confirm
                  </span>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) => {
                      setDeleteConfirmation(event.target.value);
                      setDeleteBlocked(null);
                    }}
                    className={`w-full rounded-2xl border-2 px-4 py-3 ${isDarkMode ? "border-red-400/25 bg-red-950/20 text-red-50 placeholder:text-red-200/45 focus:ring-red-300/35" : "border-red-200 bg-white text-red-950 placeholder:text-red-300 focus:ring-red-400/25"} focus:outline-none focus:ring-2`}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </label>

                {deleteBlocked ? (
                  <div className={errorMessageClassName} role="alert" aria-live="assertive">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p>{deleteBlocked.message}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <span>
                            <span className="font-due-date font-semibold">{deleteBlocked.ownedBoardsCount}</span> owned boards
                          </span>
                          <span>
                            <span className="font-due-date font-semibold">{deleteBlocked.ownedTeamsCount}</span> owned teams
                          </span>
                          <span>
                            <span className="font-due-date font-semibold">{deleteBlocked.reportedTasksCount}</span> reported tasks
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={deleteConfirmation !== "DELETE" || isDeletingAccount}
                  className={`font-ui-condensed inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-[0.01em] text-white shadow-lg transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:cursor-not-allowed disabled:opacity-60 ${isDarkMode ? "bg-red-500 hover:bg-red-400" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {isDeletingAccount ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete account
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenProfile={() => navigate("/app/profile")}
        onOpenMyTasks={() => navigate("/app/my-tasks")}
      />
      <CoachmarkOverlay
        isOpen={coachmarks.activeFlowId !== null}
        step={coachmarks.activeStep}
        targetRect={coachmarks.targetRect}
        stepIndex={coachmarks.stepIndex}
        totalSteps={coachmarks.totalSteps}
        onBack={coachmarks.goToPreviousStep}
        onNext={coachmarks.goToNextStep}
        onClose={() => coachmarks.closeFlow(true)}
      />
    </div>
  );
}
