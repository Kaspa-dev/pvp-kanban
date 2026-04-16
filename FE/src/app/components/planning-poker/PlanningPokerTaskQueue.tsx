import { CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { Badge } from "../ui/badge";
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

              {isRevealed ? (
                <div className="min-w-44 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Recommendation
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {activeTask.recommendedStoryPoints ?? "Pending"}
                  </p>
                </div>
              ) : null}
            </div>

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
