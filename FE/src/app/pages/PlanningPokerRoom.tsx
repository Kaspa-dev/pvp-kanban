import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import {
  AlertTriangle,
  Link2,
  LoaderCircle,
  RefreshCcw,
  Signal,
  UsersRound,
  Vote,
} from "lucide-react";
import { useParams } from "react-router";

import { PlanningPokerHostPanel } from "../components/planning-poker/PlanningPokerHostPanel";
import { PlanningPokerJoinForm } from "../components/planning-poker/PlanningPokerJoinForm";
import { PlanningPokerParticipantList } from "../components/planning-poker/PlanningPokerParticipantList";
import { PlanningPokerTaskQueue } from "../components/planning-poker/PlanningPokerTaskQueue";
import { PlanningPokerVoteDeck } from "../components/planning-poker/PlanningPokerVoteDeck";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";
import type {
  PlanningPokerParticipant,
  PlanningPokerSession,
  PlanningPokerSessionTask,
} from "../utils/planningPoker";
import {
  createPlanningPokerConnection,
  joinPlanningPokerSession,
  revealPlanningPokerVotes,
  stopPlanningPokerConnection,
  submitPlanningPokerVote,
} from "../utils/planningPokerGuest";

const VOTE_DECK_VALUES = [0, 1, 2, 3, 5, 8, 13, 21];

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

        const nextParticipantId =
          (response as { participantId?: number }).participantId ?? null;
        setSession(response.session);
        setParticipantToken(response.participantToken);
        setParticipantId(nextParticipantId);
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

        const nextParticipantId =
          (response as { participantId?: number }).participantId ?? null;
        setSession(response.session);
        setParticipantToken(response.participantToken);
        setParticipantId(nextParticipantId);
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

  const revealStatusMessage = session?.isRevealed
    ? "This round is already revealed."
    : votedCount > 0
      ? "Reveal is available once the host is ready."
      : "At least one vote is needed before reveal.";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#020617_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/75 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  Planning Poker
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/10 bg-slate-950/50 text-slate-300"
                >
                  <Link2 className="mr-1 h-3 w-3" aria-hidden="true" />
                  Token {normalizedJoinToken || "missing"}
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Shared planning poker room
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Join through the shared link, vote live with the team, and follow the
                  active task queue without relying on the protected app shell.
                </p>
              </div>
            </div>

            <Card className="border-white/10 bg-slate-950/40">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Signal className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  Connection
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-300">
                  {getConnectionBannerLabel(connectionBannerState)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                  {session
                    ? `${votedCount} of ${session.participants.length} votes are in.`
                    : "Join the room to start receiving live updates."}
                </div>
                {connectionBannerState !== "connected" && normalizedJoinToken ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/10 bg-slate-900 text-slate-100 hover:bg-slate-800"
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

        {normalizedJoinToken && !session ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <PlanningPokerJoinForm
              displayName={guestDisplayName}
              isAuthenticated={isAuthenticated}
              authenticatedLabel={authenticatedLabel}
              isSubmitting={isJoining}
              errorMessage={joinError}
              onDisplayNameChange={setGuestDisplayName}
              onSubmit={() => handleJoin()}
            />

            <Card className="border-white/10 bg-slate-900/70">
              <CardHeader className="space-y-2">
                <CardTitle className="text-white">What happens next</CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-300">
                  The room joins immediately once your identity is confirmed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  Live updates arrive through SignalR as soon as the room accepts your join.
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  Your participant token is kept locally so you can reconnect through the
                  shared link.
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  The current backend only supports joining, voting, and revealing the round.
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {normalizedJoinToken && isJoining && !session ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Card className="border-white/10 bg-slate-900/80">
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
            <Card className="border-white/10 bg-slate-900/80">
              <CardContent className="space-y-4 px-6 py-6">
                <Skeleton className="h-24 rounded-3xl bg-slate-800" />
                <Skeleton className="h-40 rounded-3xl bg-slate-800" />
              </CardContent>
            </Card>
          </div>
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
                  copyFeedback={copyFeedback}
                  statusMessage={revealStatusMessage}
                  errorMessage={currentParticipant?.isHost ? "" : roomError}
                  onCopyLink={handleCopyLink}
                  onReveal={handleReveal}
                />

                <PlanningPokerParticipantList
                  participants={session.participants}
                  isRevealed={session.isRevealed}
                />

                <Card className="border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <UsersRound className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                      Session snapshot
                    </CardTitle>
                    <CardDescription className="text-sm leading-6 text-slate-300">
                      Current room metadata from the shared session snapshot.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Session
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">{session.status}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Active votes
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                        <Vote className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                        {votedCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
