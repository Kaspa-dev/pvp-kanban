import { useRef } from "react";
import type { PointerEvent } from "react";
import { Link } from "react-router";
import {
  LevelProgressCard,
  LEVEL_PROGRESS_CARD_VARIANTS,
  LEVEL_PROGRESS_DATA_VARIANTS,
} from "../components/LevelProgressCard";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import type { GamificationSummary } from "../utils/gamification";
import { getLevelTier } from "../utils/levelBadges";

type ProgressSample = {
  key: string;
  label: string;
  username: string;
  fullName: string;
  level: number;
  summary: GamificationSummary | null;
  isLoading?: boolean;
  hasError?: boolean;
};

function createSummary(
  level: number,
  currentLevelXp: number,
  xpForNextLevel: number,
  lifetimeXp: number,
  tasksCompleted: number,
): GamificationSummary {
  const tier = getLevelTier(level);
  const progressPercent = xpForNextLevel > 0
    ? Math.round((currentLevelXp / xpForNextLevel) * 100)
    : 100;

  return {
    lifetimeXp,
    currentLevel: level,
    currentLevelName: `${tier.name} ${level}`,
    currentLevelXp,
    xpForNextLevel,
    xpRemainingForNextLevel: Math.max(0, xpForNextLevel - currentLevelXp),
    progressPercent,
    weeklyXp: Math.round(currentLevelXp / 2),
    monthlyXp: currentLevelXp * 3,
    tasksCompleted,
    prestige: 0,
  };
}

const PROGRESS_SAMPLES: ProgressSample[] = [
  {
    key: "level-1",
    label: "Level 1 - early progress",
    username: "juniper-1",
    fullName: "Juniper Vale",
    level: 1,
    summary: createSummary(1, 5, 20, 5, 1),
  },
  {
    key: "level-25",
    label: "Level 25 - mid progress",
    username: "mako-25",
    fullName: "Mako Rivers",
    level: 25,
    summary: createSummary(25, 84, 160, 2760, 29),
  },
  {
    key: "level-75",
    label: "Level 75 - high progress",
    username: "vesper-75",
    fullName: "Vesper Quinn",
    level: 75,
    summary: createSummary(75, 340, 420, 18840, 128),
  },
  {
    key: "level-149",
    label: "Level 149 - almost capped",
    username: "orbit-149",
    fullName: "Orbit Hale",
    level: 149,
    summary: createSummary(149, 920, 1000, 87420, 311),
  },
  {
    key: "level-150",
    label: "Level 150 - max level",
    username: "solar-150",
    fullName: "Solar Ash",
    level: 150,
    summary: createSummary(150, 0, 0, 91600, 337),
  },
  {
    key: "loading",
    label: "Loading state",
    username: "loading-user",
    fullName: "Loading User",
    level: 42,
    summary: null,
    isLoading: true,
  },
  {
    key: "unavailable",
    label: "Unavailable state",
    username: "offline-user",
    fullName: "Offline User",
    level: 42,
    summary: null,
    hasError: true,
  },
];

export function LevelProgress() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const gridScrollerRef = useRef<HTMLDivElement | null>(null);
  const dataGridScrollerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const dataDragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const pageBgClassName = isDarkMode
    ? "bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.92),#09090b_42%,#050505_100%)]"
    : "bg-[radial-gradient(circle_at_top_left,rgba(248,250,252,1),#eef2f7_44%,#e2e8f0_100%)]";
  const panelClassName = `${isDarkMode ? "border-zinc-800 bg-zinc-950/72" : "border-slate-200 bg-white/82"} shadow-[0_24px_90px_-56px_rgba(15,23,42,0.55)]`;
  const sectionSurfaceClassName = isDarkMode ? "bg-zinc-900/42" : "bg-white/72";
  const productionSample = PROGRESS_SAMPLES[2];
  const scrollbarClassName = isDarkMode
    ? "[scrollbar-color:rgba(113,113,122,0.92)_rgba(24,24,27,0.85)] [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-zinc-900/80"
    : "[scrollbar-color:rgba(100,116,139,0.86)_rgba(226,232,240,0.92)] [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-slate-200/90";

  const handleGridPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const scroller = gridScrollerRef.current;
    if (!scroller) {
      return;
    }

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const handleGridPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging || !gridScrollerRef.current) {
      return;
    }

    event.preventDefault();
    const distance = event.clientX - dragStateRef.current.startX;
    gridScrollerRef.current.scrollLeft = dragStateRef.current.scrollLeft - distance;
  };

  const stopGridDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragStateRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleDataGridPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const scroller = dataGridScrollerRef.current;
    if (!scroller) {
      return;
    }

    dataDragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const handleDataGridPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dataDragStateRef.current.isDragging || !dataGridScrollerRef.current) {
      return;
    }

    event.preventDefault();
    const distance = event.clientX - dataDragStateRef.current.startX;
    dataGridScrollerRef.current.scrollLeft = dataDragStateRef.current.scrollLeft - distance;
  };

  const stopDataGridDrag = (event: PointerEvent<HTMLDivElement>) => {
    dataDragStateRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={`min-h-screen ${pageBgClassName} px-4 py-8 sm:px-6 lg:px-8`}>
      <div className="mx-auto flex max-w-[1900px] flex-col gap-6">
        <header className={`rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8 ${panelClassName}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                to="/levelbadges"
                className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText} hover:underline`}
              >
                Level badge lab
              </Link>
              <h1 className={`font-ui-condensed mt-3 text-4xl font-bold tracking-[0.01em] sm:text-5xl ${currentTheme.text}`}>
                XP Progress Card Lab
              </h1>
              <p className={`mt-3 max-w-3xl text-sm leading-6 sm:text-base ${currentTheme.textSecondary}`}>
                Compact navbar-popover progress cards. Rows are level states, columns are card systems, and the data is fixed so the layout decisions are easy to compare.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className={`rounded-2xl border px-4 py-3 text-sm ${currentTheme.border} ${sectionSurfaceClassName} ${currentTheme.textSecondary}`}>
                Public route: <span className={`font-due-date font-semibold ${currentTheme.text}`}>/levelprogress</span>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-sm ${currentTheme.border} ${sectionSurfaceClassName} ${currentTheme.textSecondary}`}>
                Drag grid horizontally or use the scrollbar
              </div>
            </div>
          </div>
        </header>

        <section className={`rounded-[2rem] border p-5 backdrop-blur-xl ${panelClassName}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>Production preview</p>
              <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Console Strip is currently wired into the navbar popover
              </h2>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${currentTheme.textSecondary}`}>
                The real profile chip uses this same reusable card component, with live summary data when available and lazy loading as a fallback.
              </p>
            </div>
            <div className="w-full max-w-[22rem]">
              <LevelProgressCard
                username={productionSample.username}
                fullName={productionSample.fullName}
                level={productionSample.level}
                summary={productionSample.summary}
                variant="console-strip"
                onViewProfile={() => undefined}
              />
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
          <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
            <div>
              <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>Variant grid</p>
              <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                {LEVEL_PROGRESS_CARD_VARIANTS.length} compact XP card directions
              </h2>
            </div>
            <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
              Each card stays close to the navbar popover footprint. Drag the grid horizontally, use a trackpad, or grab the visible scrollbar.
            </p>
          </div>

          <div
            ref={gridScrollerRef}
            className={`mt-4 cursor-grab overflow-x-auto overscroll-x-contain pb-5 active:cursor-grabbing [scrollbar-width:thin] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full ${scrollbarClassName}`}
            onPointerDown={handleGridPointerDown}
            onPointerMove={handleGridPointerMove}
            onPointerUp={stopGridDrag}
            onPointerCancel={stopGridDrag}
            onPointerLeave={stopGridDrag}
          >
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `minmax(12rem, 0.64fr) repeat(${LEVEL_PROGRESS_CARD_VARIANTS.length}, minmax(21rem, 1fr))`,
                minWidth: `${14 + LEVEL_PROGRESS_CARD_VARIANTS.length * 21.75}rem`,
              }}
            >
              <div className={`font-ui-condensed hidden rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] lg:block ${currentTheme.textMuted}`}>
                State
              </div>
              {LEVEL_PROGRESS_CARD_VARIANTS.map((variant) => (
                <div
                  key={variant.key}
                  className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-slate-50"}`}
                >
                  <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{variant.label}</p>
                  <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>{variant.description}</p>
                </div>
              ))}

              {PROGRESS_SAMPLES.map((sample) => (
                <div key={sample.key} className="contents">
                  <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/70"}`}>
                    <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      {sample.summary ? sample.summary.currentLevelName : sample.isLoading ? "Pending" : "Error"}
                    </p>
                    <p className={`font-ui-condensed mt-1 text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                      {sample.label}
                    </p>
                    <p className={`font-due-date mt-1 text-xs font-semibold ${currentTheme.textMuted}`}>
                      {sample.summary
                        ? `${sample.summary.currentLevelXp} / ${sample.summary.xpForNextLevel || "cap"} XP`
                        : "No summary payload"}
                    </p>
                  </div>

                  {LEVEL_PROGRESS_CARD_VARIANTS.map((variant) => (
                    <article
                      key={`${sample.key}-${variant.key}`}
                      className={`flex min-h-[19rem] items-center justify-center rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}
                    >
                      <LevelProgressCard
                        username={sample.username}
                        fullName={sample.fullName}
                        level={sample.level}
                        summary={sample.summary}
                        variant={variant.key}
                        isLoading={sample.isLoading}
                        hasError={sample.hasError}
                        onViewProfile={() => undefined}
                      />
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
          <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
            <div>
              <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>Data preview grid</p>
              <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Orbit Ribbon Console data options
              </h2>
            </div>
            <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
              Same visual shell, different choices for what the level preview should communicate. Drag horizontally or use the scrollbar.
            </p>
          </div>

          <div
            ref={dataGridScrollerRef}
            className={`mt-4 cursor-grab overflow-x-auto overscroll-x-contain pb-5 active:cursor-grabbing [scrollbar-width:thin] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full ${scrollbarClassName}`}
            onPointerDown={handleDataGridPointerDown}
            onPointerMove={handleDataGridPointerMove}
            onPointerUp={stopDataGridDrag}
            onPointerCancel={stopDataGridDrag}
            onPointerLeave={stopDataGridDrag}
          >
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `minmax(12rem, 0.64fr) repeat(${LEVEL_PROGRESS_DATA_VARIANTS.length}, minmax(21rem, 1fr))`,
                minWidth: `${14 + LEVEL_PROGRESS_DATA_VARIANTS.length * 21.75}rem`,
              }}
            >
              <div className={`font-ui-condensed hidden rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] lg:block ${currentTheme.textMuted}`}>
                State
              </div>
              {LEVEL_PROGRESS_DATA_VARIANTS.map((variant) => (
                <div
                  key={variant.key}
                  className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-slate-50"}`}
                >
                  <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{variant.label}</p>
                  <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>{variant.description}</p>
                </div>
              ))}

              {PROGRESS_SAMPLES.map((sample) => (
                <div key={`data-${sample.key}`} className="contents">
                  <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-slate-50/70"}`}>
                    <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      {sample.summary ? sample.summary.currentLevelName : sample.isLoading ? "Pending" : "Error"}
                    </p>
                    <p className={`font-ui-condensed mt-1 text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                      {sample.label}
                    </p>
                    <p className={`font-due-date mt-1 text-xs font-semibold ${currentTheme.textMuted}`}>
                      {sample.summary
                        ? `${sample.summary.currentLevelXp} / ${sample.summary.xpForNextLevel || "cap"} XP`
                        : "No summary payload"}
                    </p>
                  </div>

                  {LEVEL_PROGRESS_DATA_VARIANTS.map((variant) => (
                    <article
                      key={`${sample.key}-${variant.key}`}
                      className={`flex min-h-[19rem] items-center justify-center rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}
                    >
                      <LevelProgressCard
                        username={sample.username}
                        fullName={sample.fullName}
                        level={sample.level}
                        summary={sample.summary}
                        variant="orbit-ribbon-console"
                        dataVariant={variant.key}
                        isLoading={sample.isLoading}
                        hasError={sample.hasError}
                        onViewProfile={() => undefined}
                      />
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
