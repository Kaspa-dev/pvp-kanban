import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { SettingsModal } from "../components/SettingsModal";
import { Toolbar } from "../components/Toolbar";
import { TaskCommentThread } from "../components/task-details/TaskCommentThread";
import { TaskDetailsSummary } from "../components/task-details/TaskDetailsSummary";
import { useAuth } from "../contexts/AuthContext";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { getBoard, Board as BoardType } from "../utils/boards";
import { getBoardTaskDetails, TaskDetails } from "../utils/cards";
import { getBoardLabels, Label } from "../utils/labels";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

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

      <main className="relative z-10 px-6 py-10">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
          {isLoading ? (
            <section className={`rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} px-6 py-12 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)]`}>
              <div className={`flex items-center justify-center gap-3 ${currentTheme.textMuted}`}>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>Loading task details...</span>
              </div>
            </section>
          ) : loadError || !task || !board ? (
            <section className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-8 text-red-800 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold">Unable to load this task</h2>
                  <p className="mt-2 text-sm leading-6">{loadError || "The task could not be loaded."}</p>
                  <button
                    type="button"
                    onClick={() => setReloadVersion((current) => current + 1)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
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
