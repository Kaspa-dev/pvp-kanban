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
import type { PlanningPokerSessionTask } from "../../utils/planningPoker";

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
  return (
    <Card className="border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20">
      <CardHeader className="space-y-2">
        <CardTitle className="text-white">Task queue</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-300">
          The active task is live now. Remaining backlog work stays visible for context.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {activeTask ? (
          <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/8 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                    Active task
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-slate-950/60 text-slate-200"
                  >
                    {getRoundStateLabel(activeTask.roundState)}
                  </Badge>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{activeTask.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                    {activeTask.description?.trim()
                      ? activeTask.description
                      : "No additional description was added for this task."}
                  </p>
                </div>
              </div>

              {isRevealed && activeTask.voteSummary.length > 0 ? (
                <div className="min-w-56">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Revealed votes
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeTask.voteSummary.map((entry) => (
                        <span
                          key={entry.cardValue}
                          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
                        >
                          <span>{entry.cardValue}</span>
                          <span className="text-cyan-200/80">x{entry.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {isRevealed ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {activeTask.recommendedStoryPoints !== null
                        ? "Final recommendation"
                        : "Choose final estimate"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {activeTask.recommendedStoryPoints !== null
                        ? "This is the estimate selected for the task after the team discussion."
                        : isHost
                          ? "Pick the estimate that should carry back to the board."
                          : "Waiting for the host to choose the final estimate."}
                    </p>
                  </div>
                  {activeTask.recommendedStoryPoints !== null ? (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                      <div className="flex items-center gap-2 font-medium">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Final estimate
                      </div>
                      <p className="mt-2 text-2xl font-semibold">
                        {activeTask.recommendedStoryPoints}
                      </p>
                    </div>
                  ) : isHost ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
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
                </div>

                {isHost ? (
                  <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {recommendationOptions.map((value) => {
                      const isSelected = activeTask.recommendedStoryPoints === value;

                      return (
                        <Button
                          key={value}
                          type="button"
                          variant="outline"
                          disabled={isSelectingRecommendation}
                          onClick={() => void onSelectRecommendation(value)}
                          className={`h-11 rounded-xl border-white/10 ${
                            isSelected
                              ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                              : "bg-slate-950 text-slate-100 hover:bg-slate-900"
                          }`}
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">
                    {activeTask.recommendedStoryPoints !== null
                      ? `Final estimate selected: ${activeTask.recommendedStoryPoints}`
                      : "Waiting for the host to choose the final estimate."}
                  </p>
                )}
              </div>
            ) : null}

            {activeTask.appliedStoryPoints !== null ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Story points applied: {activeTask.appliedStoryPoints}
              </div>
            ) : null}
          </section>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 px-5 py-6 text-sm text-slate-300">
            No active task is available in this session.
          </div>
        )}

        <Separator className="bg-white/10" />

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Up next
          </div>
          {queue.length > 0 ? (
            <ScrollArea className="h-64 pr-4">
              <ol className="space-y-3">
                {queue.map((task) => (
                  <li
                    key={task.sessionTaskId}
                    className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-100">{task.title}</p>
                        <p className="text-xs leading-5 text-slate-400">
                          {task.description?.trim()
                            ? task.description
                            : "No description provided."}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-slate-900 text-slate-300"
                      >
                        {getRoundStateLabel(task.roundState)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-300">
              No additional tasks are queued for this session yet.
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
