import { create } from "zustand";
import type { MessageAttachment } from "@/features/home/hooks/useMessages";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ParticipantPresence {
  userId: string;
  status: "online" | "offline";
}

export interface TypingUser {
  userId: string;
  expiresAt: string; // ISO timestamp
}

export interface ConversationRealtimeState {
  participants: ParticipantPresence[];
  typing: TypingUser[];
}

export interface MessageCreatedEvent {
  id: string;
  conversationId: string;
  clientMessageId: string;
  senderId: string;
  kind: "text" | "image" | "audio" | "video" | "document";
  text: string | null;
  attachments?: MessageAttachment[];
  links?: string[];
  createdAt: string;
}

export interface ReceiptEvent {
  conversationId: string;
  userId: string;
  throughMessageId: string;
  at: string;
  version: number;
  delivered: { messageId: string; at: string } | null;
  read: { messageId: string; at: string } | null;
}

export interface PresenceChangedEvent {
  conversationId: string;
  userId: string;
  status: "online" | "offline";
  occurredAt: string;
}

export interface TypingStartedEvent {
  conversationId: string;
  userId: string;
  expiresAt: string;
}

export interface TypingStoppedEvent {
  conversationId: string;
  userId: string;
  occurredAt: string;
}

// ── Store ──────────────────────────────────────────────────────────────────────

type SocketState = {
  connected: boolean;
  /** Monotonically increasing counter incremented on every new connection/reconnect */
  connectionEpoch: number;
  /** Keyed by conversationId */
  conversations: Record<string, ConversationRealtimeState>;

  setConnected: (connected: boolean) => void;
  incrementConnectionEpoch: () => void;
  clearAllPresenceAndTyping: () => void;

  subscribeConversation: (
    conversationId: string,
    initial: { participants: ParticipantPresence[]; typing: TypingUser[] }
  ) => void;
  unsubscribeConversation: (conversationId: string) => void;

  applyPresenceChanged: (event: PresenceChangedEvent) => void;
  applyTypingStarted: (event: TypingStartedEvent) => void;
  applyTypingStopped: (event: TypingStoppedEvent) => void;
  cleanExpiredTyping: () => void;

  applyReceiptDelivered: (event: ReceiptEvent) => void;
  applyReceiptRead: (event: ReceiptEvent) => void;

  // Incoming message events — stored per conversation for real-time list updates
  incomingMessages: Record<string, MessageCreatedEvent[]>;
  pushIncomingMessage: (event: MessageCreatedEvent) => void;
  clearIncomingMessages: (conversationId: string) => void;
};

export const useSocketStore = create<SocketState>()((set) => ({
  connected: false,
  connectionEpoch: 0,
  conversations: {},
  incomingMessages: {},

  setConnected: (connected) => set({ connected }),
  incrementConnectionEpoch: () =>
    set((state) => ({ connectionEpoch: state.connectionEpoch + 1 })),

  clearAllPresenceAndTyping: () =>
    set((state) => {
      const reset: Record<string, ConversationRealtimeState> = {};
      for (const [id, conv] of Object.entries(state.conversations)) {
        reset[id] = {
          participants: conv.participants.map((p) => ({ ...p, status: "offline" })),
          typing: [],
        };
      }
      return { conversations: reset };
    }),

  subscribeConversation: (conversationId, initial) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [conversationId]: {
          participants: initial.participants,
          typing: initial.typing.filter(
            (t) => new Date(t.expiresAt).getTime() > Date.now()
          ),
        },
      },
    })),

  unsubscribeConversation: (conversationId) =>
    set((state) => {
      const next = { ...state.conversations };
      delete next[conversationId];
      return { conversations: next };
    }),

  applyPresenceChanged: (event) =>
    set((state) => {
      const conv = state.conversations[event.conversationId];
      if (!conv) return state;
      return {
        conversations: {
          ...state.conversations,
          [event.conversationId]: {
            ...conv,
            participants: conv.participants.map((p) =>
              p.userId === event.userId
                ? { ...p, status: event.status }
                : p
            ),
          },
        },
      };
    }),

  applyTypingStarted: (event) =>
    set((state) => {
      const conv = state.conversations[event.conversationId];
      if (!conv) return state;
      // Filter out any typing that has already expired
      const now = Date.now();
      const withoutOld = conv.typing.filter(
        (t) => t.userId !== event.userId && new Date(t.expiresAt).getTime() > now
      );
      return {
        conversations: {
          ...state.conversations,
          [event.conversationId]: {
            ...conv,
            typing: [
              ...withoutOld,
              { userId: event.userId, expiresAt: event.expiresAt },
            ],
          },
        },
      };
    }),

  applyTypingStopped: (event) =>
    set((state) => {
      const conv = state.conversations[event.conversationId];
      if (!conv) return state;
      return {
        conversations: {
          ...state.conversations,
          [event.conversationId]: {
            ...conv,
            typing: conv.typing.filter((t) => t.userId !== event.userId),
          },
        },
      };
    }),

  cleanExpiredTyping: () =>
    set((state) => {
      const now = Date.now();
      let changed = false;
      const updated: Record<string, ConversationRealtimeState> = {};
      for (const [id, conv] of Object.entries(state.conversations)) {
        const validTyping = conv.typing.filter(
          (t) => new Date(t.expiresAt).getTime() > now
        );
        if (validTyping.length !== conv.typing.length) {
          changed = true;
          updated[id] = { ...conv, typing: validTyping };
        } else {
          updated[id] = conv;
        }
      }
      return changed ? { conversations: updated } : state;
    }),

  applyReceiptDelivered: (_event) => {
    // Handled in tandem with query invalidation
  },

  applyReceiptRead: (_event) => {
    // Handled in tandem with query invalidation
  },

  pushIncomingMessage: (event) =>
    set((state) => {
      const existing = state.incomingMessages[event.conversationId] ?? [];
      // Deduplicate by id
      if (existing.some((m) => m.id === event.id)) return state;
      return {
        incomingMessages: {
          ...state.incomingMessages,
          [event.conversationId]: [...existing, event],
        },
      };
    }),

  clearIncomingMessages: (conversationId) =>
    set((state) => {
      const next = { ...state.incomingMessages };
      delete next[conversationId];
      return { incomingMessages: next };
    }),
}));
