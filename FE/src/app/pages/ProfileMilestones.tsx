import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, Compass, Trophy } from "lucide-react";
import { useNavigate } from "react-router";
import { BanBanLogo } from "../components/BanBanLogo";
import { MilestoneSection } from "../components/profile/MilestoneSection";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
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
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const [milestoneResponse, setMilestoneResponse] = useState(() => getDefaultUserMilestonesResponse());
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  const [loadError, setLoadError] = useState("");

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
      detail: "Permanent achievements already earned",
      icon: Trophy,
    },
    {
      label: "In Progress",
      value: inProgressMilestones.length,
      detail: "Achievements already moving forward",
      icon: Award,
    },
    {
      label: "Coming Up",
      value: comingSoonMilestones.length,
      detail: "Fresh goals waiting for the first action",
      icon: Compass,
    },
  ];

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
            type="button"
            onClick={() => navigate("/app/profile")}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${currentTheme.border} ${currentTheme.textSecondary} ${currentTheme.bg} transition-colors hover:${currentTheme.borderHover}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
        <section className={`relative overflow-hidden rounded-[2.25rem] border ${currentTheme.border} ${currentTheme.cardBg} p-8 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.55)]`}>
          <div className={`absolute -right-12 top-0 h-72 w-72 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${currentTheme.textMuted}`}>Profile Achievements</p>
                <h1 className={`mt-3 text-4xl font-semibold tracking-tight ${currentTheme.text}`}>Milestones</h1>
                <p className={`mt-4 text-base leading-7 ${currentTheme.textSecondary}`}>
                  Every unlocked achievement marks visible progress in the way you organize work, create boards, invite teammates, and run planning poker sessions.
                </p>
              </div>

              <div className="lg:text-right">
                <p className={`text-sm font-semibold ${currentTheme.text}`}>{milestoneResponse.summary.unlockedCount} of {milestoneResponse.summary.totalCount} unlocked</p>
                <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>Tracking starts from this feature rollout onward.</p>
              </div>
            </div>

            <div className={`h-px w-full ${currentTheme.border}`} />

            <div className="grid gap-6 md:grid-cols-3">
              {summaryCards.map(({ label, value, detail, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br ${currentTheme.primary} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>{label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${currentTheme.text}`}>{value}</p>
                    <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>{detail}</p>
                  </div>
                </div>
              ))}
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

        {isLoadingMilestones ? (
          <section className={`rounded-[2rem] border p-6 ${currentTheme.border} ${currentTheme.cardBg}`}>
            <div className="grid gap-4 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={`animate-pulse rounded-[1.25rem] border p-5 ${currentTheme.border} ${currentTheme.bgSecondary}`}>
                  <div className={`h-4 w-24 rounded-full ${currentTheme.primaryBg}`} />
                  <div className={`mt-4 h-6 w-40 rounded-full ${currentTheme.primaryBg}`} />
                  <div className={`mt-3 h-4 w-full rounded-full ${currentTheme.primaryBg}`} />
                  <div className={`mt-3 h-4 w-3/4 rounded-full ${currentTheme.primaryBg}`} />
                  <div className={`mt-5 h-2.5 w-full rounded-full ${currentTheme.primaryBg}`} />
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
            <h2 className={`text-2xl font-semibold ${currentTheme.text}`}>No milestones yet</h2>
            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-6 ${currentTheme.textSecondary}`}>
              This page is ready to track achievements from rollout onward. Complete a task, create a board, invite a teammate, or start planning poker to light up your first card.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
