import { Crown, Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { useMemo } from "react";
import { AppAvatar } from "./AppAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import {
  LEADERBOARD_PERIOD_LABELS,
  LEADERBOARD_PERIODS,
  LEVEL_LEADERBOARD_VARIANTS,
  type LeaderboardPeriod,
  type LevelLeaderboardBoard,
  type LevelLeaderboardVariant,
} from "../utils/levelLeaderboard";
import { getPanelEyebrowClassName } from "./typographyStyles";

interface LevelLeaderboardPreviewProps {
  board: LevelLeaderboardBoard;
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  variant: LevelLeaderboardVariant;
  density: "expanded" | "collapsed";
  previewState?: "ready" | "loading" | "error";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function getRankedMembers(board: LevelLeaderboardBoard, period: LeaderboardPeriod) {
  return [...board.members]
    .sort((left, right) => {
      const xpDifference = right.xpByPeriod[period] - left.xpByPeriod[period];
      if (xpDifference !== 0) return xpDifference;

      const levelDifference = right.level - left.level;
      if (levelDifference !== 0) return levelDifference;

      return left.displayName.localeCompare(right.displayName);
    })
    .map((member, index) => ({ ...member, rank: index + 1 }));
}

type RankedMember = ReturnType<typeof getRankedMembers>[number];

function getVariantLabel(variant: LevelLeaderboardVariant) {
  return LEVEL_LEADERBOARD_VARIANTS.find((item) => item.key === variant)?.label ?? variant;
}

function getRankTone(rank: number, isDarkMode: boolean) {
  if (rank === 1) {
    return isDarkMode ? "border-amber-300/35 bg-amber-300/14 text-amber-100" : "border-amber-300/75 bg-amber-50 text-amber-800";
  }

  if (rank === 2) {
    return isDarkMode ? "border-zinc-200/35 bg-zinc-200/14 text-zinc-100" : "border-slate-300 bg-slate-100 text-slate-700";
  }

  return isDarkMode ? "border-orange-300/32 bg-orange-300/13 text-orange-100" : "border-orange-300 bg-orange-50 text-orange-800";
}

function getSolidRankTone(rank: number, isDarkMode: boolean) {
  if (rank === 1) {
    return isDarkMode ? "border-amber-300/35 bg-amber-300/12 text-amber-50" : "border-amber-300/70 bg-amber-50/78 text-stone-800";
  }

  if (rank === 2) {
    return isDarkMode ? "border-zinc-200/35 bg-zinc-200/12 text-zinc-100" : "border-slate-300/80 bg-slate-100/78 text-slate-700";
  }

  return isDarkMode ? "border-orange-300/34 bg-orange-300/12 text-orange-50" : "border-orange-300/80 bg-orange-50/78 text-stone-800";
}

function getProgressWidth(member: RankedMember, period: LeaderboardPeriod, maxXp: number) {
  if (maxXp <= 0) return "0%";
  return `${Math.max(12, Math.round((member.xpByPeriod[period] / maxXp) * 100))}%`;
}

function RankBadge({ rank, isDarkMode }: { rank: number; isDarkMode: boolean }) {
  return (
    <span className={`font-due-date inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold ${getRankTone(rank, isDarkMode)}`}>
      {rank === 1 ? <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> : rank}
    </span>
  );
}

function CrownStackRankIcon({
  rank,
  className,
}: {
  rank: number;
  className: string;
}) {
  if (rank === 1) {
    return <Flame className={`shrink-0 ${className}`} aria-hidden="true" />;
  }

  if (rank === 2) {
    return <Zap className={`shrink-0 ${className}`} aria-hidden="true" />;
  }

  return <Sparkles className={`shrink-0 ${className}`} aria-hidden="true" />;
}

function MemberAvatar({ member, size }: { member: RankedMember; size: number }) {
  return (
    <AppAvatar
      username={member.username}
      fullName={member.displayName}
      level={member.level}
      size={size}
      interactive={false}
      enableBlink={false}
      showTooltip={false}
    />
  );
}

function CurrentUserStrip({
  currentUser,
  period,
  currentTheme,
  quietSurfaceClassName,
}: {
  currentUser: RankedMember | undefined;
  period: LeaderboardPeriod;
  currentTheme: ReturnType<typeof getThemeColors>;
  quietSurfaceClassName: string;
}) {
  if (!currentUser || currentUser.rank <= 3) return null;

  return (
    <div className={`mt-3 rounded-[1.35rem] border p-3 ${currentTheme.border} ${quietSurfaceClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-5">
          <MemberAvatar member={currentUser} size={46} />
          <div className="min-w-0">
            <p className={`font-ui-condensed truncate text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>YOU</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`font-due-date text-[10px] font-semibold ${currentTheme.primaryText}`}>#{currentUser.rank}</span>
        </div>
      </div>
      <p className={`font-due-date mt-2 text-base font-semibold ${currentTheme.text}`}>
        {formatNumber(currentUser.xpByPeriod[period])} XP
      </p>
    </div>
  );
}

function LeaderboardStatePreview({
  density,
  previewState,
  period,
  onPeriodChange,
  currentTheme,
  isDarkMode,
  panelSurfaceClassName,
  quietSurfaceClassName,
  variant,
}: {
  density: "expanded" | "collapsed";
  previewState: "loading" | "error";
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  currentTheme: ReturnType<typeof getThemeColors>;
  isDarkMode: boolean;
  panelSurfaceClassName: string;
  quietSurfaceClassName: string;
  variant: LevelLeaderboardVariant;
}) {
  const isCollapsed = density === "collapsed";
  const isLoading = previewState === "loading";
  const isCrownStack = variant === "crown-stack";
  const shellClassName = isCollapsed
    ? `relative flex w-[4.25rem] flex-col items-center overflow-hidden rounded-[1.45rem] border px-2 py-3 backdrop-blur-xl ${panelSurfaceClassName}`
    : `relative flex min-h-[25.5rem] w-72 flex-col overflow-hidden rounded-[1.75rem] border p-3.5 backdrop-blur-xl ${panelSurfaceClassName}`;
  const statusSurfaceClassName = quietSurfaceClassName;
  const skeletonClassName = isDarkMode
    ? "animate-pulse bg-white/[0.075]"
    : "animate-pulse bg-slate-200/70";
  const collapsedSkeletonClassName = `rounded-lg border ${currentTheme.border} ${skeletonClassName}`;

  if (isCollapsed) {
    return (
      <aside className={shellClassName} aria-label={`${getVariantLabel(variant)} ${previewState} collapsed leaderboard preview`}>
        <div className={`pointer-events-none absolute -top-8 h-20 w-20 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-2xl`} />
        {isCrownStack ? <div className={`pointer-events-none absolute -bottom-8 h-20 w-20 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-2xl`} /> : null}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className={`font-ui-condensed text-[11px] font-semibold tracking-[0.01em] ${currentTheme.primaryText}`}>
            {LEADERBOARD_PERIOD_LABELS[period]}
          </span>
          {isLoading ? (
            <div className="flex flex-col items-center gap-2" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className={`${collapsedSkeletonClassName} h-[5.5rem] w-12`} />
              ))}
            </div>
          ) : (
            <div className={`flex h-[5.5rem] w-12 flex-col items-center justify-center rounded-lg border px-1.5 py-2 text-center ${currentTheme.border} ${statusSurfaceClassName}`}>
              <span className={`font-due-date text-[10px] font-semibold ${isDarkMode ? "text-red-400" : "text-red-500"}`}>N/A</span>
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className={shellClassName} aria-label={`${getVariantLabel(variant)} ${previewState} leaderboard preview`}>
      <div className={`pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-16 left-4 h-28 w-28 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />
      <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
        {isLoading ? (
          <div className="space-y-2.5" aria-label="Leaderboard loading">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className={`flex h-[5.75rem] rounded-[1.35rem] border p-3 ${currentTheme.border} ${skeletonClassName}`}
              >
                <span className={`h-10 w-10 rounded-full ${isDarkMode ? "bg-white/10" : "bg-white/80"}`} />
                <span className={`ml-4 mt-1 h-3 w-28 rounded-full ${isDarkMode ? "bg-white/10" : "bg-white/80"}`} />
                <span className={`ml-auto h-4 w-10 rounded-full ${isDarkMode ? "bg-white/10" : "bg-white/80"}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-2xl border p-4 ${currentTheme.border} ${statusSurfaceClassName}`}>
            <p className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
              Leaderboard unavailable right now.
            </p>
          </div>
        )}
      </ExpandedContentFrame>
    </aside>
  );
}

function PeriodSwitcher({
  period,
  onPeriodChange,
  currentTheme,
  quietSurfaceClassName,
  isDarkMode,
}: {
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  currentTheme: ReturnType<typeof getThemeColors>;
  quietSurfaceClassName: string;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`mt-3 inline-flex w-full items-center gap-1 rounded-xl border p-1 ${currentTheme.border} ${quietSurfaceClassName} ${
        isDarkMode
          ? "shadow-[0_14px_30px_-24px_rgba(0,0,0,0.9)]"
          : "shadow-[0_14px_30px_-26px_rgba(15,23,42,0.45)]"
      }`}
      role="group"
      aria-label="Leaderboard time window"
    >
      {LEADERBOARD_PERIODS.map((periodOption) => (
        <button
          key={periodOption}
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onPeriodChange(periodOption);
          }}
          className={`font-ui-condensed relative inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold tracking-[0.01em] transition-all focus:outline-none ${
            periodOption === period
              ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
              : `${currentTheme.textSecondary} hover:${currentTheme.primaryText} ${isDarkMode ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.04]"}`
          }`}
          aria-pressed={periodOption === period}
        >
          {LEADERBOARD_PERIOD_LABELS[periodOption]}
        </button>
      ))}
    </div>
  );
}

function ExpandedContentFrame({
  period,
  onPeriodChange,
  currentTheme,
  quietSurfaceClassName,
  isDarkMode,
  children,
}: {
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  currentTheme: ReturnType<typeof getThemeColors>;
  quietSurfaceClassName: string;
  isDarkMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10">
      <PeriodSwitcher
        period={period}
        onPeriodChange={onPeriodChange}
        currentTheme={currentTheme}
        quietSurfaceClassName={quietSurfaceClassName}
        isDarkMode={isDarkMode}
      />
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CollapsedPreview({
  board,
  period,
  variant,
  topThree,
  currentUser,
  currentTheme,
  isDarkMode,
  panelSurfaceClassName,
}: {
  board: LevelLeaderboardBoard;
  period: LeaderboardPeriod;
  variant: LevelLeaderboardVariant;
  topThree: RankedMember[];
  currentUser: RankedMember | undefined;
  currentTheme: ReturnType<typeof getThemeColors>;
  isDarkMode: boolean;
  panelSurfaceClassName: string;
}) {
  const isCrownStack = variant === "crown-stack";
  const collapsedCurrentUser = isCrownStack && currentUser && currentUser.rank > 3 ? currentUser : undefined;
  const crownStackCollapsedCardBaseClassName = "flex h-[5.5rem] w-12 flex-col items-center justify-center rounded-lg border px-1.5 py-2.5 backdrop-blur-xl";
  const crownStackCurrentUserHighlightClassName = isDarkMode
    ? "ring-2 ring-inset ring-white/35 shadow-[0_0_24px_-14px_rgba(255,255,255,0.85),0_0_34px_-24px_rgba(255,255,255,0.65)]"
    : "ring-2 ring-inset ring-slate-900/22 shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_0_24px_-12px_rgba(15,23,42,0.45)]";
  const collapsedShellClassName = isCrownStack
    ? `relative flex w-[4.25rem] flex-col items-center overflow-hidden rounded-[1.45rem] border px-2 py-3 backdrop-blur-xl ${panelSurfaceClassName}`
    : `relative flex min-h-[25.5rem] w-[4.25rem] flex-col items-center overflow-hidden rounded-[1.45rem] border px-2 py-3 backdrop-blur-xl ${panelSurfaceClassName}`;

  return (
    <aside
      className={collapsedShellClassName}
      aria-label={`${board.name} ${getVariantLabel(variant)} collapsed leaderboard preview`}
    >
      <div className={`pointer-events-none absolute -top-8 h-20 w-20 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-2xl`} />
      {isCrownStack ? <div className={`pointer-events-none absolute -bottom-8 h-20 w-20 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-2xl`} /> : null}
      {variant === "neon-bracket" ? <div className={`absolute bottom-4 top-14 w-px bg-gradient-to-b ${currentTheme.primary}`} /> : null}
      {variant === "pulse-terminal" ? (
        <div className={`font-system-signal absolute top-2 text-[8px] font-semibold uppercase tracking-[0.16em] ${currentTheme.primaryText}`}>XP</div>
      ) : null}

      <div className={`relative z-10 flex flex-col items-center gap-3 ${isCrownStack ? "" : "h-full min-h-0"}`}>
        {isCrownStack ? (
          <span className={`font-ui-condensed text-[11px] font-semibold tracking-[0.01em] ${currentTheme.primaryText}`}>
            {LEADERBOARD_PERIOD_LABELS[period]}
          </span>
        ) : null}
        <div className={`flex flex-col items-center ${isCrownStack ? "gap-2" : variant === "ledger-chips" ? "gap-2.5" : variant === "crown-deck" ? "-space-y-1" : "gap-1.5"}`} aria-label={isCrownStack ? "Leaderboard members" : "Top three members"}>
          {topThree.map((member) => {
            const isCurrentUser = member.userId === board.currentUserId;

            return (
              <Tooltip key={member.userId}>
                <TooltipTrigger asChild>
                  <div
                    className={
                      isCrownStack
                        ? `${crownStackCollapsedCardBaseClassName} ${getSolidRankTone(member.rank, isDarkMode)} ${isCurrentUser ? crownStackCurrentUserHighlightClassName : ""}`
                        : `relative ${variant === "constellation-map" ? "after:absolute after:left-1/2 after:top-full after:h-2 after:w-px after:-translate-x-1/2 after:bg-current after:opacity-30 last:after:hidden" : ""}`
                    }
                  >
                    {isCrownStack ? (
                      <>
                        {isCurrentUser ? (
                          <span className="font-ui-condensed mb-1 text-[11px] font-semibold tracking-[0.01em]">YOU</span>
                        ) : null}
                        <MemberAvatar member={member} size={34} />
                        <span className="font-due-date mt-1.5 text-[10px] font-semibold">#{member.rank}</span>
                      </>
                    ) : (
                      <>
                        <MemberAvatar member={member} size={variant === "crown-deck" && member.rank === 1 ? 38 : 34} />
                        <span className={`font-due-date absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-semibold ${getRankTone(member.rank, isDarkMode)}`}>{member.rank}</span>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  #{member.rank} {member.displayName}: {formatNumber(member.xpByPeriod[period])} XP
                </TooltipContent>
              </Tooltip>
            );
          })}
          {collapsedCurrentUser ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`${crownStackCollapsedCardBaseClassName} ${crownStackCurrentUserHighlightClassName} ${currentTheme.border} ${isDarkMode ? "bg-white/[0.045]" : "bg-white/68"}`}>
                  <span className={`font-ui-condensed mb-1 text-[11px] font-semibold tracking-[0.01em] ${currentTheme.text}`}>YOU</span>
                  <MemberAvatar member={collapsedCurrentUser} size={34} />
                  <span className={`font-due-date mt-1.5 text-[10px] font-semibold ${currentTheme.primaryText}`}>#{collapsedCurrentUser.rank}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Your place: #{collapsedCurrentUser.rank}. {formatNumber(collapsedCurrentUser.xpByPeriod[period])} XP
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function LevelLeaderboardPreview({
  board,
  period,
  onPeriodChange,
  variant,
  density,
  previewState = "ready",
}: LevelLeaderboardPreviewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const panelEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);
  const rankedMembers = useMemo(() => getRankedMembers(board, period), [board, period]);
  const topThree = rankedMembers.slice(0, 3);
  const currentUser = rankedMembers.find((member) => member.userId === board.currentUserId);
  const totalXp = rankedMembers.reduce((sum, member) => sum + member.xpByPeriod[period], 0);
  const maxXp = Math.max(...rankedMembers.map((member) => member.xpByPeriod[period]));
  const leader = topThree[0];
  const panelSurfaceClassName = isDarkMode
    ? "border-zinc-800/95 bg-zinc-950/92 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.92)]"
    : "border-slate-200 bg-white/96 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.42)]";
  const quietSurfaceClassName = isDarkMode ? "bg-white/[0.055]" : "bg-slate-50/94";
  const shellClassName = `relative flex min-h-[25.5rem] w-72 flex-col overflow-hidden rounded-[1.75rem] border p-3.5 backdrop-blur-xl ${panelSurfaceClassName}`;
  const subtleGlow = <div className={`pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-gradient-to-br ${currentTheme.primarySoft} blur-3xl`} />;
  const lowerGlow = <div className={`pointer-events-none absolute -bottom-16 left-4 h-28 w-28 rounded-full bg-gradient-to-tr ${currentTheme.primarySoftStrong} blur-3xl`} />;

  if (previewState !== "ready") {
    return (
      <LeaderboardStatePreview
        density={density}
        previewState={previewState}
        period={period}
        onPeriodChange={onPeriodChange}
        currentTheme={currentTheme}
        isDarkMode={isDarkMode}
        panelSurfaceClassName={panelSurfaceClassName}
        quietSurfaceClassName={quietSurfaceClassName}
        variant={variant}
      />
    );
  }

  if (density === "collapsed") {
    return (
      <CollapsedPreview
        board={board}
        period={period}
        variant={variant}
        topThree={topThree}
        currentUser={currentUser}
        currentTheme={currentTheme}
        isDarkMode={isDarkMode}
        panelSurfaceClassName={panelSurfaceClassName}
      />
    );
  }

  if (variant === "podium-rail") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} podium rail leaderboard preview`}>
        {subtleGlow}
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className="grid grid-cols-3 items-end gap-2">
            {[topThree[1], topThree[0], topThree[2]].map((member, index) => {
              if (!member) return null;
              const heightClassName = index === 1 ? "h-32" : index === 0 ? "h-24" : "h-20";
              return (
                <div key={member.userId} className="flex flex-col items-center gap-2">
                  <MemberAvatar member={member} size={index === 1 ? 44 : 36} />
                  <div className={`flex w-full flex-col items-center justify-end rounded-2xl border p-2 ${heightClassName} ${getRankTone(member.rank, isDarkMode)}`}>
                    <span className="font-due-date text-lg font-semibold">#{member.rank}</span>
                    <span className="font-due-date text-[11px] font-semibold">{formatNumber(member.xpByPeriod[period])}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "orbit-stack") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} orbit stack leaderboard preview`}>
        {subtleGlow}
        {lowerGlow}
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className="relative mx-auto h-44 w-44 rounded-full border border-dashed border-current/20">
            <div className={`absolute inset-10 grid place-items-center rounded-full border ${currentTheme.border} ${quietSurfaceClassName}`}>
              <div className="text-center">
                <p className={`font-due-date text-xl font-semibold ${currentTheme.text}`}>{formatNumber(totalXp)}</p>
                <p className={panelEyebrowClassName}>team xp</p>
              </div>
            </div>
            {topThree.map((member, index) => {
              const positions = ["left-1/2 top-0 -translate-x-1/2", "bottom-5 left-1", "bottom-5 right-1"];
              return (
                <div key={member.userId} className={`absolute ${positions[index]}`}>
                  <MemberAvatar member={member} size={index === 0 ? 46 : 38} />
                  <span className={`font-due-date absolute -bottom-1 -right-1 rounded-full border px-1 text-[10px] font-semibold ${getRankTone(member.rank, isDarkMode)}`}>#{member.rank}</span>
                </div>
              );
            })}
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "xp-ticker") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} xp ticker leaderboard preview`}>
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className={`font-due-date rounded-2xl border p-3 ${currentTheme.border} ${quietSurfaceClassName}`}>
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.01em]">
              <span className={currentTheme.textMuted}>Rank</span>
              <span className={currentTheme.textMuted}>XP / LVL</span>
            </div>
            <div className="space-y-2">
              {topThree.map((member) => (
                <div key={member.userId} className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 rounded-xl border px-2 py-2 ${currentTheme.border} ${isDarkMode ? "bg-black/18" : "bg-white/70"}`}>
                  <span className={`font-due-date text-base font-semibold ${currentTheme.primaryText}`}>0{member.rank}</span>
                  <span className={`truncate text-xs font-semibold ${currentTheme.text}`}>{member.displayName}</span>
                  <span className={`text-right text-xs ${currentTheme.textMuted}`}>{formatNumber(member.xpByPeriod[period])} / L{member.level}</span>
                </div>
              ))}
            </div>
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "signal-strips") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} signal strips leaderboard preview`}>
        {subtleGlow}
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className="space-y-3">
            {topThree.map((member) => (
              <div key={member.userId} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <RankBadge rank={member.rank} isDarkMode={isDarkMode} />
                    <span className={`truncate text-sm font-semibold ${currentTheme.text}`}>{member.displayName}</span>
                  </div>
                  <span className={`font-due-date text-xs font-semibold ${currentTheme.textMuted}`}>{formatNumber(member.xpByPeriod[period])}</span>
                </div>
                <div className={`h-3 overflow-hidden rounded-full ${isDarkMode ? "bg-white/[0.06]" : "bg-slate-200/80"}`}>
                  <div className={`h-full rounded-full bg-gradient-to-r ${currentTheme.primary}`} style={{ width: getProgressWidth(member, period, maxXp) }} />
                </div>
              </div>
            ))}
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "crown-deck") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} crown deck leaderboard preview`}>
        {subtleGlow}
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          {leader ? (
            <div className={`rounded-[1.5rem] border p-4 ${getRankTone(1, isDarkMode)}`}>
              <div className="flex items-center justify-between gap-3">
                <MemberAvatar member={leader} size={50} />
                <Crown className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="mt-3 truncate text-base font-semibold">{leader.displayName}</p>
              <p className="font-due-date mt-1 text-2xl font-semibold">{formatNumber(leader.xpByPeriod[period])} XP</p>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {topThree.slice(1).map((member) => (
              <div key={member.userId} className={`rounded-2xl border p-2 ${getRankTone(member.rank, isDarkMode)}`}>
                <RankBadge rank={member.rank} isDarkMode={isDarkMode} />
                <p className="mt-2 truncate text-xs font-semibold">{member.displayName}</p>
                <p className="font-due-date text-xs opacity-80">{formatNumber(member.xpByPeriod[period])}</p>
              </div>
            ))}
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "crown-stack") {
    const crownStackAvatarSize = 46;
    const crownStackSurfaceClassName = isDarkMode ? "bg-white/[0.045]" : "bg-white/68";
    const crownStackShellClassName = `relative flex w-72 flex-col overflow-hidden rounded-[1.75rem] border p-3.5 backdrop-blur-xl ${panelSurfaceClassName}`;
    const crownStackPlaceCardClassName = "flex h-[6.75rem] flex-col justify-between rounded-[1.35rem] border px-3 py-3 backdrop-blur-xl";
    const crownStackCurrentUserHighlightClassName = isDarkMode
      ? "ring-2 ring-inset ring-white/35 shadow-[0_0_28px_-14px_rgba(255,255,255,0.78),0_16px_40px_-30px_rgba(0,0,0,0.9)]"
      : "ring-2 ring-inset ring-slate-900/22 shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_0_32px_-14px_rgba(15,23,42,0.48),0_14px_30px_-24px_rgba(15,23,42,0.42)]";
    const crownStackRankStyles: Record<number, { iconSizeClassName: string; nameClassName: string; xpClassName: string }> = {
      1: {
        iconSizeClassName: "h-6 w-6",
        nameClassName: "text-base",
        xpClassName: "text-xl",
      },
      2: {
        iconSizeClassName: "h-5 w-5",
        nameClassName: "text-sm",
        xpClassName: "text-lg",
      },
      3: {
        iconSizeClassName: "h-4 w-4",
        nameClassName: "text-xs",
        xpClassName: "text-base",
      },
    };
    const crownStackCurrentUser = currentUser && currentUser.rank > 3 ? currentUser : undefined;

    return (
      <aside className={crownStackShellClassName} aria-label={`${board.name} crown stack leaderboard preview`}>
        {subtleGlow}
        {lowerGlow}
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={crownStackSurfaceClassName} isDarkMode={isDarkMode}>
          <div className="space-y-2.5">
            {topThree.map((member) => {
              const rankStyle = crownStackRankStyles[member.rank] ?? crownStackRankStyles[3];
              const isCurrentUser = member.userId === board.currentUserId;

              return (
                <div
                  key={member.userId}
                  className={`${crownStackPlaceCardClassName} ${getSolidRankTone(member.rank, isDarkMode)} ${
                    isCurrentUser ? crownStackCurrentUserHighlightClassName : ""
                  }`}
                >
                  <div className="flex min-h-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-5">
                      <MemberAvatar member={member} size={crownStackAvatarSize} />
                      <div className="min-w-0">
                        {isCurrentUser ? (
                          <p className="font-ui-condensed truncate text-xl font-semibold tracking-[0.01em]">YOU</p>
                        ) : (
                          <>
                            <p className={`truncate font-semibold ${rankStyle.nameClassName}`}>{member.username}</p>
                            <p className="mt-0.5 truncate text-xs opacity-75">{member.displayName}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <CrownStackRankIcon rank={member.rank} className={rankStyle.iconSizeClassName} />
                      <span className="font-due-date text-[10px] font-semibold opacity-75">#{member.rank}</span>
                    </div>
                  </div>
                  <p className={`font-due-date font-semibold ${rankStyle.xpClassName}`}>
                    {formatNumber(member.xpByPeriod[period])} XP
                  </p>
                </div>
              );
            })}
          </div>
          {crownStackCurrentUser ? (
            <div className={`${crownStackPlaceCardClassName} ${crownStackCurrentUserHighlightClassName} mt-3 ${currentTheme.border} ${crownStackSurfaceClassName}`}>
              <div className="flex min-h-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-5">
                  <MemberAvatar member={crownStackCurrentUser} size={crownStackAvatarSize} />
                  <div className="min-w-0">
                    <p className={`font-ui-condensed truncate text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>YOU</p>
                  </div>
                </div>
                <span className={`font-due-date shrink-0 text-[10px] font-semibold ${currentTheme.primaryText}`}>#{crownStackCurrentUser.rank}</span>
              </div>
              <p className={`font-due-date text-base font-semibold ${currentTheme.text}`}>
                {formatNumber(crownStackCurrentUser.xpByPeriod[period])} XP
              </p>
            </div>
          ) : null}
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "pulse-terminal") {
    return (
      <aside className={`${shellClassName} font-system-signal`} aria-label={`${board.name} pulse terminal leaderboard preview`}>
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className={`flex items-center justify-between border-b pb-3 text-[10px] uppercase tracking-[0.18em] ${currentTheme.border} ${currentTheme.textMuted}`}>
            <span>xp_stream</span>
            <span className={currentTheme.primaryText}>{LEADERBOARD_PERIOD_LABELS[period].toLowerCase()}</span>
          </div>
          <div className="mt-4 space-y-2">
            {topThree.map((member) => (
              <div key={member.userId} className={`rounded-xl border px-3 py-2 ${currentTheme.border} ${quietSurfaceClassName}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={currentTheme.text}>#{member.rank} {member.username}</span>
                  <span className={currentTheme.primaryText}>{formatNumber(member.xpByPeriod[period])}</span>
                </div>
              </div>
            ))}
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "glass-ladder") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} glass ladder leaderboard preview`}>
        {subtleGlow}
        {lowerGlow}
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className="space-y-2">
            {topThree.map((member) => (
              <div key={member.userId} className={`flex items-center gap-3 rounded-[1.35rem] border p-3 backdrop-blur-xl ${currentTheme.border} ${isDarkMode ? "bg-white/[0.045]" : "bg-white/68"}`}>
                <MemberAvatar member={member} size={38} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{member.displayName}</p>
                  <p className={`font-due-date text-xs ${currentTheme.textMuted}`}>#{member.rank} - L{member.level}</p>
                </div>
                <span className={`font-due-date text-sm font-semibold ${currentTheme.text}`}>{formatNumber(member.xpByPeriod[period])}</span>
              </div>
            ))}
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "neon-bracket") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} neon bracket leaderboard preview`}>
        <div className={`absolute bottom-8 left-6 top-24 w-px bg-gradient-to-b ${currentTheme.primary}`} />
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className="space-y-3">
            {topThree.map((member) => (
              <div key={member.userId} className="relative pl-8">
                <span className={`absolute left-0 top-1/2 h-px w-6 bg-gradient-to-r ${currentTheme.primary}`} />
                <div className={`rounded-2xl border p-3 ${currentTheme.border} ${quietSurfaceClassName}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-ui-condensed truncate text-sm font-semibold ${currentTheme.text}`}>#{member.rank} {member.displayName}</span>
                    <span className={`font-due-date text-xs font-semibold ${currentTheme.primaryText}`}>{formatNumber(member.xpByPeriod[period])}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  if (variant === "ledger-chips") {
    return (
      <aside className={shellClassName} aria-label={`${board.name} ledger chips leaderboard preview`}>
        <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
          <div className="grid grid-cols-2 gap-2">
            {topThree.map((member) => (
              <div key={member.userId} className={`rounded-2xl border p-2 ${currentTheme.border} ${quietSurfaceClassName}`}>
                <p className={`font-due-date text-[11px] font-semibold ${currentTheme.primaryText}`}>#{member.rank}</p>
                <p className={`mt-1 truncate text-xs font-semibold ${currentTheme.text}`}>{member.displayName}</p>
                <p className={`font-due-date mt-1 text-sm font-semibold ${currentTheme.text}`}>{formatNumber(member.xpByPeriod[period])}</p>
              </div>
            ))}
          </div>
          <div className={`mt-3 rounded-2xl border p-3 ${currentTheme.border} ${quietSurfaceClassName}`}>
            <p className={panelEyebrowClassName}>Total ledger</p>
            <p className={`font-due-date mt-1 text-xl font-semibold ${currentTheme.text}`}>{formatNumber(totalXp)} XP</p>
          </div>
          <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
        </ExpandedContentFrame>
      </aside>
    );
  }

  return (
    <aside className={shellClassName} aria-label={`${board.name} constellation map leaderboard preview`}>
      {subtleGlow}
      <ExpandedContentFrame period={period} onPeriodChange={onPeriodChange} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} isDarkMode={isDarkMode}>
        <div className="relative mx-auto h-44 w-48">
          <svg className={`absolute inset-0 h-full w-full ${currentTheme.primaryText}`} viewBox="0 0 192 176" aria-hidden="true">
            <path d="M96 26 L44 118 L148 126 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" opacity="0.42" />
          </svg>
          {topThree.map((member, index) => {
            const positions = ["left-[4.7rem] top-0", "left-0 top-[5.7rem]", "right-0 top-[6.2rem]"];
            return (
              <div key={member.userId} className={`absolute ${positions[index]}`}>
                <MemberAvatar member={member} size={index === 0 ? 48 : 40} />
                <span className={`font-due-date absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border px-1.5 text-[10px] font-semibold ${getRankTone(member.rank, isDarkMode)}`}>#{member.rank}</span>
              </div>
            );
          })}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1.5 ${currentTheme.border} ${quietSurfaceClassName}`}>
            <span className={`font-due-date text-xs font-semibold ${currentTheme.text}`}>{formatNumber(totalXp)} XP</span>
          </div>
        </div>
        <CurrentUserStrip currentUser={currentUser} period={period} currentTheme={currentTheme} quietSurfaceClassName={quietSurfaceClassName} />
      </ExpandedContentFrame>
    </aside>
  );
}
