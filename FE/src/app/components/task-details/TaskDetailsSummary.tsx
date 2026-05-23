import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Bug,
  CalendarDays,
  CheckSquare,
  CircleDot,
  Clock3,
  FileText,
  Flag,
  Lightbulb,
  PencilLine,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Board } from "../../utils/boards";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import { TaskDetails, UNASSIGNED_ASSIGNEE } from "../../utils/cards";
import { Label } from "../../utils/labels";
import { AppAvatar } from "../AppAvatar";
import { BoardLogo } from "../BoardLogo";
import { BoardStatusBadge } from "../BoardStatusBadge";
import { LabelBadge } from "../LabelBadge";
import { PriorityBadge } from "../PriorityBadge";
import { TaskColumnAgeBadge } from "../TaskColumnAgeBadge";
import { TaskDueDateBadge } from "../TaskDueDateBadge";
import { getPanelEyebrowClassName } from "../typographyStyles";
import { WorkspaceSecondaryActionButton } from "../WorkspaceSecondaryActionButton";

interface TaskDetailsSummaryProps {
  board: Board;
  boardId: number;
  task: TaskDetails;
  labels: Label[];
  onEditTask?: () => void;
}

const TASK_TYPE_DISPLAY: Record<NonNullable<TaskDetails["taskType"]>, { icon: LucideIcon; label: string }> = {
  story: { icon: FileText, label: "Story" },
  task: { icon: CheckSquare, label: "Task" },
  bug: { icon: Bug, label: "Bug" },
  spike: { icon: Lightbulb, label: "Spike" },
};

function FactRow({
  icon: Icon,
  label,
  children,
  dividerClassName,
  labelClassName,
  textClassName,
  mutedIconClassName,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  dividerClassName: string;
  labelClassName: string;
  textClassName: string;
  mutedIconClassName: string;
}) {
  return (
    <div className={`grid grid-cols-[1.25rem_1fr] gap-3 border-b py-4 last:border-b-0 ${dividerClassName}`}>
      <Icon className={`mt-0.5 h-4 w-4 ${mutedIconClassName}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className={labelClassName}>{label}</p>
        <div className={`mt-2 min-w-0 text-sm leading-6 ${textClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function TaskDetailsSummary({ board, boardId, task, labels, onEditTask }: TaskDetailsSummaryProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const panelEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);
  const dividerClassName = isDarkMode ? "border-white/10" : "border-slate-200/80";
  const assignee = task.assigneeUserId ? task.assignee : UNASSIGNED_ASSIGNEE;
  const isAssigned = Boolean(task.assigneeUserId);
  const taskLabels = labels.filter((label) => task.labelIds.includes(label.id));
  const taskType = task.taskType ? TASK_TYPE_DISPLAY[task.taskType] : null;
  const factRowProps = {
    dividerClassName,
    labelClassName: panelEyebrowClassName,
    textClassName: currentTheme.textSecondary,
    mutedIconClassName: currentTheme.textMuted,
  };

  return (
    <section className={`overflow-hidden rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} shadow-[0_24px_70px_-46px_rgba(15,23,42,0.48)]`}>
      <div className={`border-b px-5 py-5 sm:px-6 ${dividerClassName}`}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={Number.isFinite(boardId) ? `/app/${boardId}` : "/app"}
                aria-label={`Back to ${board.name}`}
                className={`group inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r px-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to board
              </Link>
              {onEditTask ? (
                <WorkspaceSecondaryActionButton
                  type="button"
                  onClick={onEditTask}
                  className="h-10 px-4 py-0"
                  aria-label={`Edit task ${task.title}`}
                  icon={<PencilLine className="h-4 w-4" aria-hidden="true" />}
                >
                  Edit task
                </WorkspaceSecondaryActionButton>
              ) : null}
            </div>
            <div className="mt-5 flex min-w-0 items-center gap-2">
              <BoardLogo iconKey={board.logoIconKey} colorKey={board.logoColorKey} size="xs" />
              <span className={`truncate font-ui-condensed text-sm font-semibold tracking-[0.01em] ${currentTheme.textSecondary}`}>
                {board.name}
              </span>
            </div>
            <h1 className={`font-ui-condensed mt-3 break-words text-3xl font-semibold leading-tight tracking-[0.01em] sm:text-4xl ${currentTheme.text}`}>
              {task.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 self-center">
            {isAssigned && (
              <AppAvatar
                username={assignee.username || assignee.displayName}
                fullName={assignee.displayName || assignee.name}
                size={58}
                interactive={false}
                enableBlink={false}
                level={assignee.currentLevel}
              />
            )}
            <div className="min-w-0">
              <p className={`truncate text-xl font-semibold leading-tight ${currentTheme.text}`}>{assignee.displayName || assignee.name}</p>
              {isAssigned && assignee.username ? (
                <p className={`mt-1 truncate text-sm ${currentTheme.textMuted}`}>@{assignee.username}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 px-5 py-6 sm:px-6">
          <section>
            <p className={panelEyebrowClassName}>Description</p>
            <p className={`mt-3 min-h-16 whitespace-pre-wrap text-sm leading-7 ${task.description?.trim() ? currentTheme.textSecondary : currentTheme.textMuted}`}>
              {task.description?.trim() || "No description."}
            </p>
          </section>

          <section className={`mt-6 border-t pt-5 ${dividerClassName}`}>
            <p className={panelEyebrowClassName}>Labels</p>
            {taskLabels.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {taskLabels.map((label) => (
                  <LabelBadge
                    key={label.id}
                    label={label}
                    tooltip
                    className="max-w-[14rem] px-3 py-1.5 text-xs font-semibold shadow-sm"
                  />
                ))}
              </div>
            ) : (
              <p className={`mt-3 text-sm ${currentTheme.textMuted}`}>No labels.</p>
            )}
          </section>
        </div>

        <aside className={`border-t px-5 py-2 sm:px-6 lg:border-l lg:border-t-0 ${dividerClassName}`}>
          <FactRow icon={CalendarDays} label="Due date" {...factRowProps}>
            {task.dueDate ? (
              <TaskDueDateBadge dueDate={task.dueDate} className="text-sm" iconClassName="h-4 w-4" />
            ) : (
              <span className={currentTheme.textMuted}>No due date</span>
            )}
          </FactRow>
          <FactRow icon={Clock3} label="Time in column" {...factRowProps}>
            {task.statusEnteredAtUtc ? (
              <TaskColumnAgeBadge
                status={task.status}
                statusEnteredAtUtc={task.statusEnteredAtUtc}
                className="text-sm"
                iconClassName="h-4 w-4"
              />
            ) : (
              <span className={currentTheme.textMuted}>No date</span>
            )}
          </FactRow>
          <FactRow icon={Zap} label="Story points" {...factRowProps}>
            <span className={`font-due-date ${task.storyPoints != null ? currentTheme.text : currentTheme.textMuted}`}>
              {task.storyPoints ?? "Not estimated"}
            </span>
          </FactRow>
          <FactRow icon={CheckSquare} label="Task type" {...factRowProps}>
            <span>{taskType?.label ?? "No type"}</span>
          </FactRow>
          <FactRow icon={Flag} label="Priority" {...factRowProps}>
            {task.priority ? (
              <PriorityBadge priority={task.priority} isDarkMode={isDarkMode} compact />
            ) : (
              <span className={currentTheme.textMuted}>No priority</span>
            )}
          </FactRow>
          <FactRow icon={CircleDot} label="Status" {...factRowProps}>
            <BoardStatusBadge statusKey={task.status} />
          </FactRow>
        </aside>
      </div>
    </section>
  );
}
