import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { Card } from "../utils/cards";

function resolveBoardHubUrls(): string[] {
  const configuredBackendUrl = __BANBAN_BACKEND_URL__?.trim();

  if (configuredBackendUrl) {
    return [new URL("/hubs/board", configuredBackendUrl).toString()];
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost" && window.location.port === "5173") {
    return [
      "http://localhost:5280/hubs/board",
      "https://localhost:7070/hubs/board",
    ];
  }

  return ["/hubs/board"];
}

export type BoardStatus = Card["status"];

export interface BoardMoveMessage {
  boardId: string;
  cardId: string;
  fromStatus: BoardStatus;
  toStatus: BoardStatus;
  movedBy: string;
  movedAt: string;
}

type BoardMoveListener = (move: BoardMoveMessage) => void;

class BoardRealtimeClient {
  private connection: HubConnection | null = null;
  private listeners = new Set<BoardMoveListener>();
  private activeBoardId: string | null = null;
  private startPromise: Promise<HubConnection | null> | null = null;
  private activeHubUrl: string | null = null;

  private createConnection(hubUrl: string) {
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("CardMoved", (move: BoardMoveMessage) => {
      this.listeners.forEach((listener) => listener(move));
    });

    connection.onreconnected(async () => {
      if (!this.activeBoardId) {
        return;
      }

      try {
        await connection.invoke("JoinBoard", this.activeBoardId);
      } catch (error) {
        console.warn("Failed to rejoin board realtime group", error);
      }
    });

    return connection;
  }

  private async ensureConnection(): Promise<HubConnection | null> {
    if (this.connection?.state === HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    const candidateUrls = this.activeHubUrl
      ? [this.activeHubUrl, ...resolveBoardHubUrls().filter((url) => url !== this.activeHubUrl)]
      : resolveBoardHubUrls();

    this.startPromise = (async () => {
      for (const hubUrl of candidateUrls) {
        this.connection = this.createConnection(hubUrl);

        try {
          await this.connection.start();
          this.activeHubUrl = hubUrl;
          return this.connection;
        } catch (error) {
          console.warn(`Board realtime connection unavailable for ${hubUrl}`, error);
          this.connection = null;
        }
      }

      return null;
    })()
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  subscribe(listener: BoardMoveListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async joinBoard(boardId: string): Promise<boolean> {
    const connection = await this.ensureConnection();
    if (!connection) {
      return false;
    }

    if (this.activeBoardId && this.activeBoardId !== boardId && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke("LeaveBoard", this.activeBoardId);
      } catch (error) {
        console.warn("Failed to leave previous board realtime group", error);
      }
    }

    if (this.activeBoardId === boardId && connection.state === HubConnectionState.Connected) {
      return true;
    }

    try {
      await connection.invoke("JoinBoard", boardId);
      this.activeBoardId = boardId;
      return true;
    } catch (error) {
      console.warn("Failed to join board realtime group", error);
      return false;
    }
  }

  async leaveBoard(boardId?: string): Promise<void> {
    const targetBoardId = boardId ?? this.activeBoardId;
    if (!targetBoardId || !this.connection || this.connection.state !== HubConnectionState.Connected) {
      if (!boardId || boardId === this.activeBoardId) {
        this.activeBoardId = null;
      }
      return;
    }

    try {
      await this.connection.invoke("LeaveBoard", targetBoardId);
    } catch (error) {
      console.warn("Failed to leave board realtime group", error);
    } finally {
      if (!boardId || boardId === this.activeBoardId) {
        this.activeBoardId = null;
      }
    }
  }

  async sendMove(move: BoardMoveMessage): Promise<boolean> {
    const connection = await this.ensureConnection();
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return false;
    }

    try {
      await connection.invoke("MoveCard", move);
      return true;
    } catch (error) {
      console.warn("Failed to broadcast board move", error);
      return false;
    }
  }
}

export const boardRealtimeClient = new BoardRealtimeClient();
