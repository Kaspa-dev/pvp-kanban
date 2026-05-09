import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  CircleDot,
  Flag,
  Hash,
  Tag,
  UserRound,
} from "lucide-react";
import { Board } from "../../utils/boards";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { TaskDetails, UNASSIGNED_ASSIGNEE } from "../../utils/cards";
import { Label } from "../../utils/labels";
import { BoardLogo } from "../BoardLogo";
import { BoardStatusBadge } from "../BoardStatusBadge";
import { PriorityBadge } from "../PriorityBadge";

interface TaskDetailsSummaryProps {
  board: Board;
  boardId: number;
  task: TaskDetails;
  labels: Label[];
}

const TASK_TYPE_LABELS: Record<NonNullable<TaskDetails["taskType"]>, string> = {
  story: "Story",
  task: "Task",
  bug: "Bug",
  spike: "Spike",
};

function formatDueDate(value: string | null | undefined) {
  if (!value) {
    return "No due date";
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function DetailRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="py-4">
      <div className="font-ui-condensed flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="mt-3 text-sm font-medium leading-6">
        {children ?? value}
      </div>
    </div>
  );
}

export function TaskDetailsSummary({ board, boardId, task, labels }: TaskDetailsSummaryProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const assignee = task.assigneeUserId ? task.assignee : UNASSIGNED_ASSIGNEE;
  const taskLabels = labels.filter((label) => task.labelIds.includes(label.id));
  const dividerClassName = isDarkMode ? "border-white/10" : "border-slate-200/80";

  return (
    <section className={`rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)]`}>
      <div className="px-6 py-6">
        <Link
          to={Number.isFinite(boardId) ? `/app/${boardId}` : "/app"}
          className={`inline-flex items-center gap-2 text-sm font-medium ${currentTheme.textSecondary} hover:${currentTheme.text}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to board
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <BoardLogo iconKey={board.logoIconKey} colorKey={board.logoColorKey} size="md" />
          <div className="min-w-0 flex-1">
            <p className={`font-ui-condensed text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
              Task details
            </p>
            <h1 className={`font-ui-condensed mt-1 break-words text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
              {task.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <BoardStatusBadge statusKey={task.status} />
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${currentTheme.border} ${currentTheme.textMuted}`}>
                Task ID <span className="font-due-date">#{task.id}</span>
              </span>
            </div>
          </div>
        </div>

        <div className={`mt-6 border-t ${dividerClassName}`}>
          <div className={`grid gap-x-12 md:grid-cols-2 ${currentTheme.textSecondary}`}>
            <div className={`border-b ${dividerClassName}`}>
              <DetailRow icon={UserRound} label="Assignee">
                <div>
                  <p className={currentTheme.text}>{assignee.displayName || assignee.name}</p>
                  {assignee.username ? (
                    <p className={`text-xs ${currentTheme.textMuted}`}>@{assignee.username}</p>
                  ) : null}
                </div>
              </DetailRow>
            </div>
            <div className={`border-b ${dividerClassName}`}>
              <DetailRow icon={CalendarDays} label="Due date" value={formatDueDate(task.dueDate)} />
            </div>
            <div className={`border-b ${dividerClassName}`}>
              <DetailRow icon={Hash} label="Story points" value={task.storyPoints != null ? String(task.storyPoints) : "Not estimated"} />
            </div>
            <div className={`border-b ${dividerClassName}`}>
              <DetailRow icon={CheckSquare} label="Task type" value={task.taskType ? TASK_TYPE_LABELS[task.taskType] : "Not set"} />
            </div>
            <div className={`border-b ${dividerClassName}`}>
              <DetailRow icon={Flag} label="Priority">
                {task.priority ? <PriorityBadge priority={task.priority} /> : <span>Not set</span>}
              </DetailRow>
            </div>
            <div className={`border-b ${dividerClassName}`}>
              <DetailRow icon={Tag} label="Labels">
                {taskLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {taskLabels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>No labels</span>
                )}
              </DetailRow>
            </div>
          </div>

          <div className={`border-b ${dividerClassName}`}>
            <DetailRow icon={CircleDot} label="Description">
              <p className={`min-h-16 whitespace-pre-wrap ${task.description?.trim() ? currentTheme.textSecondary : currentTheme.textMuted}`}>
                {task.description?.trim() || "No description provided."}
              </p>
            </DetailRow>
          </div>
        </div>
      </div>
    </section>
  );
}
