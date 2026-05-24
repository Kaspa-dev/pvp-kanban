import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import {
  AlertTriangle,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";
import { useParams } from "react-router";

import { PlanningPokerJoinForm } from "../components/planning-poker/PlanningPokerJoinForm";
import { PlanningPokerRoomRail } from "../components/planning-poker/PlanningPokerRoomRail";
import { PlanningPokerTable } from "../components/planning-poker/PlanningPokerTable";
import { PlanningPokerVoteDeck } from "../components/planning-poker/PlanningPokerVoteDeck";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { getBoardCards, type Card } from "../utils/cards";
import type {
  PlanningPokerParticipant,
  PlanningPokerSession,
  PlanningPokerSessionTask,
} from "../utils/planningPoker";
import { applyPlanningPokerRecommendation } from "../utils/planningPoker";
import {
  activatePlanningPokerBacklogTask,
  advancePlanningPokerToNextTask,
  createPlanningPokerConnection,
  joinPlanningPokerSession,
  revealPlanningPokerVotes,
  selectPlanningPokerRecommendation,
  stopPlanningPokerConnection,
  submitPlanningPokerVote,
} from "../utils/planningPokerGuest";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";

const VOTE_DECK_VALUES = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
const pageWidthClassName = "mx-auto w-full max-w-[1850px]";

type ConnectionBannerState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

function getParticipantTokenStorageKey(joinToken: string) {
  return `planning-poker:${joinToken}:participant-token`;
}

function getGuestNameStorageKey(joinToken: string) {
  return `planning-poker:${joinToken}:guest-display-name`;
}

function readStorageValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStorageValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function removeStorageValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

function getCurrentParticipant(
  participants: PlanningPokerParticipant[],
  participantId: number | null,
) {
  if (!participantId) {
    return null;
  }

  return participants.find((participant) => participant.participantId === participantId) ?? null;
}

function normalizePlanningPokerErrorMessage(message: string) {
  return message
    .replace(/^An unexpected error occurred invoking '[^']+' on the server\.\s*/i, "")
    .replace("HubException: ", "")
    .trim();
}

interface PlanningPokerRoomIssueDialogProps {
  message: string;
  canRetry: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  onClose: () => void;
}

function PlanningPokerRoomIssueDialog({
  message,
  canRetry,
  isRetrying,
  onRetry,
  onClose,
}: PlanningPokerRoomIssueDialogProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <Dialog open={Boolean(message)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`rounded-2xl border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.text} shadow-2xl sm:max-w-md`}
      >
        <DialogHeader>
          <div
            className={`mb-1 inline-flex h-10 w-10 items-center justify-center rounded-xl ${
              isDarkMode ? "bg-amber-400/12 text-amber-200" : "bg-amber-100 text-amber-700"
            }`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className={`font-ui-condensed text-xl tracking-[0.01em] ${currentTheme.text}`}>
            Planning poker needs attention
          </DialogTitle>
          <DialogDescription className={`text-sm leading-6 ${currentTheme.textSecondary}`}>
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className={`h-10 rounded-xl border px-4 text-sm font-semibold ${currentTheme.border} ${currentTheme.textSecondary} ${
              isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white/80 hover:bg-white"
            }`}
            onClick={onClose}
          >
            Close
          </Button>
          {canRetry ? (
            <Button
              type="button"
              className={`h-10 rounded-xl bg-gradient-to-r px-4 text-sm font-semibold text-white ${currentTheme.primary}`}
              onClick={onRetry}
              disabled={isRetrying}
            >
              <RefreshCcw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
              {isRetrying ? "Retrying" : "Retry"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlanningPokerRoom() {
  const { joinToken } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const connectionRef = useRef<HubConnection | null>(null);
  const activeTaskIdRef = useRef<number | null>(null);
  const participantTokenRef = useRef("");
  const guestDisplayNameRef = useRef("");
  const isAuthenticatedRef = useRef(isAuthenticated);
  const [session, setSession] = useState<PlanningPokerSession | null>(null);
  const [participantToken, setParticipantToken] = useState("");
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [guestDisplayName, setGuestDisplayName] = useState("");
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [joinError, setJoinError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [backlogTasks, setBacklogTasks] = useState<Card[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSelectingRecommendation, setIsSelectingRecommendation] = useState(false);
  const [isApplyingRecommendation, setIsApplyingRecommendation] = useState(false);
  const [isAdvancingTask, setIsAdvancingTask] = useState(false);
  const [isTaskSelecting, setIsTaskSelecting] = useState(false);
  const [deletedSessionMessage, setDeletedSessionMessage] = useState("");
  const [connectionBannerState, setConnectionBannerState] =
    useState<ConnectionBannerState>("idle");
  const [hasAttemptedAutoJoin, setHasAttemptedAutoJoin] = useState(false);

  const normalizedJoinToken = (joinToken ?? "").trim().toLowerCase();
  const participantStorageKey = useMemo(
    () => (normalizedJoinToken ? getParticipantTokenStorageKey(normalizedJoinToken) : ""),
    [normalizedJoinToken],
  );
  const guestNameStorageKey = useMemo(
    () => (normalizedJoinToken ? getGuestNameStorageKey(normalizedJoinToken) : ""),
    [normalizedJoinToken],
  );

  const authenticatedLabel =
    user?.displayName?.trim() || user?.username?.trim() || "your account";
  const currentParticipant = useMemo(
    () => getCurrentParticipant(session?.participants ?? [], participantId),
    [participantId, session?.participants],
  );
  const isCurrentParticipantHost = Boolean(currentParticipant?.isHost);
  const votedCount =
    session?.participants.filter((participant) => participant.hasVoted).length ?? 0;
  const canJoinWithoutForm = isAuthenticated || participantToken.length > 0;
  const activeTask: PlanningPokerSessionTask | null =
    session && session.activeTask.sessionTaskId > 0 ? session.activeTask : null;
  const sessionBoardId = session?.boardId ?? null;
  const shouldShowReconnectControl =
    Boolean(normalizedJoinToken) &&
    connectionBannerState !== "connected" &&
    !isJoining &&
    !deletedSessionMessage;

  useEffect(() => {
    participantTokenRef.current = participantToken;
  }, [participantToken]);

  useEffect(() => {
    guestDisplayNameRef.current = guestDisplayName;
  }, [guestDisplayName]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!sessionBoardId || !isAuthenticated) {
      setBacklogTasks([]);
      return;
    }

    const boardId = sessionBoardId;
    let isMounted = true;

    async function loadBacklogTasks() {
      try {
        const cards = await getBoardCards(boardId);

        if (!isMounted) {
          return;
        }

        setBacklogTasks(cards.backlog);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRoomError(
          normalizePlanningPokerErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load backlog tasks for this planning poker room.",
          ),
        );
      }
    }

    void loadBacklogTasks();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, sessionBoardId]);

  useEffect(() => {
    if (!participantStorageKey || !guestNameStorageKey) {
      return;
    }

    setParticipantToken(readStorageValue(participantStorageKey));
    setGuestDisplayName(readStorageValue(guestNameStorageKey));
  }, [guestNameStorageKey, participantStorageKey]);

  useEffect(() => {
    if (!normalizedJoinToken) {
      return;
    }

    const connection = createPlanningPokerConnection({
      onSessionUpdated: (nextSession) => {
        setSession(nextSession);
        setRoomError("");
        setJoinError("");
        setConnectionBannerState("connected");
      },
      onVotingUpdated: (nextSession) => {
        setSession(nextSession);
      },
      onSessionDeleted: (event) => {
        setDeletedSessionMessage(
          event.message || "This planning poker session was deleted by the host.",
        );
        setSession(null);
        setParticipantId(null);
        setParticipantToken("");
        removeStorageValue(participantStorageKey);
        removeStorageValue(guestNameStorageKey);
        setJoinError("");
        setRoomError("");
        setConnectionBannerState("disconnected");
        void stopPlanningPokerConnection(connection);
      },
      onClosed: () => {
        setConnectionBannerState("disconnected");
      },
    });

    connection.onreconnecting(() => {
      setConnectionBannerState("reconnecting");
      setRoomError("");
    });

    connection.onreconnected(async () => {
      setConnectionBannerState("connecting");
      setRoomError("");

      try {
        const response = await joinPlanningPokerSession(
          connection,
          normalizedJoinToken,
          participantTokenRef.current || null,
          isAuthenticatedRef.current ? null : guestDisplayNameRef.current.trim() || null,
        );

        setSession(response.session);
        setParticipantToken(response.participantToken);
        setParticipantId(response.participantId);
        writeStorageValue(participantStorageKey, response.participantToken);

        if (!isAuthenticatedRef.current && guestDisplayNameRef.current.trim()) {
          writeStorageValue(guestNameStorageKey, guestDisplayNameRef.current.trim());
        }

        setJoinError("");
        setRoomError("");
        setConnectionBannerState("connected");
      } catch (error) {
        const message = normalizePlanningPokerErrorMessage(
          error instanceof Error ? error.message : "Unable to rejoin the planning poker room.",
        );
        const shouldResetParticipantIdentity =
          participantTokenRef.current.length > 0 && /participant|token/i.test(message);

        if (shouldResetParticipantIdentity) {
          setParticipantToken("");
          setParticipantId(null);
          removeStorageValue(participantStorageKey);
        }

        setJoinError(message);
        setRoomError(message);
        setConnectionBannerState("disconnected");
        setSession(null);
      }
    });

    connectionRef.current = connection;

    return () => {
      connectionRef.current = null;
      void stopPlanningPokerConnection(connection);
    };
  }, [normalizedJoinToken, participantStorageKey, guestNameStorageKey]);

  useEffect(() => {
    if (!session?.isRevealed) {
      return;
    }

    setSelectedVote(null);
  }, [session?.isRevealed]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyFeedback(""), 2200);

    return () => window.clearTimeout(timeoutId);
  }, [copyFeedback]);

  useEffect(() => {
    const nextActiveTaskId = activeTask?.sessionTaskId ?? null;
    if (activeTaskIdRef.current === nextActiveTaskId) {
      return;
    }

    activeTaskIdRef.current = nextActiveTaskId;
    setSelectedVote(null);
  }, [activeTask]);

  const handleJoin = useCallback(
    async (displayNameOverride?: string) => {
      if (!normalizedJoinToken) {
        setJoinError("This planning poker link is missing its join token.");
        return;
      }

      const connection = connectionRef.current;
      if (!connection) {
        setJoinError("The room connection is not ready yet. Please try again.");
        return;
      }

      const attemptedGuestName = displayNameOverride ?? guestDisplayName;
      if (!isAuthenticated && !participantToken && !attemptedGuestName.trim()) {
        setJoinError("Display name is required to join as a guest.");
        return;
      }

      setIsJoining(true);
      setJoinError("");
      setRoomError("");
      setConnectionBannerState("connecting");

      try {
        const response = await joinPlanningPokerSession(
          connection,
          normalizedJoinToken,
          participantToken || null,
          isAuthenticated ? null : attemptedGuestName.trim(),
        );

        setSession(response.session);
        setParticipantToken(response.participantToken);
        setParticipantId(response.participantId);
        writeStorageValue(participantStorageKey, response.participantToken);

        if (!isAuthenticated) {
          const nextGuestName = attemptedGuestName.trim();
          setGuestDisplayName(nextGuestName);
          writeStorageValue(guestNameStorageKey, nextGuestName);
        }

        setConnectionBannerState("connected");
      } catch (error) {
        const message = normalizePlanningPokerErrorMessage(
          error instanceof Error ? error.message : "Unable to join the planning poker room.",
        );
        setJoinError(message);
        setRoomError(message);
        setConnectionBannerState(
          connection.state === HubConnectionState.Connected ? "connected" : "disconnected",
        );

        if (participantToken && /participant|token/i.test(message)) {
          setParticipantToken("");
          setParticipantId(null);
          removeStorageValue(participantStorageKey);
        }
      } finally {
        setIsJoining(false);
        setHasAttemptedAutoJoin(true);
      }
    },
    [
      normalizedJoinToken,
      guestDisplayName,
      isAuthenticated,
      participantToken,
      participantStorageKey,
      guestNameStorageKey,
    ],
  );

  useEffect(() => {
    if (hasAttemptedAutoJoin || !normalizedJoinToken || !canJoinWithoutForm) {
      return;
    }

    void handleJoin();
  }, [canJoinWithoutForm, handleJoin, hasAttemptedAutoJoin, normalizedJoinToken]);

  const handleVote = async (value: number) => {
    const connection = connectionRef.current;
    if (!connection || !session || !normalizedJoinToken) {
      return;
    }

    setIsVoteSubmitting(true);
    setRoomError("");

    try {
      const nextSession = await submitPlanningPokerVote(
        connection,
        normalizedJoinToken,
        value,
        participantToken || null,
      );

      setSelectedVote(value);
      setSession(nextSession);
    } catch (error) {
      setRoomError(
        normalizePlanningPokerErrorMessage(
          error instanceof Error ? error.message : "Unable to submit your vote.",
        ),
      );
    } finally {
      setIsVoteSubmitting(false);
    }
  };

  const handleReveal = async () => {
    const connection = connectionRef.current;
    if (!connection || !normalizedJoinToken) {
      return;
    }

    setIsRevealing(true);
    setRoomError("");

    try {
      const nextSession = await revealPlanningPokerVotes(
        connection,
        normalizedJoinToken,
        participantToken || null,
      );

      setSession(nextSession);
      setSelectedVote(null);
    } catch (error) {
      setRoomError(
        normalizePlanningPokerErrorMessage(
          error instanceof Error ? error.message : "Unable to reveal the current round.",
        ),
      );
    } finally {
      setIsRevealing(false);
    }
  };

  const handleSelectRecommendation = async (storyPoints: number) => {
    const connection = connectionRef.current;
    if (!connection || !normalizedJoinToken) {
      return;
    }

    setIsSelectingRecommendation(true);
    setRoomError("");

    try {
      const nextSession = await selectPlanningPokerRecommendation(
        connection,
        normalizedJoinToken,
        storyPoints,
        participantToken || null,
      );

      setSession(nextSession);
    } catch (error) {
      setRoomError(
        normalizePlanningPokerErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to select the planning poker recommendation.",
        ),
      );
    } finally {
      setIsSelectingRecommendation(false);
    }
  };

  const handleApplyRecommendation = async (sessionTaskId: number) => {
    if (!session) {
      return;
    }

    setIsApplyingRecommendation(true);
    setRoomError("");

    try {
      const updatedTask = await applyPlanningPokerRecommendation(
        session.boardId,
        sessionTaskId,
      );
      const appliedStoryPoints = updatedTask.storyPoints ?? null;

      if (appliedStoryPoints !== null) {
        setBacklogTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === updatedTask.id
              ? {
                  ...task,
                  storyPoints: appliedStoryPoints,
                }
              : task,
          ),
        );
      }

      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession;
        }

        const applyToSessionTask = (sessionTask: PlanningPokerSessionTask) =>
          sessionTask.sessionTaskId === sessionTaskId
            ? {
                ...sessionTask,
                appliedStoryPoints,
              }
            : sessionTask;

        return {
          ...currentSession,
          activeTask: applyToSessionTask(currentSession.activeTask),
          queue: currentSession.queue.map(applyToSessionTask),
        };
      });
    } catch (error) {
      setRoomError(
        normalizePlanningPokerErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to apply the planning poker recommendation.",
        ),
      );
    } finally {
      setIsApplyingRecommendation(false);
    }
  };

  const handleAdvanceToNextTask = async () => {
    const connection = connectionRef.current;
    if (!connection || !normalizedJoinToken) {
      return;
    }

    setIsAdvancingTask(true);
    setRoomError("");

    try {
      const nextSession = await advancePlanningPokerToNextTask(
        connection,
        normalizedJoinToken,
        participantToken || null,
      );

      setSession(nextSession);
      setSelectedVote(null);
    } catch (error) {
      setRoomError(
        normalizePlanningPokerErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to move to the next planning poker task.",
        ),
      );
    } finally {
      setIsAdvancingTask(false);
    }
  };

  const handleActivateBacklogTask = async (taskId: number) => {
    const connection = connectionRef.current;
    if (!connection || !normalizedJoinToken) {
      return;
    }

    setIsTaskSelecting(true);
    setRoomError("");

    try {
      const nextSession = await activatePlanningPokerBacklogTask(
        connection,
        normalizedJoinToken,
        taskId,
        participantToken || null,
      );

      setSession(nextSession);
      setSelectedVote(null);
    } catch (error) {
      setRoomError(
        normalizePlanningPokerErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to switch to that backlog task.",
        ),
      );
    } finally {
      setIsTaskSelecting(false);
    }
  };

  const handleCopyJoinUrl = async () => {
    if (!session?.joinUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(session.joinUrl);
      setCopyFeedback("Copied");
    } catch {
      setCopyFeedback("Copy failed");
    }
  };

  return (
    <main className={`${workspaceSurface.pageClassName} min-h-dvh px-4 py-4 ${currentTheme.text} sm:px-6 lg:px-8`}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <div className="relative z-10">
        <div className={`${pageWidthClassName} flex min-h-[calc(100dvh-2rem)] flex-col gap-4`}>
          {!normalizedJoinToken ? (
            <div
              className={`rounded-2xl border px-4 py-3 ${
                isDarkMode
                  ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold">Missing room link</h2>
                  <p className="mt-1 text-sm leading-6">
                    This planning poker link is not valid.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {normalizedJoinToken && !session && !deletedSessionMessage ? (
            <div className="grid flex-1 place-items-center py-8">
              <div className="w-full max-w-xl">
                <PlanningPokerJoinForm
                  displayName={guestDisplayName}
                  isAuthenticated={isAuthenticated}
                  authenticatedLabel={authenticatedLabel}
                  isSubmitting={isJoining}
                  errorMessage={joinError}
                  onDisplayNameChange={setGuestDisplayName}
                  onSubmit={() => handleJoin()}
                />
              </div>
            </div>
          ) : null}

          {normalizedJoinToken && !session && deletedSessionMessage ? (
            <div
              className={`rounded-2xl border px-4 py-3 ${
                isDarkMode
                  ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold">Room closed</h2>
                  <p className="mt-1 text-sm leading-6">{deletedSessionMessage}</p>
                </div>
              </div>
            </div>
          ) : null}

          {normalizedJoinToken && isJoining && !session ? (
            <section
              className={`mx-auto w-full max-w-xl rounded-2xl border px-4 py-4 ${
                isDarkMode
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-slate-200 bg-white/70"
              }`}
              aria-label="Joining planning poker room"
            >
              <div className={`mb-4 flex items-center gap-2 text-sm font-medium ${currentTheme.text}`}>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Joining
              </div>
              <div className="space-y-3">
                <Skeleton className="h-10 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            </section>
          ) : null}

          {session ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
                <section className="flex min-h-0 flex-col gap-4">
                  <PlanningPokerTable
                    activeTask={activeTask}
                    participants={session.participants}
                    currentParticipantId={participantId}
                    votedCount={votedCount}
                    isRevealed={session.isRevealed}
                    isHost={isCurrentParticipantHost}
                    isRevealing={isRevealing}
                    onReveal={handleReveal}
                  />

                  <PlanningPokerVoteDeck
                    activeTask={activeTask}
                    nextTask={session.queue[0] ?? null}
                    cardValues={VOTE_DECK_VALUES}
                    selectedValue={selectedVote}
                    isRevealed={session.isRevealed}
                    isHost={isCurrentParticipantHost}
                    isSubmitting={isVoteSubmitting}
                    isSelectingRecommendation={isSelectingRecommendation}
                    isApplyingRecommendation={isApplyingRecommendation}
                    isAdvancingTask={isAdvancingTask}
                    disabled={!activeTask || isRevealing || session.isRevealed}
                    onVote={handleVote}
                    onSelectRecommendation={handleSelectRecommendation}
                    onApplyRecommendation={handleApplyRecommendation}
                    onAdvanceToNextTask={handleAdvanceToNextTask}
                  />
                </section>

                <PlanningPokerRoomRail
                  session={session}
                  activeTask={activeTask}
                  backlogTasks={backlogTasks}
                  currentParticipantId={participantId}
                  isHost={isCurrentParticipantHost}
                  isSelectingTask={isTaskSelecting}
                  copyFeedback={copyFeedback}
                  onCopyLink={handleCopyJoinUrl}
                  onSelectTask={handleActivateBacklogTask}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <PlanningPokerRoomIssueDialog
        message={roomError}
        canRetry={shouldShowReconnectControl}
        isRetrying={isJoining}
        onRetry={() => void handleJoin()}
        onClose={() => setRoomError("")}
      />

    </main>
  );
}
