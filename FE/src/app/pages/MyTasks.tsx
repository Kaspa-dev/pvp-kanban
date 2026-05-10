import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderKanban,
  RotateCw,
} from "lucide-react";
import { BoardLogo } from "../components/BoardLogo";
import { PriorityBadge } from "../components/PriorityBadge";
import { SettingsModal } from "../components/SettingsModal";
import { Toolbar } from "../components/Toolbar";
import { getPanelEyebrowClassName } from "../components/typographyStyles";
import { Skeleton } from "../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getMyTasks, MyTask, MyTasksScope } from "../utils/cards";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

const TASK_SCOPE_OPTIONS: Array<{
  value: MyTasksScope;
  label: string;
  tooltip: string;
}> = [
  {
    value: "active",
    label: "Active",
    tooltip: "Show assigned tasks that still need attention",
  },
  {
    value: "all",
    label: "All",
    tooltip: "Show every assigned task, including completed work",
  },
];

const STATUS_LABELS: Record<MyTask["status"], string> = {
  todo: "To do",
  inProgress: "In progress",
  inReview: "In review",
  done: "Done",
  backlog: "Backlog",
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

function TaskRowsSkeleton({ rowCount = 6 }: { rowCount?: number }) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, index) => (
        <TableRow key={index} aria-hidden="true">
          <TableCell className="py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-3 w-72 rounded-md" />
            </div>
          </TableCell>
          <TableCell className="py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-4 w-20 rounded-md" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-8 w-24 rounded-full" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-4 w-28 rounded-md" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-4 w-10 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function MyTasks() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const panelEyebrowClassName = getPanelEyebrowClassName(currentTheme.textMuted);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const tableDividerClassName = isDarkMode ? "border-white/12" : "border-slate-200";
  const tableHeadClassName = `font-ui-condensed px-4 py-3 text-xs font-semibold uppercase tracking-[0.01em] ${currentTheme.textMuted}`;

  const [scope, setScope] = useState<MyTasksScope>("active");
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadTasks = async () => {
      if (!user) {
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        const nextTasks = await getMyTasks(scope);

        if (!isActive) {
          return;
        }

        setTasks(nextTasks);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Unable to load your tasks right now.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      isActive = false;
    };
  }, [reloadVersion, scope, user]);

  const summary = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((task) => task.status === "done").length,
    dueSoon: tasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }

      const dueDate = new Date(`${task.dueDate}T00:00:00`);
      if (Number.isNaN(dueDate.getTime())) {
        return false;
      }

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffInDays = Math.round((dueDate.getTime() - todayStart.getTime()) / 86400000);
      return diffInDays >= 0 && diffInDays <= 7;
    }).length,
  }), [tasks]);

  const emptyStateTitle =
    scope === "active"
      ? "No active tasks assigned to you right now"
      : "You do not have any assigned tasks yet";
  const emptyStateDescription =
    scope === "active"
      ? "Completed work is hidden in Active scope. Switch to All if you want the full history."
      : "When a board assigns work to you, it will show up here with a quick path back to that board.";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className={workspaceSurface.pageClassName}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <Toolbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onProfileClick={() => navigate("/app/profile")}
        userProfile={{
          username: user.username,
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          subtitle: user.email,
        }}
      />

      <main className="relative z-10 px-6 py-10">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          <section className={`rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} px-6 py-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)]`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary} shadow-md`}>
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className={panelEyebrowClassName}>
                      Personal workspace
                    </p>
                    <h1 className={`font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>My Tasks</h1>
                  </div>
                </div>
                <p className={`mt-4 max-w-3xl text-sm leading-6 ${currentTheme.textMuted}`}>
                  Review the tasks assigned to you across boards and jump back into the right workspace when it is time to act.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/app")}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.04]" : "bg-white/80"} transition-colors hover:${currentTheme.borderHover}`}
                >
                  <FolderKanban className="h-4 w-4" />
                  Projects
                </button>
              </div>
            </div>

            <div className={`mt-5 flex flex-wrap items-center gap-3 border-t pt-5 ${currentTheme.border}`}>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.textSecondary}`}>
                <ClipboardList className="h-3.5 w-3.5" />
                <span><span className="font-due-date">{summary.total}</span> {summary.total === 1 ? "task" : "tasks"} in view</span>
              </span>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.textSecondary}`}>
                <Clock3 className="h-3.5 w-3.5" />
                <span><span className="font-due-date">{summary.dueSoon}</span> due within <span className="font-due-date">7</span> days</span>
              </span>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${currentTheme.border} ${currentTheme.bgSecondary} ${currentTheme.textSecondary}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span><span className="font-due-date">{summary.completed}</span> completed</span>
              </span>
            </div>
          </section>

          <section className="overflow-hidden">
            <div className={`border-b px-2 pt-2 ${tableDividerClassName}`}>
              <div
                id="my-tasks-scope"
                role="tablist"
                aria-label="Filter my tasks by scope"
                className="flex flex-wrap items-end gap-6"
              >
                {TASK_SCOPE_OPTIONS.map((option) => {
                  const isActiveTab = scope === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={isActiveTab}
                      onClick={() => setScope(option.value)}
                      title={option.tooltip}
                      className={`font-ui-condensed inline-flex items-center justify-center border-b-2 px-1 py-3 text-sm font-semibold tracking-[0.01em] transition-colors ${
                        isActiveTab
                          ? `${currentTheme.primaryText} ${currentTheme.primaryBorder}`
                          : `border-transparent ${currentTheme.textMuted} hover:${currentTheme.textSecondary}`
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loadError ? (
              <div className="px-6 py-10">
                <div className="flex flex-col items-start gap-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-5 text-red-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    Unable to load your tasks
                  </div>
                  <p className="text-sm leading-6">{loadError}</p>
                  <button
                    type="button"
                    onClick={() => setReloadVersion((current) => current + 1)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    <RotateCw className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="px-0 py-4">
                <Table aria-label="Loading your assigned tasks">
                  <TableHeader>
                    <TableRow className={`hover:bg-transparent ${tableDividerClassName}`}>
                      <TableHead className={tableHeadClassName}>Task</TableHead>
                      <TableHead className={tableHeadClassName}>Board</TableHead>
                      <TableHead className={tableHeadClassName}>Status</TableHead>
                      <TableHead className={tableHeadClassName}>Priority</TableHead>
                      <TableHead className={tableHeadClassName}>Due date</TableHead>
                      <TableHead className={tableHeadClassName}>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TaskRowsSkeleton />
                  </TableBody>
                </Table>
              </div>
            ) : tasks.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <ClipboardList className={`mx-auto h-12 w-12 ${currentTheme.textMuted}`} />
                <h2 className={`font-ui-condensed mt-4 text-xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>{emptyStateTitle}</h2>
                <p className={`mx-auto mt-2 max-w-2xl text-sm leading-6 ${currentTheme.textMuted}`}>
                  {emptyStateDescription}
                </p>
              </div>
            ) : (
              <div className="px-0 py-4">
                <Table aria-label="Tasks assigned to you">
                  <TableHeader>
                    <TableRow className={`hover:bg-transparent ${tableDividerClassName}`}>
                      <TableHead className={tableHeadClassName}>Task</TableHead>
                      <TableHead className={tableHeadClassName}>Board</TableHead>
                      <TableHead className={tableHeadClassName}>Status</TableHead>
                      <TableHead className={tableHeadClassName}>Priority</TableHead>
                      <TableHead className={tableHeadClassName}>Due date</TableHead>
                      <TableHead className={tableHeadClassName}>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow
                        key={`${task.boardId}-${task.id}`}
                        className={`${tableDividerClassName} ${isDarkMode ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80"}`}
                      >
                        <TableCell className="px-4 py-4 align-top">
                          <div className="min-w-0">
                            <Link
                              to={`/app/${task.boardId}`}
                              className={`inline-flex items-center gap-2 text-sm font-semibold ${currentTheme.text} underline-offset-4 hover:underline focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                            >
                              <span className="truncate">{task.title}</span>
                              <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${currentTheme.textMuted}`} />
                            </Link>
                            <p className={`mt-1 line-clamp-2 max-w-xl text-sm leading-6 ${currentTheme.textMuted}`}>
                              {task.description?.trim() ? task.description : "No description provided."}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          <Link
                            to={`/app/${task.boardId}`}
                            className={`inline-flex items-center gap-3 rounded-xl px-2 py-1 -ml-2 text-sm ${currentTheme.textSecondary} transition-colors hover:${currentTheme.primaryText} focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                          >
                            <BoardLogo
                              iconKey={task.boardLogoIconKey}
                              colorKey={task.boardLogoColorKey}
                              size="sm"
                            />
                            <span className="truncate">{task.boardName}</span>
                          </Link>
                        </TableCell>
                        <TableCell className={`px-4 py-4 align-top text-sm ${currentTheme.textSecondary}`}>
                          {STATUS_LABELS[task.status]}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          {task.priority ? (
                            <PriorityBadge priority={task.priority} />
                          ) : (
                            <span className={`text-sm ${currentTheme.textMuted}`}>None</span>
                          )}
                        </TableCell>
                        <TableCell className={`font-due-date px-4 py-4 align-top text-sm ${currentTheme.textSecondary}`}>
                          {formatDueDate(task.dueDate)}
                        </TableCell>
                        <TableCell className={`font-due-date px-4 py-4 align-top text-sm ${currentTheme.textSecondary}`}>
                          {task.storyPoints ?? "Not set"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenProfile={() => navigate("/app/profile")}
        onOpenMyTasks={() => navigate("/app/my-tasks")}
      />
    </div>
  );
}
