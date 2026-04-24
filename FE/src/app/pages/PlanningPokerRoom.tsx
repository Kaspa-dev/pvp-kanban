import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import {
  AlertTriangle,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";
import { useParams } from "react-router";

import { PlanningPokerJoinForm } from "../components/planning-poker/PlanningPokerJoinForm";
import { PlanningPokerBacklogPickerDialog } from "../components/planning-poker/PlanningPokerBacklogPickerDialog";
import { PlanningPokerTaskQueue } from "../components/planning-poker/PlanningPokerTaskQueue";
import { PlanningPokerVoteDeck } from "../components/planning-poker/PlanningPokerVoteDeck";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import type {
  PlanningPokerParticipant,
  PlanningPokerSession,
  PlanningPokerSessionTask,
} from "../utils/planningPoker";
import { applyPlanningPokerRecommendation } from "../utils/planningPoker";
import { getBoardCards, type Card } from "../utils/cards";
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

const VOTE_DECK_VALUES = [0, 1, 2, 3, 5, 8, 13, 21];
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

function getConnectionBannerLabel(value: ConnectionBannerState) {
  switch (value) {
    case "connecting":
      return "Connecting to the live room...";
    case "connected":
      return "Live updates connected.";
    case "reconnecting":
      return "Connection lost. Trying to reconnect and rejoin the room...";
    case "disconnected":
      return "Disconnected from the room. Rejoin to keep voting.";
    default:
      return "Preparing room connection...";
  }
}

function normalizePlanningPokerErrorMessage(message: string) {
  return message
    .replace("An unexpected error occurred invoking 'JoinSession' on the server. ", "")
    .replace("HubException: ", "")
    .trim();
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
  const [isJoining, setIsJoining] = useState(false);
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSelectingRecommendation, setIsSelectingRecommendation] = useState(false);
  const [isApplyingRecommendation, setIsApplyingRecommendation] = useState(false);
  const [isAdvancingTask, setIsAdvancingTask] = useState(false);
  const [isBacklogPickerOpen, setIsBacklogPickerOpen] = useState(false);
  const [isBacklogPickerLoading, setIsBacklogPickerLoading] = useState(false);
  const [isBacklogTaskSubmitting, setIsBacklogTaskSubmitting] = useState(false);
  const [backlogTasks, setBacklogTasks] = useState<Card[]>([]);
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
      setRoomError("The room connection dropped. Reconnecting now.");
    });

    connection.onreconnected(async () => {
      setConnectionBannerState("connecting");
      setRoomError("Connection restored. Rejoining the planning poker room.");

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

  const loadBacklogTasks = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsBacklogPickerLoading(true);

    try {
      const cards = await getBoardCards(session.boardId);
      setBacklogTasks(
        cards.backlog.filter((task) => task.storyPoints === null || task.storyPoints === undefined),
      );
    } finally {
      setIsBacklogPickerLoading(false);
    }
  }, [session]);

  const handleOpenBacklogPicker = () => {
    if (!session) {
      return;
    }

    setIsBacklogPickerOpen(true);
    void loadBacklogTasks();
  };

  const handleActivateBacklogTask = async (taskId: number) => {
    const connection = connectionRef.current;
    if (!connection || !normalizedJoinToken) {
      return;
    }

    setIsBacklogTaskSubmitting(true);
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
      setIsBacklogPickerOpen(false);
    } catch (error) {
      setRoomError(
        normalizePlanningPokerErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to switch to that backlog task.",
        ),
      );
    } finally {
      setIsBacklogTaskSubmitting(false);
    }
  };

  return (
    <main className={`${workspaceSurface.pageClassName} px-4 py-4 ${currentTheme.text} sm:px-6 lg:px-8`}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <div className="relative z-10">
        <div className={`${pageWidthClassName} flex flex-col gap-4`}>
          <section
            className={`border-b ${currentTheme.border} pb-3`}
            aria-label="Planning poker room status"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className={`text-3xl font-semibold tracking-tight ${currentTheme.text}`}>
                  Planning poker
                </h1>
                {normalizedJoinToken ? (
                  <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>
                    Token {normalizedJoinToken}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={currentTheme.textMuted}>
                  {getConnectionBannerLabel(connectionBannerState)}
                </span>
                {session ? (
                  <span className={currentTheme.textMuted}>
                    {votedCount}/{session.participants.length} voted
                  </span>
                ) : null}
                {shouldShowReconnectControl ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 px-3 ${currentTheme.border} ${
                      isDarkMode
                        ? "bg-white/[0.03] text-zinc-100 hover:bg-white/[0.06]"
                        : "bg-white/80 text-slate-700 hover:bg-white"
                    }`}
                    onClick={() => void handleJoin()}
                    disabled={isJoining}
                  >
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    {session ? "Rejoin room" : "Retry connection"}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

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
                  <h2 className="text-sm font-semibold">Missing join token</h2>
                  <p className="mt-1 text-sm leading-6">
                    This link does not include a valid planning poker room token.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {normalizedJoinToken && !session && !deletedSessionMessage ? (
            <div className="max-w-2xl">
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
                  <h2 className="text-sm font-semibold">Session deleted</h2>
                  <p className="mt-1 text-sm leading-6">{deletedSessionMessage}</p>
                </div>
              </div>
            </div>
          ) : null}

          {normalizedJoinToken && isJoining && !session ? (
            <section
              className={`max-w-2xl rounded-2xl border px-4 py-4 ${
                isDarkMode
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-slate-200 bg-white/70"
              }`}
              aria-label="Joining planning poker room"
            >
              <div className={`mb-4 flex items-center gap-2 text-sm font-medium ${currentTheme.text}`}>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Joining room
              </div>
              <div className="space-y-3">
                <Skeleton className="h-10 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            </section>
          ) : null}

          {session ? (
            <>
              {roomError ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    isDarkMode
                      ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                  role="alert"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{roomError}</span>
                    {shouldShowReconnectControl ? (
                      <Button
                        type="button"
                        variant="outline"
                        className={`h-8 px-3 ${currentTheme.border} ${
                          isDarkMode
                            ? "bg-white/[0.03] text-zinc-100 hover:bg-white/[0.06]"
                            : "bg-white/80 text-slate-700 hover:bg-white"
                        }`}
                        onClick={() => void handleJoin()}
                        disabled={isJoining}
                      >
                        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                        {session ? "Rejoin room" : "Retry connection"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                <PlanningPokerTaskQueue
                  activeTask={activeTask}
                  queue={session.queue}
                  isRevealed={session.isRevealed}
                  isHost={isCurrentParticipantHost}
                  recommendationOptions={VOTE_DECK_VALUES}
                  isSelectingRecommendation={isSelectingRecommendation}
                  isApplyingRecommendation={isApplyingRecommendation}
                  isAdvancingTask={isAdvancingTask}
                  canOpenBacklogPicker={isCurrentParticipantHost}
                  onSelectRecommendation={handleSelectRecommendation}
                  onApplyRecommendation={handleApplyRecommendation}
                  onAdvanceToNextTask={handleAdvanceToNextTask}
                  onOpenBacklogPicker={handleOpenBacklogPicker}
                />

                <PlanningPokerVoteDeck
                  cardValues={VOTE_DECK_VALUES}
                  selectedValue={selectedVote}
                  isSubmitting={isVoteSubmitting}
                  isRevealed={session.isRevealed}
                  isRevealing={isRevealing}
                  isHost={isCurrentParticipantHost}
                  hasActiveTask={Boolean(activeTask)}
                  disabled={!activeTask || isRevealing}
                  participants={session.participants}
                  onReveal={handleReveal}
                  onVote={handleVote}
                />

              </div>
            </>
          ) : null}
        </div>
      </div>

      <PlanningPokerBacklogPickerDialog
        isOpen={isBacklogPickerOpen}
        isLoading={isBacklogPickerLoading}
        isSubmitting={isBacklogTaskSubmitting}
        tasks={backlogTasks}
        currentTaskId={activeTask?.taskId ?? null}
        onClose={() => setIsBacklogPickerOpen(false)}
        onSelectTask={handleActivateBacklogTask}
      />
    </main>
  );
}
