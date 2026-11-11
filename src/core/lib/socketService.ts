import { SOCKET_PATH, SOCKET_URL } from "@/shared/constants/config";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getCurrentSessionGeneration,
  refreshSession,
} from "@/core/lib/apiClient";
import {
  useSocketStore,
  MessageCreatedEvent,
  PresenceChangedEvent,
  ReceiptEvent,
  TypingStartedEvent,
  TypingStoppedEvent,
} from "@/core/store/socketStore";
import { upsertMessageInCache } from "@/features/home/utils/messageReconcile";
import { queryClient } from "@/core/lib/queryClient";

// Server → client events
interface ServerToClientEvents {
  "message.created": (event: MessageCreatedEvent) => void;
  "receipt.delivered": (event: ReceiptEvent) => void;
  "receipt.read": (event: ReceiptEvent) => void;
  "presence.changed": (event: PresenceChangedEvent) => void;
  "typing.started": (event: TypingStartedEvent) => void;
  "typing.stopped": (event: TypingStoppedEvent) => void;
}

// Client → server events (with ack)
interface ClientToServerEvents {
  "presence.subscribe": (
    payload: { conversationId: string },
    ack: (res: AckResponse) => void
  ) => void;
  "presence.unsubscribe": (
    payload: { conversationId: string },
    ack: (res: AckResponse) => void
  ) => void;
  "typing.start": (
    payload: { conversationId: string },
    ack: (res: AckResponse) => void
  ) => void;
  "typing.stop": (
    payload: { conversationId: string },
    ack: (res: AckResponse) => void
  ) => void;
}

interface AckResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ── Backoff constants ─────────────────────────────────────────────────────────
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

class SocketService {
  private socket: ChatSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** How many consecutive reconnect attempts have been made */
  private _retryCount = 0;
  /** Session generation captured when connect() was called */
  private _sessionAtConnect = -1;

  /** Connects (or reconnects) to the /chat namespace with the given token. */
  connect(token: string): void {
    // Already connected with same token — no-op
    if (this.socket?.connected) return;

    // Record the session generation so reconnect loops can self-cancel
    this._sessionAtConnect = getCurrentSessionGeneration();

    // Clean up any existing socket
    this.destroy();

    this.socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      auth: { token },
      // We manage reconnection ourselves so we can:
      //   1. Refresh the access token when needed
      //   2. Apply bounded exponential backoff
      //   3. Cancel reconnection when the session ends
      reconnection: false,
      timeout: 90_000,
    }) as ChatSocket;

    this._attachListeners();
  }

  /** Disconnect and clean up — also cancels any pending reconnect. */
  disconnect(): void {
    this.destroy();
    const store = useSocketStore.getState();
    store.setConnected(false);
    store.clearAllPresenceAndTyping();
  }

  /** Emit a Socket.IO event with an acknowledgement, returns a promise. */
  emit<T = unknown>(
    event: keyof ClientToServerEvents,
    payload: { conversationId: string }
  ): Promise<AckResponse<T>> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({
          ok: false,
          error: { code: "SOCKET_NOT_CONNECTED", message: "Socket is not connected." },
        });
        return;
      }
      // @ts-expect-error — overloaded emit types
      this.socket.emit(event, payload, (ack: AckResponse<T>) => resolve(ack));
    });
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private _attachListeners(): void {
    if (!this.socket) return;
    const store = useSocketStore.getState();

    this.socket.on("connect", () => {
      // Successful connection — reset the retry counter
      this._retryCount = 0;
      store.setConnected(true);
      store.incrementConnectionEpoch();

      // Catch-up refetch after reconnect: invalidate conversations and messages
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    });

    this.socket.on("disconnect", async (reason) => {
      store.setConnected(false);
      store.clearAllPresenceAndTyping();

      // Server-initiated close or transport dropped — attempt reconnect.
      // "io client disconnect" means we called socket.disconnect() ourselves,
      // so we should NOT reconnect in that case.
      if (
        reason === "io server disconnect" ||
        reason === "transport close" ||
        reason === "ping timeout" ||
        reason === "transport error"
      ) {
        await this._scheduleReconnect(/* needsTokenRefresh */ reason === "io server disconnect");
      }
    });

    this.socket.on("connect_error", async (err) => {
      const data = (err as any).data;
      const code: string = data?.code ?? "";

      if (code === "AUTH_ACCESS_TOKEN_INVALID") {
        // Token expired/invalid → refresh and retry
        await this._scheduleReconnect(/* needsTokenRefresh */ true);
      } else {
        // Generic connection error (e.g. network down, DNS, server offline)
        // — schedule a reconnect with backoff without refreshing the token.
        await this._scheduleReconnect(/* needsTokenRefresh */ false);
      }
    });

    // ── Server event → store & shared reconciliation ──
    this.socket.on("message.created", (event) => {
      store.pushIncomingMessage(event);

      // Pass complete validated event through shared reconciliation helper
      upsertMessageInCache(event.conversationId, {
        id: event.id,
        conversationId: event.conversationId,
        clientMessageId: event.clientMessageId,
        senderId: event.senderId,
        kind: event.kind,
        text: event.text,
        attachments: event.attachments,
        createdAt: event.createdAt,
        status: "delivered",
      });

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    this.socket.on("presence.changed", (event) => {
      store.applyPresenceChanged(event);
    });

    this.socket.on("typing.started", (event) => {
      store.applyTypingStarted(event);
    });

    this.socket.on("typing.stopped", (event) => {
      store.applyTypingStopped(event);
    });

    // Receipt events update message delivery/read state in the cache
    this.socket.on("receipt.delivered", (event) => {
      store.applyReceiptDelivered(event);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    this.socket.on("receipt.read", (event) => {
      store.applyReceiptRead(event);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }

  /**
   * Schedule a reconnection attempt with bounded exponential backoff.
   * If `needsTokenRefresh` is true, we call refreshSession().
   * Handles structured refresh outcomes:
   *   - "ok": proceeds to reconnect
   *   - "temporary": retries with backoff instead of terminating
   *   - "rejected" / "stale": terminates recovery loop
   */
  private async _scheduleReconnect(needsTokenRefresh: boolean): Promise<void> {
    if (this.reconnectTimer) return;

    // ── Session boundary check 1 ──────────────────────────────────────────
    if (getCurrentSessionGeneration() !== this._sessionAtConnect) return;

    let token: string | null = null;
    if (needsTokenRefresh) {
      const outcome = await refreshSession();
      // Session boundary check 2 (after async refresh)
      if (getCurrentSessionGeneration() !== this._sessionAtConnect) return;

      if (outcome.kind === "ok") {
        token = outcome.accessToken;
      } else if (outcome.kind === "temporary") {
        // TEMPORARY FAILURE (network or 5xx error): Keep trying with exponential backoff!
        const delay = Math.min(
          BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, this._retryCount),
          BACKOFF_MAX_MS
        );
        this._retryCount += 1;
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          if (getCurrentSessionGeneration() !== this._sessionAtConnect) return;
          void this._scheduleReconnect(true);
        }, delay);
        return;
      } else {
        // "rejected" or "stale" — terminal auth failure for this session
        return;
      }
    } else {
      token = useAuthStore.getState().accessToken;
      if (!token) return;
    }

    // ── Session boundary check 3 ──────────────────────────────────────────
    if (getCurrentSessionGeneration() !== this._sessionAtConnect) return;

    // ── Backoff delay ─────────────────────────────────────────────────────
    const delay = Math.min(
      BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, this._retryCount),
      BACKOFF_MAX_MS
    );
    this._retryCount += 1;

    const capturedToken = token;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (getCurrentSessionGeneration() !== this._sessionAtConnect) return;
      this.connect(capturedToken);
    }, delay);
  }

  private destroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

/** Singleton — one socket for the entire app lifetime. */
export const socketService = new SocketService();
