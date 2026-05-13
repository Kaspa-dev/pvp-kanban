import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutList,
  PanelLeft,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AppAvatar } from "./AppAvatar";
import { BoardStatusBadge } from "./BoardStatusBadge";
import { LevelProgressCard } from "./LevelProgressCard";
import { PriorityAccent } from "./PriorityAccent";
import { TaskDueDateBadge } from "./TaskDueDateBadge";
import { UserProfileChip } from "./UserProfileChip";
import { UtilityIconButton } from "./UtilityIconButton";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import type { GamificationSummary } from "../utils/gamification";
import type { LevelXpGainVariant, XpGainSample } from "../utils/levelXpGain";

interface LevelXpGainPreviewProps {
  sample: XpGainSample;
  variant: LevelXpGainVariant;
  replayKey: number;
}

const previewEase = [0.22, 1, 0.36, 1] as const;
const loop = {
  repeat: Infinity,
  repeatDelay: 1.35,
  repeatType: "loop" as const,
};

function loopTransition(duration: number, delay = 0) {
  return {
    duration,
    delay,
    ease: previewEase,
    ...loop,
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatXp(sample: XpGainSample) {
  if (sample.isLoading) {
    return "Syncing XP";
  }

  if (sample.hasError) {
    return "XP pending";
  }

  return `+${formatNumber(sample.xp)} XP`;
}

function getProgressText(sample: XpGainSample) {
  if (sample.isLoading) {
    return "Confirming reward";
  }

  if (sample.hasError) {
    return "Will retry sync";
  }

  if (sample.isMaxLevel) {
    return "Level cap reached";
  }

  if (sample.isLevelUp) {
    return `Lv ${sample.previousLevel} to ${sample.nextLevel}`;
  }

  return `${sample.progressBefore}% to ${sample.progressAfter}%`;
}

function getStatusIcon(sample: XpGainSample, className: string) {
  if (sample.isLoading) {
    return <Clock3 className={className} aria-hidden="true" />;
  }

  if (sample.hasError) {
    return <AlertTriangle className={className} aria-hidden="true" />;
  }

  return <CheckCircle2 className={className} aria-hidden="true" />;
}

function getMockSummary(sample: XpGainSample): GamificationSummary {
  const nextLevelXp = sample.isMaxLevel ? 0 : 1000;
  const currentLevelXp = sample.isMaxLevel ? 0 : Math.round((Math.max(0, Math.min(100, sample.progressAfter)) / 100) * nextLevelXp);

  return {
    lifetimeXp: sample.nextLevel * 1000 + Math.max(0, sample.xp),
    currentLevel: sample.nextLevel,
    currentLevelName: sample.isMaxLevel ? "Level Cap" : `Level ${sample.nextLevel}`,
    currentLevelXp,
    xpForNextLevel: nextLevelXp,
    xpRemainingForNextLevel: nextLevelXp > 0 ? Math.max(0, nextLevelXp - currentLevelXp) : 0,
    progressPercent: sample.progressAfter,
    weeklyXp: Math.max(0, sample.xp),
    monthlyXp: Math.max(0, sample.xp * 3),
    tasksCompleted: sample.tasksCompleted ?? 1,
    prestige: sample.isMaxLevel ? 1 : 0,
  };
}

function RewardPill({
  sample,
  className = "",
}: {
  sample: XpGainSample;
  className?: string;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <span
      className={`font-due-date inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${currentTheme.border} ${currentTheme.cardBg} ${sample.hasError ? "text-red-500" : currentTheme.primaryText} ${className}`}
    >
      {getStatusIcon(sample, "h-3.5 w-3.5")}
      {formatXp(sample)}
    </span>
  );
}

function ToastCard({
  sample,
  animated,
  align = "right",
}: {
  sample: XpGainSample;
  animated: boolean;
  align?: "left" | "right";
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const slideX = align === "right" ? 30 : -30;

  return (
    <motion.div
      className={`relative grid w-[18.25rem] grid-cols-[auto_1fr] items-start gap-x-3 overflow-hidden rounded-2xl border px-4 py-3.5 shadow-[0_16px_34px_rgba(15,23,42,0.12)] ${currentTheme.border} ${currentTheme.cardBg}`}
      initial={animated ? { opacity: 0, x: slideX, y: 18, scale: 0.96 } : { opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={animated ? loopTransition(0.5) : { duration: 0.01 }}
    >
      <div className="flex items-start pt-0.5">
        {getStatusIcon(sample, `h-4.5 w-4.5 ${sample.hasError ? "text-red-500" : currentTheme.primaryText}`)}
      </div>
      <div className="min-w-0 pr-8 pt-0.5">
        <p className={`font-toast-title text-[13px] font-extrabold tracking-normal ${currentTheme.text}`}>
          {formatXp(sample)}
        </p>
        <p className={`mt-1 truncate text-xs ${currentTheme.textMuted}`}>
          {sample.reason}
        </p>
      </div>
      <span
        aria-hidden="true"
        className={`absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textMuted}`}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
    </motion.div>
  );
}

function SurfaceChrome({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <div className={`flex h-full min-h-[15rem] flex-col overflow-hidden rounded-[1.35rem] border ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/52" : "bg-slate-50/88"}`}>
      <div className={`flex items-center justify-between border-b px-3 py-2 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.035]" : "bg-white/82"}`}>
        <span className={`font-ui-condensed text-xs font-semibold tracking-[0.01em] ${currentTheme.textMuted}`}>{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${currentTheme.primary}`} aria-hidden="true" />
      </div>
      <div className="relative flex flex-1 p-3">
        {children}
      </div>
    </div>
  );
}

export function LevelXpGainPreview({ sample, variant, replayKey }: LevelXpGainPreviewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const shouldReduceMotion = useReducedMotion();
  const animated = !shouldReduceMotion;
  const shellSurfaceClassName = isDarkMode
    ? "border-zinc-800/95 bg-zinc-950/88 shadow-[0_24px_72px_-54px_rgba(0,0,0,0.95)]"
    : "border-slate-200 bg-white/92 shadow-[0_24px_72px_-54px_rgba(15,23,42,0.5)]";
  const quietSurfaceClassName = isDarkMode ? "bg-white/[0.045]" : "bg-white/76";
  const activeTextClassName = sample.hasError ? "text-red-500" : currentTheme.primaryText;
  const avatarLevel = sample.isLoading || sample.hasError ? sample.previousLevel : sample.nextLevel;

  function renderNavbarProfilePulse() {
    return (
      <SurfaceChrome label="Navbar">
        <div className="flex w-full items-center justify-center">
          <div className="flex justify-center">
            <motion.div
              className="relative"
              initial={animated ? { scale: 0.98 } : { scale: 1 }}
              animate={animated ? { scale: [0.98, 1.03, 1] } : undefined}
              transition={animated ? loopTransition(0.7) : { duration: 0.01 }}
            >
              <motion.span
                className={`pointer-events-none absolute -inset-1 rounded-3xl border ${sample.hasError ? "border-red-500/45" : currentTheme.primaryBorder}`}
                initial={animated ? { opacity: 0, scale: 0.92 } : { opacity: 0.5, scale: 1 }}
                animate={animated ? { opacity: [0, 0.75, 0], scale: [0.92, 1.12, 1.22] } : undefined}
                transition={animated ? loopTransition(1.1, 0.05) : { duration: 0.01 }}
                aria-hidden="true"
              />
              <UserProfileChip
                username="mara"
                fullName="Mara Finch"
                subtitle="Mara Finch"
              />
              <motion.span
                className={`font-due-date pointer-events-none absolute right-[calc(100%+0.65rem)] top-1/2 whitespace-nowrap text-sm font-semibold leading-none ${sample.hasError ? "text-red-500" : currentTheme.primaryText}`}
                initial={animated ? { opacity: 0, x: 8, y: "-50%", scale: 0.96 } : { opacity: 1, x: 0, y: "-50%", scale: 1 }}
                animate={animated ? { opacity: [0, 1, 0], x: [8, -3, -16], y: "-50%", scale: [0.96, 1, 0.98] } : { opacity: 1, x: 0, y: "-50%", scale: 1 }}
                transition={animated ? loopTransition(1.05, 0.28) : { duration: 0.01 }}
              >
                {formatXp(sample)}
              </motion.span>
            </motion.div>
          </div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderProfilePopoverXp() {
    return (
      <SurfaceChrome label="Profile popover">
        <div className="relative w-full">
          <motion.div
            className="relative z-10"
            initial={animated ? { opacity: 0, y: 14, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={animated ? loopTransition(0.52) : { duration: 0.01 }}
          >
            <LevelProgressCard
              username="mara"
              fullName="Mara Finch"
              level={avatarLevel}
              summary={getMockSummary(sample)}
              variant="orbit-ribbon-console"
              dataVariant="checkpoint-path"
              isLoading={sample.isLoading}
              hasError={sample.hasError}
              showAmbientGrid={false}
            />
          </motion.div>
          <motion.div
            className="absolute right-4 top-4 z-20"
            initial={animated ? { opacity: 0, y: -12, scale: 0.86 } : { opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: sample.isLoading ? 0.82 : 1, y: 0, scale: 1 }}
            transition={animated ? loopTransition(0.46, 0.32) : { duration: 0.01 }}
          >
            <RewardPill sample={sample} />
          </motion.div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderToastPosition(align: "left" | "right") {
    return (
      <SurfaceChrome label={align === "right" ? "Viewport bottom-right" : "Viewport bottom-left"}>
        <div className={`relative flex w-full items-end ${align === "right" ? "justify-end" : "justify-start"}`}>
          <ToastCard sample={sample} animated={animated} align={align} />
        </div>
      </SurfaceChrome>
    );
  }

  function renderTopCenterBanner() {
    return (
      <SurfaceChrome label="Below navbar">
        <div className="flex w-full items-start justify-center">
          <motion.div
            className={`mt-2 flex w-[92%] max-w-[20rem] items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.58)] ${currentTheme.border} ${currentTheme.cardBg}`}
            initial={animated ? { opacity: 0, y: -18, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={animated ? loopTransition(0.55) : { duration: 0.01 }}
          >
            <Bell className={`h-4 w-4 shrink-0 ${activeTextClassName}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className={`font-ui-condensed truncate text-sm font-semibold ${currentTheme.text}`}>{formatXp(sample)}</p>
              <p className={`truncate text-xs ${currentTheme.textMuted}`}>{getProgressText(sample)}</p>
            </div>
            <ChevronRight className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} aria-hidden="true" />
          </motion.div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderTaskCardReward() {
    return (
      <SurfaceChrome label="Board card">
        <div className="flex w-full items-center justify-center">
          <motion.div
            className={`relative w-full max-w-[18rem] rounded-[1.35rem] border px-4 py-4 pl-7 shadow-sm transition-colors ${currentTheme.border} ${currentTheme.cardBg}`}
            initial={animated ? { opacity: 0, y: 16, scale: 0.97 } : { opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={animated ? loopTransition(0.54) : { duration: 0.01 }}
          >
            <PriorityAccent priority={sample.hasError ? "high" : "critical"} isDarkMode={isDarkMode} />
            <div className={`mb-2 flex min-w-0 items-center gap-2 overflow-hidden pr-14 text-xs ${currentTheme.textMuted}`}>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-due-date">{sample.tasksCompleted ?? 1}</span>
              </span>
              <BoardStatusBadge statusKey="done" />
            </div>
            <p className={`mb-4 truncate text-left text-[15px] font-bold leading-tight ${currentTheme.text}`}>
              {sample.reason}
            </p>
            <div className="flex min-h-9 items-end justify-between gap-3">
              <TaskDueDateBadge dueDate="2026-05-18" />
              <motion.div
                initial={animated ? { opacity: 0, x: 18, scale: 0.9 } : { opacity: 1, x: 0, scale: 1 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={animated ? loopTransition(0.42, 0.34) : { duration: 0.01 }}
              >
                <RewardPill sample={sample} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderDoneColumnHeader() {
    return (
      <SurfaceChrome label="Done column">
        <div className="flex w-full items-start justify-center">
          <motion.div
            className={`relative mt-4 w-full max-w-[20rem] overflow-hidden rounded-2xl border ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/52" : "bg-slate-50/88"}`}
            initial={animated ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={animated ? loopTransition(0.48) : { duration: 0.01 }}
          >
            <motion.span
              className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              initial={animated ? { x: "0%" } : { x: "300%" }}
              animate={animated ? { x: "330%" } : undefined}
              transition={animated ? loopTransition(1.05, 0.2) : { duration: 0.01 }}
              aria-hidden="true"
            />
            <div className={`relative border-b px-5 py-4 text-center ${currentTheme.border} ${isDarkMode ? "bg-zinc-900/46" : "bg-white/78"}`}>
              <h3 className={`font-kanban-column-title text-[1.08rem] font-bold leading-[1.35] ${currentTheme.text}`}>Done</h3>
              <div className="mx-auto mt-2 flex w-[76%] gap-1.5">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-[3px] min-w-0 flex-1 rounded-[1px] ${index < 5 ? currentTheme.primaryLimitSoftSolid : isDarkMode ? "bg-zinc-800" : "bg-gray-200"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <motion.p
                className={`font-kanban-limit-message mt-2 min-h-3 text-[9px] font-semibold tracking-[0.08em] ${activeTextClassName}`}
                initial={animated ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={animated ? loopTransition(0.38, 0.42) : { duration: 0.01 }}
              >
                {formatXp(sample)}
              </motion.p>
            </div>
            <div className="space-y-2 p-4">
              {[0, 1].map((item) => (
                <div key={item} className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${quietSurfaceClassName}`}>
                  <div className={`h-2 rounded-full ${isDarkMode ? "bg-white/12" : "bg-slate-300/80"}`} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderSidebarRailTicker() {
    return (
      <SurfaceChrome label="Sidebar rail">
        <div className="flex w-full gap-4">
          <div className={`flex w-16 flex-col items-center justify-between rounded-[1.35rem] border p-2 ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/52" : "bg-white/82"}`}>
            <AppAvatar username="mara" fullName="Mara Finch" size={38} level={avatarLevel} interactive={false} enableBlink={false} />
            <UtilityIconButton aria-label="Board settings preview" size="lg" emphasis="elevated">
              <PanelLeft className="h-5 w-5 pointer-events-none" />
            </UtilityIconButton>
            <motion.div
              initial={animated ? { opacity: 0, y: 20, scale: 0.84 } : { opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={animated ? loopTransition(0.48, 0.28) : { duration: 0.01 }}
            >
              <RewardPill sample={sample} className="px-2" />
            </motion.div>
          </div>
          <div className={`flex flex-1 flex-col justify-center rounded-[1.35rem] border p-4 ${currentTheme.border} ${quietSurfaceClassName}`}>
            <p className={`font-ui-condensed text-sm font-semibold ${currentTheme.text}`}>Sidebar reward tick</p>
            <p className={`font-due-date mt-2 text-2xl font-semibold ${currentTheme.text}`}>{formatXp(sample)}</p>
            <p className={`mt-2 text-xs ${currentTheme.textMuted}`}>{getProgressText(sample)}</p>
          </div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderTaskDetailsRewardRow() {
    const dividerClassName = isDarkMode ? "border-white/10" : "border-slate-200/80";

    return (
      <SurfaceChrome label="Task details">
        <div className={`w-full rounded-[1.45rem] border ${currentTheme.border} ${currentTheme.cardBg}`}>
          <div className="px-5 py-5">
            <div className="flex items-start gap-3">
              <AppAvatar username="mara" fullName="Mara Finch" size={38} level={avatarLevel} interactive={false} enableBlink={false} />
              <div className="min-w-0 flex-1">
                <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.12em] ${currentTheme.textMuted}`}>Task details</p>
                <p className={`mt-1 truncate text-xl font-semibold ${currentTheme.text}`}>{sample.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <BoardStatusBadge statusKey="done" />
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${currentTheme.border} ${currentTheme.textMuted}`}>
                    Task ID <span className="font-due-date">#248</span>
                  </span>
                </div>
              </div>
            </div>
            <motion.div
              className={`mt-5 border-t py-4 ${dividerClassName}`}
              initial={animated ? { opacity: 0, y: 14 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={animated ? loopTransition(0.46, 0.28) : { duration: 0.01 }}
            >
              <div className={`flex items-center gap-2 font-ui-condensed text-xs font-semibold uppercase tracking-[0.12em] ${currentTheme.textMuted}`}>
                <Trophy className={`h-4 w-4 ${activeTextClassName}`} aria-hidden="true" />
                <span>Reward</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className={`text-sm font-medium ${currentTheme.textSecondary}`}>{getProgressText(sample)}</p>
                <RewardPill sample={sample} />
              </div>
            </motion.div>
          </div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderListRowReward() {
    return (
      <SurfaceChrome label="List row">
        <div className={`w-full overflow-hidden rounded-lg border ${currentTheme.border}`}>
          <div className={`grid grid-cols-[7rem_1fr_8rem_7rem] border-b px-4 py-3 text-xs ${currentTheme.border} ${isDarkMode ? "bg-white/[0.025]" : "bg-black/[0.015]"} ${currentTheme.textSecondary}`}>
            <span className="text-center font-ui-condensed font-semibold">Priority</span>
            <span className="font-ui-condensed font-semibold">Title</span>
            <span className="text-center font-ui-condensed font-semibold">Status</span>
            <span className="text-center font-ui-condensed font-semibold">XP</span>
          </div>
          <motion.div
            className={`grid grid-cols-[7rem_1fr_8rem_7rem] items-center border-b px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-white/[0.035]" : "bg-slate-100/70"}`}
            initial={animated ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={animated ? loopTransition(0.5) : { duration: 0.01 }}
          >
            <div className="flex items-center justify-center">
              <span className="font-kanban-limit-message text-xs font-semibold text-red-500">CRITICAL</span>
            </div>
            <div className="min-w-0">
              <p className={`truncate text-[15px] font-semibold ${currentTheme.text}`}>{sample.reason}</p>
              <p className={`mt-1 truncate text-xs ${currentTheme.textMuted}`}>Completed by @mara</p>
            </div>
            <div className="flex items-center justify-center">
              <BoardStatusBadge statusKey="done" />
            </div>
            <div className="flex items-center justify-center">
              <motion.span
                className={`font-due-date text-xs font-semibold ${activeTextClassName}`}
                initial={animated ? { opacity: 0, scale: 0.88 } : { opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={animated ? loopTransition(0.38, 0.34) : { duration: 0.01 }}
              >
                {formatXp(sample)}
              </motion.span>
            </div>
          </motion.div>
          <div className={`grid grid-cols-[7rem_1fr_8rem_7rem] items-center px-4 py-4 ${currentTheme.textMuted}`}>
            <div className="flex items-center justify-center">
              <LayoutList className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="truncate text-sm">Second row keeps table context</span>
            <div className="flex items-center justify-center">
              <BoardStatusBadge statusKey="inReview" />
            </div>
            <span className="text-center font-due-date text-xs">-</span>
          </div>
        </div>
      </SurfaceChrome>
    );
  }

  function renderContent() {
    switch (variant) {
      case "navbar-profile-pulse":
        return renderNavbarProfilePulse();
      case "profile-popover-xp":
        return renderProfilePopoverXp();
      case "toast-bottom-right":
        return renderToastPosition("right");
      case "toast-bottom-left":
        return renderToastPosition("left");
      case "top-center-banner":
        return renderTopCenterBanner();
      case "task-card-reward":
        return renderTaskCardReward();
      case "done-column-header":
        return renderDoneColumnHeader();
      case "sidebar-rail-ticker":
        return renderSidebarRailTicker();
      case "task-details-reward-row":
        return renderTaskDetailsRewardRow();
      case "list-row-reward":
        return renderListRowReward();
      default:
        return renderNavbarProfilePulse();
    }
  }

  return (
    <article
      key={`${replayKey}-${sample.key}-${variant}`}
      className={`relative min-h-[17rem] w-full overflow-hidden rounded-[1.6rem] border p-4 backdrop-blur-xl ${shellSurfaceClassName}`}
      aria-label={`${sample.label}: ${formatXp(sample)} preview`}
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
