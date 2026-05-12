import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Flame,
  Gauge,
  GitCommitHorizontal,
  LoaderCircle,
  Radio,
  Sparkles,
  Terminal,
  Trophy,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AppAvatar } from "./AppAvatar";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import type { LevelXpGainVariant, XpGainSample } from "../utils/levelXpGain";

interface LevelXpGainPreviewProps {
  sample: XpGainSample;
  variant: LevelXpGainVariant;
  replayKey: number;
}

const previewEase = [0.22, 1, 0.36, 1] as const;
const replayLoop = {
  repeat: Infinity,
  repeatDelay: 1.55,
  repeatType: "loop" as const,
};

function loopTransition(duration: number, delay = 0) {
  return {
    duration,
    delay,
    ease: previewEase,
    ...replayLoop,
  };
}

function formatXp(value: number) {
  return `+${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)} XP`;
}

function getProgressText(sample: XpGainSample) {
  if (sample.isMaxLevel) {
    return "Level cap";
  }

  if (sample.isLevelUp) {
    return `Lv ${sample.previousLevel} -> ${sample.nextLevel}`;
  }

  return `${sample.progressBefore}% -> ${sample.progressAfter}%`;
}

function ParticleField({
  animated,
  count = 8,
  className,
}: {
  animated: boolean;
  count?: number;
  className: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.span
          key={index}
          className={`pointer-events-none absolute h-1.5 w-1.5 rounded-full ${className}`}
          style={{
            left: `${18 + ((index * 17) % 62)}%`,
            top: `${24 + ((index * 23) % 50)}%`,
          }}
          initial={animated ? { opacity: 0, scale: 0.4, y: 18 } : { opacity: 0.55, scale: 1, y: 0 }}
          animate={animated ? { opacity: [0, 1, 0], scale: [0.4, 1.25, 0.65], y: [18, -26 - index * 2, -46 - index * 3] } : undefined}
          transition={animated ? loopTransition(1.45, 0.08 + index * 0.045) : undefined}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

function ProgressRail({
  sample,
  animated,
  className,
}: {
  sample: XpGainSample;
  animated: boolean;
  className: string;
}) {
  const beforeScale = Math.max(0.04, Math.min(1, sample.progressBefore / 100));
  const afterScale = Math.max(0.04, Math.min(1, sample.progressAfter / 100));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <motion.div
        className={`h-full origin-left rounded-full bg-gradient-to-r ${className}`}
        initial={{ scaleX: animated ? beforeScale : afterScale }}
        animate={{ scaleX: afterScale }}
        transition={animated ? loopTransition(0.88, 0.26) : { duration: 0.88, delay: 0.26, ease: previewEase }}
      />
    </div>
  );
}

export function LevelXpGainPreview({ sample, variant, replayKey }: LevelXpGainPreviewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const shouldReduceMotion = useReducedMotion();
  const animated = !shouldReduceMotion && !sample.isLoading && !sample.hasError;
  const shellSurfaceClassName = isDarkMode
    ? "border-zinc-800/95 bg-zinc-950/88 shadow-[0_24px_72px_-54px_rgba(0,0,0,0.95)]"
    : "border-slate-200 bg-white/92 shadow-[0_24px_72px_-54px_rgba(15,23,42,0.5)]";
  const insetSurfaceClassName = isDarkMode ? "bg-white/[0.055]" : "bg-slate-50/92";
  const softSurfaceClassName = isDarkMode ? "bg-white/[0.035]" : "bg-white/70";
  const sparkClassName = isDarkMode ? "bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.55)]" : "bg-slate-900/70 shadow-[0_0_18px_rgba(15,23,42,0.28)]";
  const accentGradientClassName = currentTheme.primary;

  if (sample.isLoading) {
    return (
      <article className={`relative flex min-h-[17rem] w-full overflow-hidden rounded-[1.6rem] border p-4 backdrop-blur-xl ${shellSurfaceClassName}`}>
        <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
        <div className="relative flex flex-1 flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>Syncing XP</p>
            <LoaderCircle className={`h-4 w-4 animate-spin ${currentTheme.primaryText}`} aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <div className={`h-14 rounded-2xl ${isDarkMode ? "animate-pulse bg-white/[0.075]" : "animate-pulse bg-slate-200/70"}`} />
            <div className={`h-3 w-3/4 rounded-full ${isDarkMode ? "animate-pulse bg-white/[0.075]" : "animate-pulse bg-slate-200/70"}`} />
            <div className={`h-3 w-1/2 rounded-full ${isDarkMode ? "animate-pulse bg-white/[0.075]" : "animate-pulse bg-slate-200/70"}`} />
          </div>
          <p className={`text-xs ${currentTheme.textMuted}`}>{sample.reason}</p>
        </div>
      </article>
    );
  }

  if (sample.hasError) {
    return (
      <article className={`relative flex min-h-[17rem] w-full overflow-hidden rounded-[1.6rem] border p-4 backdrop-blur-xl ${shellSurfaceClassName}`}>
        <div className="relative flex flex-1 flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>XP not synced</p>
            <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
          </div>
          <div className={`rounded-2xl border p-4 ${currentTheme.border} ${insetSurfaceClassName}`}>
            <p className={`font-due-date text-2xl font-semibold ${currentTheme.text}`}>Retry queued</p>
            <p className={`mt-2 text-xs leading-5 ${currentTheme.textSecondary}`}>The visual stays calm, but keeps a clear failure state.</p>
          </div>
          <p className={`text-xs ${currentTheme.textMuted}`}>{sample.reason}</p>
        </div>
      </article>
    );
  }

  const commonInitial = animated ? { opacity: 0, y: 14, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 };
  const commonAnimate = { opacity: 1, y: 0, scale: 1 };
  const commonTransition = { duration: 0.52, ease: previewEase };

  function renderCornerGlassBurst() {
    return (
      <div className="relative h-full">
        <ParticleField animated={animated} className={sparkClassName} count={10} />
        <motion.div
          className={`absolute bottom-3 right-3 w-[82%] rounded-[1.35rem] border p-4 backdrop-blur-xl ${currentTheme.border} ${insetSurfaceClassName}`}
          initial={animated ? { opacity: 0, x: 26, y: 20, scale: 0.88 } : commonInitial}
          animate={animated ? { opacity: 1, x: 0, y: 0, scale: 1 } : commonAnimate}
          transition={animated ? loopTransition(0.58) : { duration: 0.58, ease: previewEase }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>XP gained</p>
              <motion.p
                className={`font-due-date mt-1 text-3xl font-semibold ${currentTheme.text}`}
                initial={animated ? { opacity: 0, letterSpacing: "0.12em" } : undefined}
                animate={animated ? { opacity: 1, letterSpacing: "0.01em" } : undefined}
                transition={animated ? loopTransition(0.46, 0.22) : { delay: 0.22, duration: 0.46 }}
              >
                {formatXp(sample.xp)}
              </motion.p>
            </div>
            <Sparkles className={`h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
          </div>
          <div className="mt-4">
            <ProgressRail sample={sample} animated={animated} className={accentGradientClassName} />
          </div>
        </motion.div>
      </div>
    );
  }

  function renderNavbarComet() {
    return (
      <div className="relative flex h-full flex-col justify-between">
        <div className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${currentTheme.border} ${softSurfaceClassName}`}>
          <div className="flex items-center gap-3">
            <AppAvatar username="xp-comet" fullName="XP Comet" size={36} level={sample.nextLevel} interactive={false} enableBlink={false} />
            <div>
              <p className={`text-sm font-semibold ${currentTheme.text}`}>Profile</p>
              <p className={`font-due-date text-[10px] font-semibold ${currentTheme.textMuted}`}>Lv {sample.nextLevel}</p>
            </div>
          </div>
          <Radio className={`h-4 w-4 ${currentTheme.primaryText}`} aria-hidden="true" />
        </div>
        <motion.div
          className={`absolute left-5 top-[54%] h-2 w-2 rounded-full bg-gradient-to-r ${accentGradientClassName} shadow-[0_0_22px_rgba(99,102,241,0.65)]`}
          initial={animated ? { x: 0, y: 24, scale: 0.75, opacity: 0 } : { x: 172, y: -88, opacity: 1 }}
          animate={animated ? { x: [0, 72, 172], y: [24, -8, -88], scale: [0.75, 1.35, 0.9], opacity: [0, 1, 0.9] } : undefined}
          transition={animated ? loopTransition(1.08) : { duration: 1.08, ease: previewEase }}
        />
        <div className={`rounded-[1.4rem] border p-4 ${currentTheme.border} ${insetSurfaceClassName}`}>
          <p className={`font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
          <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>{getProgressText(sample)}</p>
        </div>
      </div>
    );
  }

  function renderTaskCardFlare() {
    return (
      <div className="relative flex h-full flex-col justify-between">
        <motion.div
          className={`rounded-[1.35rem] border p-3 ${currentTheme.border} ${softSurfaceClassName}`}
          initial={commonInitial}
          animate={commonAnimate}
          transition={animated ? loopTransition(0.52) : commonTransition}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-bold ${currentTheme.text}`}>{sample.reason}</p>
              <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>Moved to Done</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />
          </div>
          <motion.div
            className={`mt-4 h-1 rounded-full bg-gradient-to-r ${accentGradientClassName}`}
            initial={animated ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={animated ? loopTransition(0.58, 0.16) : { delay: 0.16, duration: 0.58, ease: previewEase }}
            style={{ transformOrigin: "left" }}
          />
        </motion.div>
        <ParticleField animated={animated} className={sparkClassName} count={7} />
        <motion.div
          className={`ml-auto w-40 rounded-2xl border px-3 py-2 ${currentTheme.border} ${insetSurfaceClassName}`}
          initial={animated ? { opacity: 0, y: 18, scale: 0.92 } : commonInitial}
          animate={commonAnimate}
          transition={animated ? loopTransition(0.42, 0.34) : { delay: 0.34, duration: 0.42, ease: previewEase }}
        >
          <p className={`font-due-date text-lg font-semibold ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
          <p className={`text-[10px] uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>receipt</p>
        </motion.div>
      </div>
    );
  }

  function renderAvatarHaloPulse() {
    return (
      <div className="grid h-full place-items-center">
        <div className="relative">
          <motion.span
            className={`absolute inset-[-18px] rounded-full border-2 ${currentTheme.primaryBorder}`}
            initial={animated ? { opacity: 0, scale: 0.72 } : { opacity: 0.45, scale: 1 }}
            animate={animated ? { opacity: [0, 0.85, 0.12], scale: [0.72, 1.22, 1.48] } : undefined}
            transition={animated ? loopTransition(1.3) : { duration: 1.3, ease: previewEase }}
            aria-hidden="true"
          />
          <motion.div
            initial={animated ? { scale: 0.9, rotate: -5 } : { scale: 1, rotate: 0 }}
            animate={animated ? { scale: [0.9, 1.08, 1], rotate: [-5, 3, 0] } : undefined}
            transition={animated ? loopTransition(0.8) : { duration: 0.8, ease: previewEase }}
          >
            <AppAvatar username="halo-user" fullName="Halo User" size={72} level={sample.nextLevel} interactive={false} enableBlink={false} />
          </motion.div>
          <motion.div
            className={`absolute -bottom-8 left-1/2 w-32 -translate-x-1/2 rounded-2xl border px-3 py-2 text-center ${currentTheme.border} ${insetSurfaceClassName}`}
            initial={animated ? { opacity: 0, y: 16, scale: 0.88 } : { opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={animated ? loopTransition(0.44, 0.32) : { delay: 0.32, duration: 0.44, ease: previewEase }}
          >
            <p className={`font-due-date text-lg font-semibold ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  function renderTimelineRibbon() {
    return (
      <div className="flex h-full flex-col justify-center">
        <div className="relative h-24">
          <div className={`absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
          <motion.div
            className={`absolute left-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r ${accentGradientClassName}`}
            initial={animated ? { scaleX: 0 } : { scaleX: 1 }}
            animate={{ scaleX: 1 }}
            transition={animated ? loopTransition(0.9) : { duration: 0.9, ease: previewEase }}
            style={{ width: "calc(100% - 2rem)", transformOrigin: "left" }}
          />
          {[0, 1, 2, 3].map((item) => (
            <motion.span
              key={item}
              className={`absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border ${currentTheme.border} ${insetSurfaceClassName}`}
              style={{ left: `${12 + item * 25}%` }}
              initial={animated ? { scale: 0.55, opacity: 0 } : { scale: 1, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={animated ? loopTransition(0.32, 0.16 + item * 0.12) : { delay: 0.16 + item * 0.12, duration: 0.32, ease: previewEase }}
            >
              <GitCommitHorizontal className={`h-3.5 w-3.5 ${item === 3 ? currentTheme.primaryText : currentTheme.textMuted}`} aria-hidden="true" />
            </motion.span>
          ))}
        </div>
        <div className={`rounded-2xl border p-3 ${currentTheme.border} ${softSurfaceClassName}`}>
          <p className={`font-due-date text-xl font-semibold ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
          <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>{sample.tasksCompleted ?? 1} proof tick(s)</p>
        </div>
      </div>
    );
  }

  function renderCommandReceipt() {
    const rows = [
      ["event", sample.reason],
      ["xp_delta", formatXp(sample.xp)],
      ["level", getProgressText(sample)],
    ];

    return (
      <div className={`h-full rounded-[1.35rem] border p-4 font-system-signal ${currentTheme.border} ${isDarkMode ? "bg-black/38" : "bg-slate-950 text-slate-50"}`}>
        <div className="flex items-center justify-between">
          <Terminal className={isDarkMode ? "h-4 w-4 text-lime-300" : "h-4 w-4 text-lime-400"} aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">xp.log</span>
        </div>
        <div className="mt-5 space-y-3">
          {rows.map(([label, value], index) => (
            <motion.div
              key={label}
              className="grid grid-cols-[5rem_1fr] gap-3 text-xs"
              initial={animated ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={animated ? loopTransition(0.34, 0.12 + index * 0.14) : { delay: 0.12 + index * 0.14, duration: 0.34 }}
            >
              <span className="text-lime-300/80">{label}</span>
              <span className="truncate opacity-90">{value}</span>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-5 h-px bg-lime-300/70"
          initial={animated ? { scaleX: 0 } : { scaleX: 1 }}
          animate={{ scaleX: 1 }}
          transition={animated ? loopTransition(0.42, 0.56) : { delay: 0.56, duration: 0.42 }}
          style={{ transformOrigin: "left" }}
        />
      </div>
    );
  }

  function renderOrbitalCounter() {
    return (
      <div className="grid h-full place-items-center">
        <div className="relative grid h-44 w-44 place-items-center rounded-full">
          <motion.div
            className={`absolute inset-0 rounded-full border ${currentTheme.border}`}
            style={{ background: `conic-gradient(currentColor ${sample.progressAfter}%, transparent 0)` }}
            initial={animated ? { rotate: -95, opacity: 0.14 } : { rotate: -90, opacity: 0.22 }}
            animate={animated ? { rotate: [-95, 0, 270], opacity: [0.14, 0.28, 0.18] } : undefined}
            transition={animated ? loopTransition(1.35) : { duration: 1.35, ease: previewEase }}
          />
          <motion.div
            className={`absolute h-4 w-4 rounded-full bg-gradient-to-r ${accentGradientClassName}`}
            initial={animated ? { x: -62, y: 0, opacity: 0 } : { x: 58, y: -12, opacity: 1 }}
            animate={animated ? { x: [-62, -8, 58], y: [0, -66, -12], opacity: [0, 1, 1] } : undefined}
            transition={animated ? loopTransition(1.12) : { duration: 1.12, ease: previewEase }}
          />
          <div className={`grid h-28 w-28 place-items-center rounded-full border ${currentTheme.border} ${insetSurfaceClassName}`}>
            <div className="text-center">
              <Gauge className={`mx-auto h-5 w-5 ${currentTheme.primaryText}`} aria-hidden="true" />
              <p className={`font-due-date mt-1 text-2xl font-semibold ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderBoardColumnShimmer() {
    return (
      <div className={`flex h-full flex-col rounded-[1.35rem] border ${currentTheme.border} ${softSurfaceClassName}`}>
        <div className={`relative overflow-hidden rounded-t-[1.25rem] border-b px-4 py-3 ${currentTheme.border}`}>
          <motion.span
            className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
            initial={animated ? { x: "0%" } : { x: "260%" }}
            animate={animated ? { x: "320%" } : undefined}
            transition={animated ? loopTransition(1.2) : { duration: 1.2, ease: previewEase }}
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between">
            <p className={`font-ui-condensed text-base font-semibold ${currentTheme.text}`}>Done</p>
            <span className={`font-due-date text-xs font-semibold ${currentTheme.primaryText}`}>{formatXp(sample.xp)}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2 p-4">
          {[0, 1, 2].map((item) => (
            <motion.div
              key={item}
              className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${insetSurfaceClassName}`}
              initial={animated ? { y: 16, opacity: 0 } : { y: 0, opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              transition={animated ? loopTransition(0.38, item * 0.12) : { delay: item * 0.12, duration: 0.38, ease: previewEase }}
            >
              <div className={`h-2 rounded-full ${isDarkMode ? "bg-white/12" : "bg-slate-300/80"}`} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  function renderSidebarRailTicker() {
    return (
      <div className="flex h-full items-stretch gap-4">
        <div className={`flex w-16 flex-col items-center justify-between rounded-[1.35rem] border p-2 ${currentTheme.border} ${softSurfaceClassName}`}>
          <AppAvatar username="rail-user" fullName="Rail User" size={38} level={sample.nextLevel} interactive={false} enableBlink={false} />
          <motion.div
            className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-r text-xs font-bold text-white ${accentGradientClassName}`}
            initial={animated ? { y: 28, opacity: 0, scale: 0.82 } : commonInitial}
            animate={animated ? { y: [28, 0, -4, 0], opacity: 1, scale: [0.82, 1.08, 1] } : commonAnimate}
            transition={animated ? loopTransition(0.84) : { duration: 0.84, ease: previewEase }}
          >
            XP
          </motion.div>
          <CircleDot className={`h-4 w-4 ${currentTheme.primaryText}`} aria-hidden="true" />
        </div>
        <div className={`flex flex-1 flex-col justify-center rounded-[1.35rem] border p-4 ${currentTheme.border} ${insetSurfaceClassName}`}>
          <p className={`font-ui-condensed text-sm font-semibold ${currentTheme.text}`}>Rail ticker</p>
          <p className={`font-due-date mt-2 text-3xl font-semibold ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{getProgressText(sample)}</p>
        </div>
      </div>
    );
  }

  function renderToastStackWave() {
    return (
      <div className="relative h-full">
        {[0, 1, 2].map((item) => (
          <motion.div
            key={item}
            className={`absolute right-4 rounded-2xl border px-3 py-2 ${currentTheme.border} ${insetSurfaceClassName}`}
            style={{ top: `${28 + item * 20}px`, width: `${9.5 - item * 0.7}rem` }}
            initial={animated ? { opacity: 0, x: 22, y: 12 } : { opacity: 0.75, x: 0, y: 0 }}
            animate={animated ? { opacity: [0, 0.82, item === 0 ? 1 : 0], x: [22, 0, item === 0 ? 0 : -18], y: [12, 0, item === 0 ? 58 : -8] } : undefined}
            transition={animated ? loopTransition(0.88, item * 0.11) : { delay: item * 0.11, duration: 0.88, ease: previewEase }}
          >
            <p className={`font-due-date text-sm font-semibold ${currentTheme.text}`}>+{Math.max(5, Math.round(sample.xp / (item + 3)))} XP</p>
          </motion.div>
        ))}
        <motion.div
          className={`absolute bottom-4 left-4 right-4 rounded-[1.35rem] border p-4 ${currentTheme.border} ${softSurfaceClassName}`}
          initial={animated ? { opacity: 0, scale: 0.92, y: 18 } : commonInitial}
          animate={commonAnimate}
          transition={animated ? loopTransition(0.42, 0.62) : { delay: 0.62, duration: 0.42, ease: previewEase }}
        >
          <p className={`font-due-date text-2xl font-semibold ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
          <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>Merged reward wave</p>
        </motion.div>
      </div>
    );
  }

  function renderSpotlightDrop() {
    return (
      <div className="grid h-full place-items-center">
        <motion.div
          className={`absolute inset-8 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`}
          initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 0.45, scale: 1 }}
          animate={animated ? { opacity: [0, 0.8, 0.42], scale: [0.5, 1.12, 0.95] } : undefined}
          transition={animated ? loopTransition(1.1) : { duration: 1.1, ease: previewEase }}
          aria-hidden="true"
        />
        <motion.div
          className={`relative w-52 rounded-[1.5rem] border p-5 text-center ${currentTheme.border} ${insetSurfaceClassName}`}
          initial={animated ? { opacity: 0, y: -36, scale: 1.12 } : commonInitial}
          animate={animated ? { opacity: 1, y: 0, scale: [1.12, 0.98, 1] } : commonAnimate}
          transition={animated ? loopTransition(0.62) : { duration: 0.62, ease: previewEase }}
        >
          <Trophy className={`mx-auto h-7 w-7 ${currentTheme.primaryText}`} aria-hidden="true" />
          <p className={`font-due-date mt-3 text-3xl font-semibold ${currentTheme.text}`}>{formatXp(sample.xp)}</p>
          <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{sample.isLevelUp ? "Level advanced" : sample.reason}</p>
        </motion.div>
      </div>
    );
  }

  function renderStreakLantern() {
    return (
      <div className="grid h-full place-items-center">
        <motion.div
          className={`relative w-48 rounded-[2rem] border px-5 py-6 text-center ${isDarkMode ? "border-amber-200/30 bg-amber-300/10" : "border-amber-300/70 bg-amber-50"} shadow-[0_24px_70px_-48px_rgba(245,158,11,0.72)]`}
          initial={animated ? { opacity: 0, y: 18, scale: 0.9 } : commonInitial}
          animate={animated ? { opacity: 1, y: 0, scale: 1 } : commonAnimate}
          transition={animated ? loopTransition(0.54) : { duration: 0.54, ease: previewEase }}
        >
          <motion.div
            initial={animated ? { scale: 0.8, rotate: -6 } : { scale: 1, rotate: 0 }}
            animate={animated ? { scale: [0.8, 1.14, 1], rotate: [-6, 5, 0] } : undefined}
            transition={animated ? loopTransition(0.82) : { duration: 0.82, ease: previewEase }}
          >
            <Flame className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
          </motion.div>
          <p className={`font-due-date mt-3 text-3xl font-semibold ${isDarkMode ? "text-amber-50" : "text-amber-950"}`}>{formatXp(sample.xp)}</p>
          <p className={`mt-2 text-xs font-semibold ${isDarkMode ? "text-amber-100/70" : "text-amber-800/80"}`}>
            {sample.streakDays ? `${sample.streakDays}-day streak` : "momentum kept"}
          </p>
        </motion.div>
      </div>
    );
  }

  function renderContent() {
    switch (variant) {
      case "corner-glass-burst":
        return renderCornerGlassBurst();
      case "navbar-comet":
        return renderNavbarComet();
      case "task-card-flare":
        return renderTaskCardFlare();
      case "avatar-halo-pulse":
        return renderAvatarHaloPulse();
      case "timeline-ribbon":
        return renderTimelineRibbon();
      case "command-receipt":
        return renderCommandReceipt();
      case "orbital-counter":
        return renderOrbitalCounter();
      case "board-column-shimmer":
        return renderBoardColumnShimmer();
      case "sidebar-rail-ticker":
        return renderSidebarRailTicker();
      case "toast-stack-wave":
        return renderToastStackWave();
      case "spotlight-drop":
        return renderSpotlightDrop();
      case "streak-lantern":
        return renderStreakLantern();
      default:
        return renderCornerGlassBurst();
    }
  }

  return (
    <article
      key={`${replayKey}-${sample.key}-${variant}`}
      className={`relative min-h-[17rem] w-full overflow-hidden rounded-[1.6rem] border p-4 backdrop-blur-xl ${shellSurfaceClassName}`}
      aria-label={`${sample.label}: ${formatXp(sample.xp)} preview`}
    >
      <div className={`pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-16 left-4 h-28 w-28 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />
      <div className="relative z-10 h-full min-h-[15rem]">
        {renderContent()}
      </div>
      <div className="sr-only">
        {sample.reason}. {getProgressText(sample)}.
      </div>
    </article>
  );
}
