import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, Compass, Trophy } from "lucide-react";
import { useNavigate } from "react-router";
import { CoachmarkOverlay } from "../components/CoachmarkOverlay";
import { MilestoneSection } from "../components/profile/MilestoneSection";
import { getMilestoneProgressFillClassName, getMilestoneProgressTrackClassName } from "../components/profile/milestoneProgressStyles";
import { SettingsModal } from "../components/SettingsModal";
import { Skeleton } from "../components/ui/skeleton";
import { Toolbar } from "../components/Toolbar";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { usePageCoachmarks } from "../hooks/usePageCoachmarks";
import {
  fetchCurrentUserMilestones,
  getComingSoonMilestones,
  getDefaultUserMilestonesResponse,
  getInProgressMilestones,
  getUnlockedMilestones,
  groupMilestonesByCategory,
} from "../utils/milestones";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

export function ProfileMilestones() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    preferences,
    hasFetched: hasFetchedPreferences,
    markFlowCompleted,
  } = useUserPreferences();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const [milestoneResponse, setMilestoneResponse] = useState(() => getDefaultUserMilestonesResponse());
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const coachmarks = usePageCoachmarks({
    flowId: "profile-milestones-overview",
    coachmarksEnabled: preferences.coachmarksEnabled,
    completedFlows: preferences.completedFlows,
    hasFetchedPreferences,
    isBlocked: isSettingsOpen || isLoadingMilestones,
    onFlowCompleted: (flowId) => {
      void markFlowCompleted(flowId);
    },
  });

  useEffect(() => {
    let isActive = true;

    const loadMilestones = async () => {
      setIsLoadingMilestones(true);
      setLoadError("");

      try {
        const response = await fetchCurrentUserMilestones();
        if (!isActive) {
          return;
        }

        setMilestoneResponse(response);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setMilestoneResponse(getDefaultUserMilestonesResponse());
        setLoadError(error instanceof Error ? error.message : "Unable to load your milestones right now.");
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
  }, []);

  const unlockedMilestones = useMemo(
    () => getUnlockedMilestones(milestoneResponse.milestones),
    [milestoneResponse.milestones],
  );
  const inProgressMilestones = useMemo(
    () => getInProgressMilestones(milestoneResponse.milestones),
    [milestoneResponse.milestones],
  );
  const comingSoonMilestones = useMemo(
    () => getComingSoonMilestones(milestoneResponse.milestones),
    [milestoneResponse.milestones],
  );
  const groupedMilestones = useMemo(
    () => groupMilestonesByCategory(milestoneResponse.milestones),
    [milestoneResponse.milestones],
  );

  const summaryCards = [
    {
      label: "Unlocked",
      value: unlockedMilestones.length,
      icon: Trophy,
    },
    {
      label: "In Progress",
      value: inProgressMilestones.length,
      icon: Award,
    },
    {
      label: "Locked",
      value: comingSoonMilestones.length,
      icon: Compass,
    },
  ];
  const completionPercent = milestoneResponse.summary.totalCount > 0
    ? Math.round((milestoneResponse.summary.unlockedCount / milestoneResponse.summary.totalCount) * 100)
    : 0;
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() || user.displayName || user.username : "";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
          <div className={`absolute -right-12 top-0 h-72 w-72 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
          <div className={`absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} />

          <div className="relative z-10 flex flex-col gap-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between" data-coachmark="profile-milestones-header">
              <div>
                <h1 className={`font-ui-condensed text-4xl font-semibold tracking-[0.01em] ${currentTheme.text} lg:text-5xl`}>
                  Milestones
                </h1>
              </div>

              <button
                type="button"
                onClick={() => navigate("/app/profile")}
                className={`font-ui-condensed group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-bold tracking-[0.01em] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 ${currentTheme.focus} ${currentTheme.primary}`}
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                Profile
              </button>
            </div>

            <div className={`grid gap-7 border-t pt-6 ${currentTheme.border} xl:grid-cols-[0.78fr_1.22fr]`} data-coachmark="profile-milestones-summary">
              <div className={`rounded-[1.5rem] border px-5 py-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className={`font-due-date text-4xl font-semibold leading-none ${currentTheme.text}`}>{completionPercent}%</p>
                  <p className={`pb-0.5 text-sm ${currentTheme.textMuted}`}>
                    <span className={`font-due-date font-semibold ${currentTheme.text}`}>{milestoneResponse.summary.unlockedCount}</span>
                    {" "}of{" "}
                    <span className={`font-due-date font-semibold ${currentTheme.text}`}>{milestoneResponse.summary.totalCount}</span>
                    {" "}unlocked
                  </p>
                </div>
                <div className={`mt-5 h-2.5 overflow-hidden rounded-full ${getMilestoneProgressTrackClassName(isDarkMode)}`} aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${getMilestoneProgressFillClassName(isDarkMode)} transition-[width] duration-500`}
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              <div className={`relative overflow-hidden rounded-[1.5rem] border-y py-5 ${currentTheme.border}`}>
                <div
                  className={`pointer-events-none absolute inset-y-5 left-0 w-px bg-gradient-to-b from-transparent via-current to-transparent ${currentTheme.primaryText} opacity-50`}
                  aria-hidden="true"
                />
                <div
                  className={`pointer-events-none absolute inset-y-5 right-0 w-px bg-gradient-to-b from-transparent via-current to-transparent ${currentTheme.primaryText} opacity-50`}
                  aria-hidden="true"
                />
                <div className="grid gap-y-5 md:grid-cols-3">
                {summaryCards.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className={`group relative px-5 md:border-r md:last:border-r-0 ${currentTheme.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${currentTheme.primaryBg} ${currentTheme.primaryText} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className={`font-ui-condensed text-base font-semibold tracking-[0.08em] ${currentTheme.textMuted}`}>
                        {label}
                      </p>
                    </div>
                    <p className={`font-due-date mt-4 text-[2.65rem] font-semibold leading-none tracking-[-0.04em] ${currentTheme.primaryText}`}>
                      {value}
                    </p>
                  </div>
                ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {loadError ? (
          <section
            className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
            role="alert"
            aria-live="assertive"
          >
            {loadError}
          </section>
        ) : null}

        <div className="flex flex-col gap-6" data-coachmark="profile-milestones-list">
          {isLoadingMilestones ? (
            <section className={`rounded-[2rem] border p-6 ${currentTheme.border} ${currentTheme.cardBg}`}>
              <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={`rounded-[1.25rem] border p-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                    <Skeleton className="h-4 w-24 rounded-lg" />
                    <Skeleton className="mt-4 h-6 w-40 rounded-lg" />
                    <Skeleton className="mt-3 h-4 w-full rounded-lg" />
                    <Skeleton className="mt-3 h-4 w-3/4 rounded-lg" />
                    <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </section>
          ) : groupedMilestones.length > 0 ? (
            groupedMilestones.map(({ category, milestones }) => (
              <MilestoneSection key={category} category={category} milestones={milestones} />
            ))
          ) : (
            <section className={`rounded-[2rem] border p-8 text-center shadow-[0_24px_90px_-60px_rgba(15,23,42,0.6)] ${currentTheme.border} ${currentTheme.cardBg}`}>
              <h2 className={`font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>No milestones yet</h2>
            </section>
          )}
        </div>
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
