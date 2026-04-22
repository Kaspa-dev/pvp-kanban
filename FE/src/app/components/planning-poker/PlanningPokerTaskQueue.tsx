import { CheckCircle2, Clock3, LoaderCircle, Sparkles } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { cn } from "../ui/utils";
import { useTheme, getThemeColors } from "../../contexts/ThemeContext";
import type { PlanningPokerSessionTask } from "../../utils/planningPoker";
import { getWorkspaceSurfaceStyles } from "../../utils/workspaceSurfaceStyles";

interface PlanningPokerTaskQueueProps {
  activeTask: PlanningPokerSessionTask | null;
  queue: PlanningPokerSessionTask[];
  isRevealed: boolean;
  isHost: boolean;
  recommendationOptions: number[];
  isSelectingRecommendation: boolean;
  onSelectRecommendation: (storyPoints: number) => void | Promise<void>;
}

function getRoundStateLabel(value: string) {
  switch (value.toLowerCase()) {
    case "voting":
      return "Live round";
    case "revealed":
      return "Revealed";
    case "pending":
      return "Queued";
    default:
      return value;
  }
}

export function PlanningPokerTaskQueue({
  activeTask,
  queue,
  isRevealed,
  isHost,
  recommendationOptions,
  isSelectingRecommendation,
  onSelectRecommendation,
}: PlanningPokerTaskQueueProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const heroSurfaceClassName = cn(
    "overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-950/20",
    workspaceSurface.elevatedPanelSurfaceClassName,
  );

  return (
    <Card className={heroSurfaceClassName}>
      <CardHeader className={`space-y-3 border-b ${currentTheme.border} px-5 py-5 sm:px-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={`border ${currentTheme.primaryBorder} bg-gradient-to-r ${currentTheme.primarySoftStrong} ${currentTheme.primaryText} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]`}
          >
            Task queue
          </Badge>
          <span className={`text-xs font-medium uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>
            Current task first, next tasks second
          </span>
        </div>
        <CardTitle className={`text-xl font-semibold ${currentTheme.text}`}>Board focus</CardTitle>
        <CardDescription className={`text-sm leading-6 ${currentTheme.textMuted}`}>
          The active task carries the round. Remaining backlog work stays visible as supporting
          context underneath it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-5 py-5 sm:px-6">
        {activeTask ? (
          <section
            className={cn(
              "relative overflow-hidden rounded-[2rem] border p-5 sm:p-6",
              currentTheme.border,
              isDarkMode
                ? "bg-gradient-to-br from-cyan-400/10 via-slate-950/80 to-slate-900/90"
                : "bg-gradient-to-br from-cyan-100/90 via-white to-slate-100/80",
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.primaryText} bg-gradient-to-r ${currentTheme.primarySoftStrong} border ${currentTheme.primaryBorder}`}
                  >
                    Current task
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      currentTheme.border,
                      isDarkMode ? "bg-white/[0.04] text-slate-100" : "bg-white/80 text-slate-700",
                    )}
                  >
                    {getRoundStateLabel(activeTask.roundState)}
                  </Badge>
                  {activeTask.recommendedStoryPoints !== null ? (
                    <Badge className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">
                      Recommendation set
                    </Badge>
                  ) : null}
                </div>

                <div className="max-w-4xl space-y-3">
                  <h2 className={`text-3xl font-semibold tracking-tight ${currentTheme.text} sm:text-4xl`}>
                    {activeTask.title}
                  </h2>
                  <p className={`max-w-3xl text-sm leading-7 sm:text-base ${currentTheme.textMuted}`}>
                    {activeTask.description?.trim()
                      ? activeTask.description
                      : "No additional description was added for this task."}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "min-w-[15rem] rounded-3xl border px-4 py-4 text-sm backdrop-blur",
                  currentTheme.border,
                  isDarkMode ? "bg-slate-950/55" : "bg-white/75",
                )}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}
                >
                  Session metadata
                </p>
                <dl className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt className={`text-xs uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Round
                    </dt>
                    <dd className={`text-sm font-medium ${currentTheme.text}`}>
                      {getRoundStateLabel(activeTask.roundState)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className={`text-xs uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Recommendation
                    </dt>
                    <dd className={`text-sm font-medium ${currentTheme.text}`}>
                      {activeTask.recommendedStoryPoints !== null
                        ? `${activeTask.recommendedStoryPoints} points`
                        : isHost
                          ? "Needs selection"
                          : "Waiting on host"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className={`text-xs uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                      Applied
                    </dt>
                    <dd className={`text-sm font-medium ${currentTheme.text}`}>
                      {activeTask.appliedStoryPoints !== null
                        ? `${activeTask.appliedStoryPoints} points`
                        : "Not applied"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
              <div
                className={cn(
                  "rounded-[1.75rem] border px-4 py-4",
                  currentTheme.border,
                  isDarkMode ? "bg-white/[0.04]" : "bg-black/[0.03]",
                )}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>
                  Round context
                </p>
                <p className={`mt-2 text-sm leading-6 ${currentTheme.textMuted}`}>
                  {isRevealed
                    ? "The round is open and the team can inspect the reveal before choosing the recommendation."
                    : "The task is active. Cast a vote, then wait for the reveal to compare estimates."}
                </p>
                {isRevealed && activeTask.voteSummary.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeTask.voteSummary.map((entry) => (
                      <span
                        key={entry.cardValue}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                          currentTheme.border,
                          isDarkMode
                            ? "bg-cyan-400/10 text-cyan-100"
                            : "bg-cyan-500/10 text-cyan-800",
                        )}
                      >
                        <span>{entry.cardValue}</span>
                        <span className={isDarkMode ? "text-cyan-100/70" : "text-cyan-900/70"}>
                          x{entry.count}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={`mt-4 text-xs ${currentTheme.textMuted}`}>
                    Vote details stay hidden until reveal.
                  </p>
                )}
              </div>

              <div
                className={cn(
                  "rounded-[1.75rem] border px-4 py-4",
                  currentTheme.border,
                  isDarkMode ? "bg-slate-950/50" : "bg-white/75",
                )}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>
                  Recommendation
                </p>
                {isRevealed ? (
                  <div className="mt-3 space-y-4">
                    <p className={`text-sm leading-6 ${currentTheme.textMuted}`}>
                      {activeTask.recommendedStoryPoints !== null
                        ? "This estimate is selected for the task after discussion."
                        : isHost
                          ? "Choose the estimate that should carry back to the board."
                          : "Waiting for the host to choose the final estimate."}
                    </p>
                    {activeTask.recommendedStoryPoints !== null ? (
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium",
                          isDarkMode
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
                        )}
                      >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Final estimate {activeTask.recommendedStoryPoints}
                      </div>
                    ) : isHost ? (
                      <div className={`flex items-center gap-2 text-xs ${currentTheme.textMuted}`}>
                        {isSelectingRecommendation ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            Saving recommendation...
                          </>
                        ) : (
                          "No final estimate selected yet."
                        )}
                      </div>
                    ) : null}

                    {isHost ? (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {recommendationOptions.map((value) => {
                          const isSelected = activeTask.recommendedStoryPoints === value;

                          return (
                            <Button
                              key={value}
                              type="button"
                              variant="outline"
                              disabled={isSelectingRecommendation}
                              onClick={() => void onSelectRecommendation(value)}
                              className={cn(
                                "h-11 rounded-xl border text-sm font-semibold transition-all",
                                currentTheme.border,
                                isSelected
                                  ? isDarkMode
                                    ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                                    : "border-cyan-500 bg-cyan-500/10 text-cyan-800"
                                  : isDarkMode
                                    ? "bg-slate-950/80 text-slate-100 hover:bg-slate-900"
                                    : "bg-white/70 text-slate-700 hover:bg-white",
                              )}
                            >
                              {value}
                            </Button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className={`mt-2 text-sm leading-6 ${currentTheme.textMuted}`}>
                    Recommendation actions stay attached to the active task once the round is
                    revealed.
                  </p>
                )}
              </div>
            </div>

            {activeTask.appliedStoryPoints !== null ? (
              <div
                className={cn(
                  "mt-5 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
                  isDarkMode
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
                )}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Story points applied: {activeTask.appliedStoryPoints}
              </div>
            ) : null}
          </section>
        ) : (
          <div
            className={cn(
              "rounded-[2rem] border px-5 py-6 text-sm",
              currentTheme.border,
              isDarkMode ? "bg-slate-950/40 text-slate-300" : "bg-white/75 text-slate-600",
            )}
          >
            No active task is available in this session.
          </div>
        )}

        <Separator className={isDarkMode ? "bg-white/10" : "bg-black/10"} />

        <section className="space-y-3">
          <div className={`flex items-center gap-2 text-sm font-medium ${currentTheme.text}`}>
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Up next
          </div>
          {queue.length > 0 ? (
            <ScrollArea className="h-64 pr-4">
              <ol className="space-y-3">
                {queue.map((task) => (
                  <li
                    key={task.sessionTaskId}
                    className={cn(
                      "rounded-2xl border px-4 py-3",
                      currentTheme.border,
                      isDarkMode ? "bg-white/[0.03]" : "bg-black/[0.03]",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className={`text-sm font-medium ${currentTheme.text}`}>{task.title}</p>
                        <p className={`text-xs leading-5 ${currentTheme.textMuted}`}>
                          {task.description?.trim()
                            ? task.description
                            : "No description provided."}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-[0.16em]",
                          currentTheme.border,
                          isDarkMode ? "bg-slate-950/70 text-slate-300" : "bg-white/85 text-slate-600",
                        )}
                      >
                        {getRoundStateLabel(task.roundState)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          ) : (
            <div
              className={cn(
                "rounded-2xl border px-4 py-4 text-sm",
                currentTheme.border,
                isDarkMode ? "bg-slate-950/40 text-slate-300" : "bg-white/70 text-slate-600",
              )}
            >
              No additional tasks are queued for this session yet.
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
