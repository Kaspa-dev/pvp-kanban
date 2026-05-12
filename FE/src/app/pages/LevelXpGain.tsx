import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Link } from "react-router";
import { Activity, MousePointer2, RefreshCw, Sparkles, Zap } from "lucide-react";
import { LevelXpGainPreview } from "../components/LevelXpGainPreview";
import { getPanelEyebrowClassName } from "../components/typographyStyles";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import {
  LEVEL_XP_GAIN_VARIANTS,
  XP_GAIN_SAMPLES,
} from "../utils/levelXpGain";

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

export function LevelXpGain() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const mutedEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);
  const primaryEyebrowClassName = getPanelEyebrowClassName(currentTheme.primaryText);
  const gridScrollerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [replayKey, setReplayKey] = useState(0);
  const pageBgClassName = isDarkMode
    ? "bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.92),#09090b_42%,#050505_100%)]"
    : "bg-[radial-gradient(circle_at_top_left,rgba(248,250,252,1),#eef2f7_44%,#e2e8f0_100%)]";
  const panelClassName = `${isDarkMode ? "border-zinc-800 bg-zinc-950/72" : "border-slate-200 bg-white/82"} shadow-[0_24px_90px_-56px_rgba(15,23,42,0.55)]`;
  const sectionSurfaceClassName = isDarkMode ? "bg-zinc-900/42" : "bg-white/72";
  const scrollbarClassName = isDarkMode
    ? "[scrollbar-color:rgba(113,113,122,0.92)_rgba(24,24,27,0.85)] [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-zinc-900/80"
    : "[scrollbar-color:rgba(100,116,139,0.86)_rgba(226,232,240,0.92)] [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-slate-200/90";
  const maxXpSample = XP_GAIN_SAMPLES.reduce((max, sample) => Math.max(max, sample.xp), 0);

  const handleGridPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target : null;

    if (
      event.button !== 0 ||
      !gridScrollerRef.current ||
      target?.closest("button, a, input, select, textarea, [role='button'], [role='tab']")
    ) {
      return;
    }

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: gridScrollerRef.current.scrollLeft,
    };
    gridScrollerRef.current.setPointerCapture(event.pointerId);
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

  return (
    <main className={`min-h-screen ${pageBgClassName} px-4 py-8 sm:px-6 lg:px-8`}>
      <div className="mx-auto flex max-w-[1900px] flex-col gap-6">
        <header className={`relative overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8 ${panelClassName}`}>
          <div className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
          <div className={`pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                to="/levelprogress"
                className={`${primaryEyebrowClassName} hover:underline`}
              >
                XP card lab
              </Link>
              <h1 className={`font-ui-condensed mt-3 text-4xl font-bold tracking-[0.01em] sm:text-5xl ${currentTheme.text}`}>
                XP Gain Motion Lab
              </h1>
              <p className={`mt-3 max-w-3xl text-sm leading-6 sm:text-base ${currentTheme.textSecondary}`}>
                Prototype directions for the moment a user earns XP. Rows stress-test different reward cases; columns compare notification surfaces, motion systems, and attention levels side by side.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className={`rounded-2xl border px-4 py-3 text-sm ${currentTheme.border} ${sectionSurfaceClassName} ${currentTheme.textSecondary}`}>
                Public route: <span className={`font-due-date font-semibold ${currentTheme.text}`}>/levelxpgain</span>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-sm ${currentTheme.border} ${sectionSurfaceClassName} ${currentTheme.textSecondary}`}>
                Variants: <span className={`font-due-date font-semibold ${currentTheme.text}`}>{LEVEL_XP_GAIN_VARIANTS.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setReplayKey((current) => current + 1)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.border} ${sectionSurfaceClassName} ${currentTheme.text}`}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Replay animations
              </button>
            </div>
          </div>
        </header>

        <section className={`rounded-[2rem] border p-5 backdrop-blur-xl ${panelClassName}`}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <Sparkles className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
              <p className={`font-ui-condensed mt-3 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Reward surfaces</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                Corner cards, navbar events, task flares, sidebar tickers, and spotlight moments all share the same mock XP data.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <Zap className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
              <p className={`font-ui-condensed mt-3 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Largest sample</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                The heaviest reward row is <span className={`font-due-date font-semibold ${currentTheme.text}`}>+{formatNumber(maxXpSample)} XP</span>, so each variant has to handle dramatic gains.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <MousePointer2 className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
              <p className={`font-ui-condensed mt-3 text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Grid controls</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                Drag horizontally, use a trackpad, grab the visible scrollbar, or replay all motion from the header button.
              </p>
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 backdrop-blur-xl sm:p-5 ${panelClassName}`}>
          <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }}>
            <div>
              <p className={primaryEyebrowClassName}>Variant grid</p>
              <h2 className={`font-ui-condensed mt-2 text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                {LEVEL_XP_GAIN_VARIANTS.length} XP gain animation directions
              </h2>
            </div>
            <p className={`max-w-xl text-sm leading-6 ${currentTheme.textSecondary}`}>
              Every cell is self-contained. This page compares visual language and animation weight only; it does not wire into production XP events yet.
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
                gridTemplateColumns: `minmax(12rem, 0.64fr) repeat(${LEVEL_XP_GAIN_VARIANTS.length}, minmax(20.5rem, 1fr))`,
                minWidth: `${14 + LEVEL_XP_GAIN_VARIANTS.length * 21.25}rem`,
              }}
            >
              <div className={`hidden rounded-2xl px-4 py-3 lg:block ${mutedEyebrowClassName}`}>
                XP event
              </div>

              {LEVEL_XP_GAIN_VARIANTS.map((variant) => (
                <div
                  key={`heading-${variant.key}`}
                  className={`hidden rounded-2xl border px-4 py-3 lg:block ${currentTheme.border} ${sectionSurfaceClassName}`}
                >
                  <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{variant.label}</p>
                  <p className={`mt-1 text-xs leading-5 ${currentTheme.textMuted}`}>{variant.description}</p>
                </div>
              ))}

              {XP_GAIN_SAMPLES.map((sample) => (
                <div key={`row-${sample.key}`} className="contents">
                  <div className={`rounded-2xl border px-4 py-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
                    <div className="flex items-center gap-2">
                      {sample.isLoading ? (
                        <Activity className={`h-4 w-4 ${currentTheme.primaryText}`} aria-hidden="true" />
                      ) : sample.hasError ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${currentTheme.primary}`} aria-hidden="true" />
                      )}
                      <p className={primaryEyebrowClassName}>
                        {sample.isLoading ? "Syncing" : sample.hasError ? "Offline" : `+${formatNumber(sample.xp)} XP`}
                      </p>
                    </div>
                    <p className={`font-ui-condensed mt-2 text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                      {sample.label}
                    </p>
                    <p className={`mt-2 text-sm leading-5 ${currentTheme.textSecondary}`}>
                      {sample.reason}
                    </p>
                    <div className={`font-due-date mt-4 rounded-xl border px-3 py-2 text-xs font-semibold ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-white/70"} ${currentTheme.textMuted}`}>
                      {sample.isMaxLevel
                        ? "Level cap"
                        : sample.previousLevel === sample.nextLevel
                          ? `Lv ${sample.nextLevel} | ${sample.progressBefore}% -> ${sample.progressAfter}%`
                          : `Lv ${sample.previousLevel} -> ${sample.nextLevel}`}
                    </div>
                  </div>

                  {LEVEL_XP_GAIN_VARIANTS.map((variant) => (
                    <div
                      key={`${sample.key}-${variant.key}`}
                      className={`flex min-h-[19.5rem] items-center justify-center rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}
                    >
                      <LevelXpGainPreview
                        sample={sample}
                        variant={variant.key}
                        replayKey={replayKey}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-5 ${panelClassName}`}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Motion rule</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                Reward motion should confirm success quickly, then get out of the user's way. The lab intentionally compares intensity.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Accessibility rule</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                Motion previews use reduced-motion detection so animation-heavy concepts still resolve into readable static states.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${currentTheme.border} ${sectionSurfaceClassName}`}>
              <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Production rule</p>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                This route is a prototype board only. Real XP event wiring, persistence, and notification preferences stay out of scope.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
