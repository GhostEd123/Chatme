import { SOCKET_PATH, SOCKET_URL } from "@/shared/constants/config";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/features/auth/store/authStore";
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

class SocketService {
  private socket: ChatSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Connects (or reconnects) to the /chat namespace with the given token. */
  connect(token: string): void {
    // Already connected with same token — no-op
    if (this.socket?.connected) return;

    // Clean up any existing socket
    this.destroy();

    this.socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      auth: { token },
      reconnection: false, // We handle reconnection ourselves for token refresh
      timeout: 90_000,
    }) as ChatSocket;

    this._attachListeners();
  }

  /** Disconnect and clean up. */
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
      store.setConnected(true);
    });

    this.socket.on("disconnect", async (reason) => {
      store.setConnected(false);
      // Server closed the socket — likely token expired
      if (
        reason === "io server disconnect" ||
        reason === "transport close"
      ) {
        await this._handleReconnect();
      }
    });

    this.socket.on("connect_error", async (err) => {
      const data = (err as any).data;
      const code: string = data?.code ?? "";
      if (code === "AUTH_ACCESS_TOKEN_INVALID") {
        // Token expired/invalid → refresh and retry
        await this._handleReconnect();
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

    // receipt events are handled by screens via queryClient invalidation
    // but we still expose them if needed
    this.socket.on("receipt.delivered", () => {});
    this.socket.on("receipt.read", () => {});
  }

  private async _handleReconnect(): Promise<void> {
    if (this.reconnectTimer) return; // already in progress

    const { refreshToken, updateAccessToken, clearSession } =
      useAuthStore.getState();

    if (!refreshToken) {
      clearSession();
      return;
    }

    // Attempt token refresh
    try {
      const res = await fetch(
        `https://chateo-lhuw.onrender.com/v1/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!res.ok) {
        clearSession();
        return;
      }

      const data = await res.json();
      updateAccessToken(data.accessToken);
      if (data.refreshToken) {
        useAuthStore.setState({ refreshToken: data.refreshToken });
      }

      // Brief delay before reconnecting
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect(data.accessToken);
      }, 1_000);
    } catch {
      clearSession();
    }
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
