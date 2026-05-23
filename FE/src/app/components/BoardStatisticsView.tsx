import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Clock3, HelpCircle, LoaderCircle, PieChart as PieChartIcon, TimerReset } from "lucide-react";
import { getThemeColors, type Theme, useTheme } from "../contexts/ThemeContext";
import { isApiError } from "../utils/auth";
import {
  BoardStatistics,
  BoardStatisticsArchiveRange,
  BoardStatisticsStatusCount,
  getBoardStatistics,
} from "../utils/cards";
import { getPriorityColor } from "../utils/priorityColors";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { AppAvatar } from "./AppAvatar";
import { getInputLikeControlClassName } from "./inputLikeControlStyles";
import { getPanelEyebrowClassName, getToolbarLabelClassName } from "./typographyStyles";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

interface BoardStatisticsViewProps {
  boardId: number;
  taskDataVersion: number;
}

const ARCHIVE_RANGE_OPTIONS: Array<{ value: BoardStatisticsArchiveRange; label: string }> = [
  { value: "14d", label: "14 days" },
  { value: "30d", label: "30 days" },
  { value: "12w", label: "12 weeks" },
];

const THEME_CHART_ACCENTS: Record<Theme, { primary: string; secondary: string; soft: string }> = {
  purple: { primary: "#a855f7", secondary: "#ec4899", soft: "#c084fc" },
  ocean: { primary: "#3b82f6", secondary: "#06b6d4", soft: "#60a5fa" },
  sunset: { primary: "#f97316", secondary: "#ef4444", soft: "#fb923c" },
  forest: { primary: "#16a34a", secondary: "#10b981", soft: "#4ade80" },
  mono: { primary: "#4b5563", secondary: "#111827", soft: "#9ca3af" },
  berry: { primary: "#c026d3", secondary: "#f43f5e", soft: "#e879f9" },
  lagoon: { primary: "#14b8a6", secondary: "#0ea5e9", soft: "#2dd4bf" },
  citrus: { primary: "#84cc16", secondary: "#f59e0b", soft: "#a3e635" },
  cobalt: { primary: "#6366f1", secondary: "#2563eb", soft: "#818cf8" },
};

const STATUS_CHART_CONFIG = {
  taskCount: {
    label: "Tasks",
    color: "var(--board-stat-accent)",
  },
} satisfies ChartConfig;

const ARCHIVE_CHART_CONFIG = {
  concludedCount: {
    label: "Concluded",
    color: "var(--board-stat-accent)",
  },
} satisfies ChartConfig;

const AGING_CHART_CONFIG = {
  daysInStatus: {
    label: "Days",
    color: "var(--board-stat-accent)",
  },
} satisfies ChartConfig;

const PRIORITY_CHART_CONFIG = {
  taskCount: {
    label: "Tasks",
  },
} satisfies ChartConfig;

function getTotalTaskCount(rows: Array<{ taskCount: number }>) {
  return rows.reduce((total, row) => total + row.taskCount, 0);
}

function getTotalStoryPoints(rows: BoardStatisticsStatusCount[]) {
  return rows.reduce((total, row) => total + row.storyPoints, 0);
}

function truncateChartLabel(value: string, maxLength = 22) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function getRangeSummary(range: BoardStatisticsArchiveRange) {
  if (range === "12w") {
    return "Last 12 weeks";
  }

  return `Last ${range.replace("d", "")} days`;
}

function buildStatusChartRows(items: BoardStatisticsStatusCount[]) {
  const activeRows = items.filter((item) => item.group === "active");
  const backlogRows = items.filter((item) => item.group === "backlog");

  return [
    ...activeRows,
    {
      statusKey: "backlog",
      label: "",
      group: "separator",
      taskCount: 0,
      storyPoints: 0,
      isSeparator: true,
    },
    ...backlogRows,
  ];
}

function StatisticsPanel({
  title,
  icon: Icon,
  children,
  action,
  className,
  tooltip,
}: {
  title: string;
  icon: typeof BarChart3;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  tooltip?: string;
}) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const subtleIconClassName = isDarkMode ? "text-zinc-500" : "text-gray-400";

  return (
    <section className={cn("rounded-2xl border p-5 shadow-sm backdrop-blur-xl", currentTheme.cardBg, currentTheme.border, className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", currentTheme.primaryBg, currentTheme.primaryText)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex items-center gap-2">
            <h2 className={cn(getPanelEyebrowClassName(currentTheme.text), "text-sm")}>{title}</h2>
            {tooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className={cn("h-3.5 w-3.5 cursor-help", subtleIconClassName)} />
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatisticsEmptyState({ label }: { label: string }) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <div className={cn("flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed px-4 text-sm", currentTheme.border, currentTheme.textMuted)}>
      {label}
    </div>
  );
}

function StatisticsSkeleton() {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={cn("h-[320px] animate-pulse rounded-2xl border p-5", currentTheme.cardBg, currentTheme.border)}
        >
          <div className={cn("h-9 w-44 rounded-xl", isDarkMode ? "bg-white/10" : "bg-black/10")} />
          <div className={cn("mt-8 h-48 rounded-2xl", isDarkMode ? "bg-white/[0.08]" : "bg-black/[0.08]")} />
        </div>
      ))}
    </div>
  );
}

export function BoardStatisticsView({ boardId, taskDataVersion }: BoardStatisticsViewProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const chartAccent = THEME_CHART_ACCENTS[theme];
  const [archiveRange, setArchiveRange] = useState<BoardStatisticsArchiveRange>("30d");
  const [statistics, setStatistics] = useState<BoardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getBoardStatistics(boardId, archiveRange)
      .then((nextStatistics) => {
        if (cancelled) {
          return;
        }

        setStatistics(nextStatistics);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setStatistics(null);
        setLoadError(isApiError(error) ? error.message : "Unable to load board statistics right now.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [archiveRange, boardId, taskDataVersion]);

  const handleArchiveRangeChange = (nextArchiveRange: BoardStatisticsArchiveRange) => {
    if (nextArchiveRange === archiveRange) {
      return;
    }

    setIsLoading(true);
    setLoadError("");
    setArchiveRange(nextArchiveRange);
  };

  const statusRows = statistics?.statusCounts.items ?? [];
  const statusChartRows = useMemo(() => buildStatusChartRows(statusRows), [statusRows]);
  const statusTotal = getTotalTaskCount(statusRows);
  const statusStoryPoints = getTotalStoryPoints(statusRows);
  const archiveTotal = getTotalTaskCount(
    statistics?.archiveTrend.buckets.map((bucket) => ({
      taskCount: bucket.concludedCount,
    })) ?? [],
  );
  const priorityTotal = getTotalTaskCount(statistics?.priorityMix ?? []);

  const agingChartRows = useMemo(
    () =>
      (statistics?.agingTasks ?? []).map((task) => ({
        ...task,
        shortTitle: truncateChartLabel(task.title, 28),
      })),
    [statistics],
  );

  const priorityRows = useMemo(
    () =>
      (statistics?.priorityMix ?? []).map((item) => ({
        ...item,
        fill: item.priority === "none" ? (isDarkMode ? "#71717a" : "#94a3b8") : getPriorityColor(item.priority, isDarkMode),
      })),
    [isDarkMode, statistics],
  );

  return (
    <main className={cn("min-h-0 flex-1 overflow-hidden", currentTheme.bgSecondary)}>
      <div
        className="h-full min-h-0 overflow-y-auto px-8 py-6 lg:px-10 xl:px-12"
        style={
          {
            "--board-stat-accent": chartAccent.primary,
            "--board-stat-accent-secondary": chartAccent.secondary,
            "--board-stat-accent-soft": chartAccent.soft,
          } as CSSProperties
        }
      >
        <div className="mx-auto flex w-full max-w-[1850px] flex-col gap-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className={cn("font-ui-condensed text-[2rem] font-semibold tracking-[0.01em]", currentTheme.text)}>
                Statistics
              </h1>
              <p className={cn("mt-1 text-base", currentTheme.textMuted)}>
                Board health, aging work, and concluded task movement.
              </p>
            </div>
            {isLoading && (
              <div className={cn("inline-flex items-center gap-2 text-sm", currentTheme.textMuted)}>
                <LoaderCircle className="h-4 w-4 animate-spin [animation-duration:650ms]" aria-hidden="true" />
                Loading
              </div>
            )}
          </header>

          <div className={cn("border-t", currentTheme.border)} />

          {isLoading && !statistics ? (
            <StatisticsSkeleton />
          ) : loadError ? (
            <div className={cn("rounded-2xl border p-6", currentTheme.cardBg, currentTheme.border)}>
              <p className={cn("text-sm", currentTheme.textMuted)}>{loadError}</p>
            </div>
          ) : statistics ? (
            <>
              <div className="grid gap-5 md:grid-cols-3">
                <div className={cn("rounded-2xl border px-5 py-4", workspaceSurface.panelSurfaceClassName)} style={workspaceSurface.panelSurfaceStyle}>
                  <p className={getToolbarLabelClassName(currentTheme.textMuted)}>Current work</p>
                  <p className={cn("mt-2 font-due-date text-3xl font-semibold tabular-nums", currentTheme.text)}>
                    {getTotalTaskCount(statistics.statusCounts.items)}
                  </p>
                </div>
                <div className={cn("rounded-2xl border px-5 py-4", workspaceSurface.panelSurfaceClassName)} style={workspaceSurface.panelSurfaceStyle}>
                  <p className={getToolbarLabelClassName(currentTheme.textMuted)}>Oldest shown</p>
                  <p className={cn("mt-2 font-due-date text-3xl font-semibold tabular-nums", currentTheme.text)}>
                    {statistics.agingTasks[0]?.daysInStatus ?? 0}d
                  </p>
                </div>
                <div className={cn("rounded-2xl border px-5 py-4", workspaceSurface.panelSurfaceClassName)} style={workspaceSurface.panelSurfaceStyle}>
                  <p className={getToolbarLabelClassName(currentTheme.textMuted)}>Concluded</p>
                  <p className={cn("mt-2 font-due-date text-3xl font-semibold tabular-nums", currentTheme.text)}>
                    {archiveTotal}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                <StatisticsPanel
                  title="Tasks By Status"
                  icon={BarChart3}
                  tooltip="Shows current unconcluded work. Active workflow columns are separated from queued and unqueued backlog tasks."
                >
                  <div className="mb-4 flex flex-wrap gap-4">
                    <span className={cn("font-due-date text-sm tabular-nums", currentTheme.textMuted)}>
                      {statusTotal} tasks
                    </span>
                    <span className={cn("font-due-date text-sm tabular-nums", currentTheme.textMuted)}>
                      {statusStoryPoints} points
                    </span>
                  </div>
                  {statusTotal > 0 ? (
                    <ChartContainer
                      config={STATUS_CHART_CONFIG}
                      className="h-[270px] w-full"
                      aria-label="Tasks by status"
                    >
                      <BarChart data={statusChartRows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={34} />
                        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                        <ReferenceLine x="" stroke={isDarkMode ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.18)"} strokeDasharray="4 4" />
                        <Bar dataKey="taskCount" radius={[10, 10, 4, 4]}>
                          {statusChartRows.map((entry) => (
                            <Cell
                              key={entry.statusKey}
                              fill={
                                entry.group === "separator"
                                  ? "transparent"
                                  : entry.group === "backlog"
                                    ? "var(--board-stat-accent-secondary)"
                                    : "var(--color-taskCount)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <StatisticsEmptyState label="No current tasks yet." />
                  )}
                </StatisticsPanel>

                <StatisticsPanel
                  title="Priority Mix"
                  icon={PieChartIcon}
                  tooltip="Shows how current unconcluded work is distributed by priority, including tasks without priority."
                >
                  {priorityTotal > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_180px]">
                      <ChartContainer
                        config={PRIORITY_CHART_CONFIG}
                        className="h-[250px] w-full"
                        aria-label="Priority mix"
                      >
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          <Pie
                            data={priorityRows}
                            dataKey="taskCount"
                            nameKey="label"
                            innerRadius={62}
                            outerRadius={92}
                            paddingAngle={3}
                          >
                            {priorityRows.map((entry) => (
                              <Cell key={entry.priority} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      <div className="flex flex-col justify-center gap-2">
                        {priorityRows.map((item) => (
                          <div key={item.priority} className="flex items-center justify-between gap-3 text-sm">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className={currentTheme.textSecondary}>{item.label}</span>
                            </span>
                            <span className={cn("font-due-date tabular-nums", currentTheme.text)}>{item.taskCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <StatisticsEmptyState label="No current tasks to classify." />
                  )}
                </StatisticsPanel>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <StatisticsPanel
                  title="Aging Tasks"
                  icon={Clock3}
                  tooltip="Shows the oldest unconcluded tasks based on how long each task has stayed in its current status."
                >
                  {agingChartRows.length > 0 ? (
                    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
                      <ChartContainer
                        config={AGING_CHART_CONFIG}
                        className="h-[300px] w-full"
                        aria-label="Oldest current tasks by days in status"
                      >
                        <BarChart
                          data={agingChartRows}
                          layout="vertical"
                          margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                        >
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                          <YAxis dataKey="shortTitle" type="category" width={120} tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                          <Bar dataKey="daysInStatus" fill="var(--color-daysInStatus)" radius={[0, 10, 10, 0]} />
                        </BarChart>
                      </ChartContainer>
                      <div className="space-y-2">
                        {statistics.agingTasks.map((task) => (
                          <div
                            key={task.taskId}
                            className={cn("flex items-center justify-between gap-3 rounded-xl border px-3 py-2", currentTheme.border, isDarkMode ? "bg-white/[0.03]" : "bg-white/70")}
                          >
                            <div className="min-w-0">
                              <p className={cn("truncate text-sm font-semibold", currentTheme.text)}>{task.title}</p>
                              <p className={cn("mt-0.5 text-xs", currentTheme.textMuted)}>{task.statusLabel}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {task.assignee ? (
                                <AppAvatar
                                  username={task.assignee.username}
                                  fullName={task.assignee.displayName}
                                  size={26}
                                  showTooltip
                                  tooltip={task.assignee.displayName || task.assignee.username}
                                  level={task.assignee.currentLevel}
                                />
                              ) : null}
                              <span className={cn("font-due-date text-sm font-semibold tabular-nums", currentTheme.primaryText)}>
                                {task.daysInStatus}d
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <StatisticsEmptyState label="No aging current tasks yet." />
                  )}
                </StatisticsPanel>

                <StatisticsPanel
                  title="Archive Trend"
                  icon={TimerReset}
                  tooltip="Shows concluded tasks over the selected period. These are tasks moved into History."
                  action={
                    <div className="flex flex-wrap gap-2">
                      {ARCHIVE_RANGE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleArchiveRangeChange(option.value)}
                          className={cn(
                            getInputLikeControlClassName(currentTheme, { selected: archiveRange === option.value }),
                            "px-3 py-1.5 text-sm font-semibold",
                            archiveRange === option.value ? currentTheme.primaryText : currentTheme.textSecondary,
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <div className="mb-4 flex flex-wrap gap-4">
                    <span className={cn("font-due-date text-sm tabular-nums", currentTheme.textMuted)}>
                      {getRangeSummary(archiveRange)}
                    </span>
                    <span className={cn("font-due-date text-sm tabular-nums", currentTheme.textMuted)}>
                      {archiveTotal} concluded
                    </span>
                  </div>
                  {archiveTotal > 0 ? (
                    <ChartContainer
                      config={ARCHIVE_CHART_CONFIG}
                      className="h-[300px] w-full"
                      aria-label="Concluded tasks over time"
                    >
                      <AreaChart data={statistics.archiveTrend.buckets} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="archiveTrendFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--board-stat-accent)" stopOpacity={0.34} />
                            <stop offset="95%" stopColor="var(--board-stat-accent)" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={34} />
                        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                        <Area
                          type="monotone"
                          dataKey="concludedCount"
                          stroke="var(--color-concludedCount)"
                          strokeWidth={2}
                          fill="url(#archiveTrendFill)"
                        />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <StatisticsEmptyState label="No concluded tasks in this period." />
                  )}
                </StatisticsPanel>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
