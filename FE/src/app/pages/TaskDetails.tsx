import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertCircle, RotateCw } from "lucide-react";
import { SettingsModal } from "../components/SettingsModal";
import { Toolbar } from "../components/Toolbar";
import { TaskCommentThread } from "../components/task-details/TaskCommentThread";
import { TaskDetailsSummary } from "../components/task-details/TaskDetailsSummary";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getBoard, Board as BoardType } from "../utils/boards";
import { getBoardTaskDetails, TaskDetails } from "../utils/cards";
import { getBoardLabels, Label } from "../utils/labels";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

type ThemeColors = ReturnType<typeof getThemeColors>;

function TaskDetailsLoadingState({
  currentTheme,
}: {
  currentTheme: ThemeColors;
}) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading task">
      <section className={`overflow-hidden rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} shadow-[0_24px_70px_-46px_rgba(15,23,42,0.48)]`}>
        <div className={`border-b px-5 py-5 sm:px-6 ${currentTheme.border}`}>
          <Skeleton className="h-9 w-32 rounded-xl" />
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-3 w-44 rounded-full" />
                <Skeleton className="h-10 w-full max-w-3xl rounded-xl" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-28 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-2xl lg:w-64" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="px-5 py-6 sm:px-6">
            <Skeleton className="h-3 w-28 rounded-full" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-3/5 rounded-md" />
            </div>
            <div className={`mt-6 border-t pt-5 ${currentTheme.border}`}>
              <Skeleton className="h-3 w-20 rounded-full" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            </div>
          </div>
          <div className={`border-t px-5 py-4 sm:px-6 lg:border-l lg:border-t-0 ${currentTheme.border}`}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={`border-b py-4 last:border-b-0 ${currentTheme.border}`}>
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="mt-3 h-5 w-36 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} px-5 py-6 sm:px-6`}>
        <Skeleton className="h-7 w-32 rounded-xl" />
        <Skeleton className="mt-5 h-28 w-full rounded-xl" />
        <div className={`mt-6 border-t pt-5 ${currentTheme.border}`}>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </section>
    </div>
  );
}

export function TaskDetailsPage() {
  const navigate = useNavigate();
  const { boardId, taskId } = useParams<{ boardId: string; taskId: string }>();
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const numericBoardId = boardId ? Number(boardId) : NaN;
  const numericTaskId = taskId ? Number(taskId) : NaN;

  useEffect(() => {
    let isActive = true;

    const loadTaskDetails = async () => {
      if (!user) {
        return;
      }

      if (!Number.isFinite(numericBoardId) || !Number.isFinite(numericTaskId)) {
        setLoadError("This task link is invalid.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");

        const [boardResult, boardLabels, taskDetails] = await Promise.all([
          getBoard(numericBoardId),
          getBoardLabels(numericBoardId),
          getBoardTaskDetails(numericBoardId, numericTaskId),
        ]);

        if (!isActive) {
          return;
        }

        if (boardResult.status !== "success") {
          if (boardResult.status === "forbidden") {
            setLoadError("You do not have access to this board.");
          } else if (boardResult.status === "notFound") {
            setLoadError("This board could not be found.");
          } else {
            setLoadError(boardResult.error);
          }

          setBoard(null);
          setTask(null);
          setLabels([]);
          return;
        }

        setBoard(boardResult.board);
        setLabels(boardLabels);
        setTask(taskDetails);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Unable to load the task right now.");
        setBoard(null);
        setTask(null);
        setLabels([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTaskDetails();

    return () => {
      isActive = false;
    };
  }, [numericBoardId, numericTaskId, reloadVersion, user]);

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

      <main className="relative z-10 px-5 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1850px] flex-col gap-5">
          {isLoading ? (
            <TaskDetailsLoadingState currentTheme={currentTheme} />
          ) : loadError || !task || !board ? (
            <section
              className={`rounded-[2rem] border px-6 py-8 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] ${
                isDarkMode
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h2 className={`font-ui-condensed text-xl font-semibold tracking-[0.01em] ${isDarkMode ? "text-rose-50" : "text-rose-900"}`}>Unable to load task</h2>
                  <p className="mt-2 text-sm leading-6">{loadError || "The task could not be loaded."}</p>
                  <button
                    type="button"
                    onClick={() => setReloadVersion((current) => current + 1)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <RotateCw className="h-4 w-4" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <TaskDetailsSummary
                board={board}
                boardId={numericBoardId}
                task={task}
                labels={labels}
              />

              <TaskCommentThread
                boardId={numericBoardId}
                taskId={numericTaskId}
                comments={task.comments}
                onCommentsChange={(comments) => {
                  setTask((currentTask) => currentTask ? { ...currentTask, comments } : currentTask);
                }}
              />
            </>
          )}
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
