import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import {
  AlertTriangle,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";
import { useParams } from "react-router";

import { PlanningPokerHostPanel } from "../components/planning-poker/PlanningPokerHostPanel";
import { PlanningPokerDeleteSessionDialog } from "../components/planning-poker/PlanningPokerDeleteSessionDialog";
import { PlanningPokerJoinForm } from "../components/planning-poker/PlanningPokerJoinForm";
import { PlanningPokerParticipantList } from "../components/planning-poker/PlanningPokerParticipantList";
import { PlanningPokerTaskQueue } from "../components/planning-poker/PlanningPokerTaskQueue";
import { PlanningPokerVoteDeck } from "../components/planning-poker/PlanningPokerVoteDeck";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import type {
  PlanningPokerParticipant,
  PlanningPokerSession,
  PlanningPokerSessionTask,
} from "../utils/planningPoker";
import {
  createPlanningPokerConnection,
  deletePlanningPokerSessionFromRoom,
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
  const [isJoining, setIsJoining] = useState(false);
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSelectingRecommendation, setIsSelectingRecommendation] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
  const votedCount =
    session?.participants.filter((participant) => participant.hasVoted).length ?? 0;
  const canJoinWithoutForm = isAuthenticated || participantToken.length > 0;
  const activeTask: PlanningPokerSessionTask | null =
    session && session.activeTask.sessionTaskId > 0 ? session.activeTask : null;

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
        const message =
          error instanceof Error ? error.message : "Unable to rejoin the planning poker room.";
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

  useEffect(() => {
    if (!session || copyFeedback === "") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyFeedback(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [copyFeedback, session]);

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
        const message =
          error instanceof Error ? error.message : "Unable to join the planning poker room.";
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
      setRoomError(error instanceof Error ? error.message : "Unable to submit your vote.");
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
        error instanceof Error ? error.message : "Unable to reveal the current round.",
      );
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyLink = async () => {
    const joinUrl = session?.joinUrl;
    if (!joinUrl) {
      return;
    }

    const absoluteJoinUrl =
      typeof window === "undefined" ? joinUrl : new URL(joinUrl, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(absoluteJoinUrl);
      setCopyFeedback("Join link copied.");
    } catch {
      setCopyFeedback("Could not copy automatically. You can still copy the link manually.");
    }
  };

  const handleDeleteSession = async () => {
    const connection = connectionRef.current;
    if (!connection || !normalizedJoinToken) {
      return;
    }

    setIsDeletingSession(true);
    setRoomError("");

    try {
      await deletePlanningPokerSessionFromRoom(
        connection,
        normalizedJoinToken,
        participantToken || null,
      );
      setIsDeleteDialogOpen(false);
    } catch (error) {
      setRoomError(
        error instanceof Error ? error.message : "Unable to delete the planning poker session.",
      );
    } finally {
      setIsDeletingSession(false);
    }
  };

  const revealStatusMessage = session?.isRevealed
    ? "This round is already revealed."
    : votedCount > 0
      ? "Reveal is available once the host is ready."
      : "At least one vote is needed before reveal.";

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
        error instanceof Error ? error.message : "Unable to select the planning poker recommendation.",
      );
    } finally {
      setIsSelectingRecommendation(false);
    }
  };

  return (
    <main className={`${workspaceSurface.pageClassName} px-4 py-8 ${currentTheme.text} sm:px-6 lg:px-8`}>
      <div className={workspaceSurface.backgroundLayerClassName}>
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <div className="relative z-10">
        <div className={`${pageWidthClassName} flex flex-col gap-6`}>
          <section
            className={`${workspaceSurface.panelSurfaceClassName} rounded-[1.75rem] px-5 py-5 shadow-2xl sm:px-6`}
            style={workspaceSurface.panelSurfaceStyle}
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.85fr)] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.border} ${
                      isDarkMode
                        ? "bg-cyan-400/10 text-cyan-100"
                        : "bg-cyan-500/10 text-cyan-700"
                    }`}
                  >
                    Planning poker
                  </span>
                  <span className={`text-sm font-medium ${currentTheme.textMuted}`}>
                    Live estimation room
                  </span>
                </div>

                <h1 className={`mt-3 font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  Planning poker room
                </h1>

                <p className={`mt-2 max-w-2xl text-base leading-7 ${currentTheme.textMuted}`}>
                  Keep estimation inside the board workspace, surface the active task
                  without switching context, and let the team vote in real time.
                </p>

                {normalizedJoinToken ? (
                  <p className={`mt-4 text-xs ${currentTheme.textMuted}`}>
                    Room token{" "}
                    <span className="font-mono text-[11px] tracking-[0.02em]">
                      {normalizedJoinToken}
                    </span>
                  </p>
                ) : null}
              </div>

              <Card className={`${workspaceSurface.elevatedSurfaceClassName} overflow-hidden rounded-[1.5rem] shadow-lg`}>
                <CardHeader className={`space-y-2 border-b ${currentTheme.border} px-5 py-4`}>
                  <CardTitle className={`text-xs font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                    Room status
                  </CardTitle>
                  <div className="space-y-1">
                    <p className={`text-lg font-semibold ${currentTheme.text}`}>
                      {session
                        ? `${votedCount} of ${session.participants.length} votes in`
                        : "Waiting for the room to connect"}
                    </p>
                    <p className={`text-sm leading-6 ${currentTheme.textMuted}`}>
                      {session
                        ? activeTask
                          ? `Current task: ${activeTask.title}. ${getConnectionBannerLabel(connectionBannerState)}`
                          : getConnectionBannerLabel(connectionBannerState)
                        : getConnectionBannerLabel(connectionBannerState)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5 py-4">
                  <p className={`text-sm leading-6 ${currentTheme.textMuted}`}>
                    {session
                      ? currentParticipant?.isHost
                        ? "You can copy the room link, reveal the round, or close the session from here."
                        : "You can keep voting while the host manages the room from the board workspace."
                      : "Join the room to start the live estimation session."}
                  </p>
                  {connectionBannerState !== "connected" && normalizedJoinToken ? (
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-center ${currentTheme.border} ${
                        isDarkMode
                          ? "bg-white/[0.03] text-zinc-100 hover:bg-white/[0.06]"
                          : "bg-white/70 text-slate-700 hover:bg-white"
                      }`}
                      onClick={() => void handleJoin()}
                      disabled={isJoining}
                    >
                      <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                      {session ? "Rejoin room" : "Retry connection"}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </section>

          <div className={`shrink-0 border-t ${currentTheme.border}`} />

          {!normalizedJoinToken ? (
            <Card className="border-rose-400/20 bg-rose-400/10">
              <CardContent className="px-6 py-6">
                <div className="flex items-start gap-3 text-rose-100">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="text-lg font-semibold">Missing join token</h2>
                    <p className="mt-2 text-sm leading-6">
                      This link does not include a valid planning poker room token.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <Card className="border-rose-400/20 bg-rose-400/10">
              <CardContent className="px-6 py-6">
                <div className="flex items-start gap-3 text-rose-100">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="text-lg font-semibold">Session deleted</h2>
                    <p className="mt-2 text-sm leading-6">{deletedSessionMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {normalizedJoinToken && isJoining && !session ? (
            <Card className="max-w-2xl border-white/10 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Joining room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 rounded-3xl bg-slate-800" />
                <Skeleton className="h-44 rounded-3xl bg-slate-800" />
              </CardContent>
            </Card>
          ) : null}

          {session ? (
            <>
              {roomError ? (
                <div
                  className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50"
                  role="alert"
                >
                  {roomError}
                </div>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)]">
                <div className="space-y-6">
                  <PlanningPokerTaskQueue
                    activeTask={activeTask}
                    queue={session.queue}
                    isRevealed={session.isRevealed}
                    isHost={Boolean(currentParticipant?.isHost)}
                    recommendationOptions={VOTE_DECK_VALUES}
                    isSelectingRecommendation={isSelectingRecommendation}
                    onSelectRecommendation={handleSelectRecommendation}
                  />

                  <PlanningPokerVoteDeck
                    cardValues={VOTE_DECK_VALUES}
                    selectedValue={selectedVote}
                    isSubmitting={isVoteSubmitting}
                    isRevealed={session.isRevealed}
                    disabled={!activeTask || isRevealing}
                    onVote={handleVote}
                  />
                </div>

                <div className="space-y-6">
                  <PlanningPokerHostPanel
                    isHost={Boolean(currentParticipant?.isHost)}
                    joinUrl={
                      typeof window === "undefined"
                        ? session.joinUrl
                        : new URL(session.joinUrl, window.location.origin).toString()
                    }
                    votedCount={votedCount}
                    participantCount={session.participants.length}
                    isRevealed={session.isRevealed}
                    isRevealing={isRevealing}
                    isDeleting={isDeletingSession}
                    copyFeedback={copyFeedback}
                    statusMessage={revealStatusMessage}
                    errorMessage={currentParticipant?.isHost ? "" : roomError}
                    onCopyLink={handleCopyLink}
                    onReveal={handleReveal}
                    onDelete={() => setIsDeleteDialogOpen(true)}
                  />

                  <PlanningPokerParticipantList
                    participants={session.participants}
                    isRevealed={session.isRevealed}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <PlanningPokerDeleteSessionDialog
        isOpen={isDeleteDialogOpen}
        isDeleting={isDeletingSession}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => void handleDeleteSession()}
      />
    </main>
  );
}
