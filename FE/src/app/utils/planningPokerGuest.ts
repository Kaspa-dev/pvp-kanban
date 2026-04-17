import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr";
import { getAccessToken } from "./auth";
import type { PlanningPokerSession } from "./planningPoker";

export interface PlanningPokerJoinSessionResponse {
  session: PlanningPokerSession;
  participantToken: string;
  participantId: number;
}

export interface PlanningPokerConnectionOptions {
  onSessionUpdated?: (session: PlanningPokerSession) => void;
  onVotingUpdated?: (session: PlanningPokerSession) => void;
  onSessionDeleted?: (event: PlanningPokerSessionDeletedEvent) => void;
  onClosed?: (error?: Error) => void;
  logger?: LogLevel;
}

export interface PlanningPokerSessionDeletedEvent {
  boardId: number;
  message: string;
}

export function createPlanningPokerConnection(
  options: PlanningPokerConnectionOptions = {},
): HubConnection {
  const connection = new HubConnectionBuilder()
    .withUrl("/hubs/planning-poker", {
      accessTokenFactory: () => getAccessToken() ?? "",
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(options.logger ?? LogLevel.Warning)
    .build();

  if (options.onSessionUpdated) {
    connection.on("SessionUpdated", options.onSessionUpdated);
  }

  if (options.onVotingUpdated) {
    connection.on("VotingUpdated", options.onVotingUpdated);
  }

  if (options.onSessionDeleted) {
    connection.on("SessionDeleted", options.onSessionDeleted);
  }

  if (options.onClosed) {
    connection.onclose(options.onClosed);
  }

  return connection;
}

export async function ensurePlanningPokerConnection(connection: HubConnection): Promise<void> {
  if (connection.state === HubConnectionState.Disconnected) {
    await connection.start();
  }
}

export async function joinPlanningPokerSession(
  connection: HubConnection,
  joinToken: string,
  participantToken?: string | null,
  displayName?: string | null,
): Promise<PlanningPokerJoinSessionResponse> {
  await ensurePlanningPokerConnection(connection);

  return connection.invoke<PlanningPokerJoinSessionResponse>(
    "JoinSession",
    joinToken,
    participantToken ?? null,
    displayName ?? null,
  );
}

export async function submitPlanningPokerVote(
  connection: HubConnection,
  joinToken: string,
  cardValue: number,
  participantToken?: string | null,
): Promise<PlanningPokerSession> {
  await ensurePlanningPokerConnection(connection);

  return connection.invoke<PlanningPokerSession>(
    "SubmitVote",
    joinToken,
    cardValue,
    participantToken ?? null,
  );
}

export async function revealPlanningPokerVotes(
  connection: HubConnection,
  joinToken: string,
  participantToken?: string | null,
): Promise<PlanningPokerSession> {
  await ensurePlanningPokerConnection(connection);

  return connection.invoke<PlanningPokerSession>(
    "RevealVotes",
    joinToken,
    participantToken ?? null,
  );
}

export async function selectPlanningPokerRecommendation(
  connection: HubConnection,
  joinToken: string,
  storyPoints: number,
  participantToken?: string | null,
): Promise<PlanningPokerSession> {
  await ensurePlanningPokerConnection(connection);

  return connection.invoke<PlanningPokerSession>(
    "SelectRecommendation",
    joinToken,
    storyPoints,
    participantToken ?? null,
  );
}

export async function deletePlanningPokerSessionFromRoom(
  connection: HubConnection,
  joinToken: string,
  participantToken?: string | null,
): Promise<void> {
  await ensurePlanningPokerConnection(connection);

  await connection.invoke(
    "DeleteSession",
    joinToken,
    participantToken ?? null,
  );
}

export async function stopPlanningPokerConnection(connection: HubConnection): Promise<void> {
  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
}
