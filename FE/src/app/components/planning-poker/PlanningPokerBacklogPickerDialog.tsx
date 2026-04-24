import { useMemo, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";

import type { Card } from "../../utils/cards";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { cn } from "../ui/utils";

interface PlanningPokerBacklogPickerDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  tasks: Card[];
  currentTaskId: number | null;
  onClose: () => void;
  onSelectTask: (taskId: number) => void | Promise<void>;
}

export function PlanningPokerBacklogPickerDialog({
  isOpen,
  isLoading,
  isSubmitting,
  tasks,
  currentTaskId,
  onClose,
  onSelectTask,
}: PlanningPokerBacklogPickerDialogProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const [query, setQuery] = useState("");

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      if (task.id === currentTaskId) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [currentTaskId, query, tasks]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Backlog tasks</DialogTitle>
          <DialogDescription>
            Choose an unestimated backlog task to make it active in this planning poker room.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", currentTheme.textMuted)} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search backlog tasks"
              className="pl-9"
            />
          </div>

          <div className={cn("max-h-[24rem] space-y-2 overflow-y-auto rounded-xl border p-2", currentTheme.border)}>
            {isLoading ? (
              <div className={cn("flex items-center justify-center gap-2 px-4 py-10 text-sm", currentTheme.textMuted)}>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading backlog tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className={cn("px-4 py-10 text-center text-sm", currentTheme.textMuted)}>
                No unestimated backlog tasks match this search.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onSelectTask(task.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                    currentTheme.border,
                    isDarkMode ? "bg-slate-950/40 hover:bg-slate-950/70" : "bg-white hover:bg-slate-50",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <p className={cn("truncate text-sm font-semibold", currentTheme.text)}>{task.title}</p>
                    {task.description?.trim() ? (
                      <p className={cn("line-clamp-2 text-xs", currentTheme.textMuted)}>{task.description}</p>
                    ) : null}
                  </div>
                  <span className={cn("shrink-0 text-xs font-medium", currentTheme.textMuted)}>Choose</span>
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
