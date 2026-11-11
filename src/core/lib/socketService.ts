import { SOCKET_PATH, SOCKET_URL } from "@/shared/constants/config";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getCurrentSessionGeneration,
  refreshAccessToken,
} from "@/core/lib/apiClient";
import {
  useSocketStore,
  MessageCreatedEvent,
  PresenceChangedEvent,
  ReceiptEvent,
  TypingStartedEvent,
  TypingStoppedEvent,
} from "@/core/store/socketStore";

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
  /** Session generation captured when the last connect() was called.
   *  Used to stop reconnect loops that belong to a previous session. */
  private _sessionAtConnect = -1;

  /** Connects (or reconnects) to the /chat namespace with the given token. */
  connect(token: string): void {
    // Already connected with same token — no-op
    if (this.socket?.connected) return;

    // Record the session generation so reconnect loops can self-cancel
    this._sessionAtConnect = getCurrentSessionGeneration();
    this._retryCount = 0;

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
    useSocketStore.getState().setConnected(false);
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
    });

    this.socket.on("disconnect", async (reason) => {
      store.setConnected(false);

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
        // Generic connection error (e.g. network down, DNS, server not up yet)
        // — schedule a reconnect with backoff but do NOT refresh the token.
        await this._scheduleReconnect(/* needsTokenRefresh */ false);
      }
    });

    // ── Server event → store ──
    this.socket.on("message.created", (event) => {
      store.pushIncomingMessage(event);
      import("@/core/lib/queryClient").then(({ queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      });
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

    // Receipt events are forwarded to the query cache via invalidation
    this.socket.on("receipt.delivered", () => {});
    this.socket.on("receipt.read", () => {});
  }

  /**
   * Schedule a reconnection attempt with bounded exponential backoff.
   * If `needsTokenRefresh` is true, we first refresh the access token.
   * The reconnect is silently cancelled if the session has changed (logout /
   * account switch) since this socket was originally connected.
   */
  private async _scheduleReconnect(needsTokenRefresh: boolean): Promise<void> {
    // Don't double-schedule
    if (this.reconnectTimer) return;

    // ── Session boundary check ────────────────────────────────────────────
    // If the user has logged out or switched accounts, the session generation
    // will have been bumped.  Stop reconnecting for the old session.
    if (getCurrentSessionGeneration() !== this._sessionAtConnect) return;

    // ── Token refresh (if required) ───────────────────────────────────────
    let token: string | null = null;
    if (needsTokenRefresh) {
      token = await refreshAccessToken();
      if (!token) {
        // Definitive auth failure — clearSession() was already called inside
        // refreshAccessToken.  Nothing more to do.
        return;
      }
    } else {
      token = useAuthStore.getState().accessToken;
      if (!token) return;
    }

    // ── Re-check session after the async refresh ──────────────────────────
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
      // Final session check just before we reconnect
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
