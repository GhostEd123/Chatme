import { create } from "zustand";

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
  kind: string;
  text: string;
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
  /** Keyed by conversationId */
  conversations: Record<string, ConversationRealtimeState>;

  setConnected: (connected: boolean) => void;

  subscribeConversation: (
    conversationId: string,
    initial: { participants: ParticipantPresence[]; typing: TypingUser[] }
  ) => void;
  unsubscribeConversation: (conversationId: string) => void;

  applyPresenceChanged: (event: PresenceChangedEvent) => void;
  applyTypingStarted: (event: TypingStartedEvent) => void;
  applyTypingStopped: (event: TypingStoppedEvent) => void;

  // Incoming message events — stored per conversation for real-time list updates
  incomingMessages: Record<string, MessageCreatedEvent[]>;
  pushIncomingMessage: (event: MessageCreatedEvent) => void;
  clearIncomingMessages: (conversationId: string) => void;
};

export const useSocketStore = create<SocketState>()((set) => ({
  connected: false,
  conversations: {},
  incomingMessages: {},

  setConnected: (connected) => set({ connected }),

  subscribeConversation: (conversationId, initial) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [conversationId]: {
          participants: initial.participants,
          typing: initial.typing,
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
      const withoutOld = conv.typing.filter(
        (t) => t.userId !== event.userId
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
