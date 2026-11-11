import { socketService } from "@/core/lib/socketService";
import { queryClient } from "@/core/lib/queryClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { messagesQueryKey } from "@/features/home/hooks/useMessages";
import {
  ParticipantPresence,
  TypingUser,
  useSocketStore,
} from "@/core/store/socketStore";
import { useCallback, useEffect, useRef } from "react";

interface UseConversationRealtimeResult {
  /** Current presence of each participant */
  participants: ParticipantPresence[];
  /** Users currently typing */
  typingUsers: TypingUser[];
  /** Emit typing.start to the server */
  startTyping: () => void;
  /** Emit typing.stop to the server */
  stopTyping: () => void;
}

const EMPTY_PARTICIPANTS: ParticipantPresence[] = [];
const EMPTY_TYPING: TypingUser[] = [];

/**
 * Subscribe to real-time presence and typing for a single conversation.
 *
 * Automatically binds subscription ownership to connection readiness and
 * reconnect identity (connectionEpoch). When the socket becomes connected or
 * reconnects after network recovery, it restores subscriptions and fetches
 * missed message history.
 */
export function useConversationRealtime(
  conversationId: string | undefined
): UseConversationRealtimeResult {
  const connected = useSocketStore((s) => s.connected);
  const connectionEpoch = useSocketStore((s) => s.connectionEpoch);
  const subscribeConversation = useSocketStore((s) => s.subscribeConversation);
  const unsubscribeConversation = useSocketStore(
    (s) => s.unsubscribeConversation
  );

  const participants = useSocketStore(
    (s) =>
      conversationId
        ? (s.conversations[conversationId]?.participants ?? EMPTY_PARTICIPANTS)
        : EMPTY_PARTICIPANTS
  );

  // Expire typing based on server deadline (expiresAt)
  const typingUsers = useSocketStore((s) => {
    if (!conversationId) return EMPTY_TYPING;
    const now = Date.now();
    return (s.conversations[conversationId]?.typing ?? EMPTY_TYPING).filter(
      (t) => new Date(t.expiresAt).getTime() > now
    );
  });

  // Sweep expired typing timers every second while mounted
  useEffect(() => {
    const sweep = setInterval(() => {
      useSocketStore.getState().cleanExpiredTyping();
    }, 1_000);
    return () => clearInterval(sweep);
  }, []);

  // Track subscription ownership
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !connected) {
      subscribedRef.current = false;
      return;
    }

    let cancelled = false;

    const subscribe = async () => {
      const ack = await socketService.emit("presence.subscribe", {
        conversationId,
      });
      if (cancelled) return;
      if (ack.ok && ack.data) {
        const data = ack.data as {
          participants: ParticipantPresence[];
          typing: TypingUser[];
        };
        subscribeConversation(conversationId, {
          participants: data.participants ?? [],
          typing: data.typing ?? [],
        });
        subscribedRef.current = true;

        // Catch-up: fetch any messages missed while disconnected or reconnecting
        const userId = useAuthStore.getState().user?.id ?? "";
        if (userId) {
          queryClient.invalidateQueries({
            queryKey: messagesQueryKey(userId, conversationId),
          });
        }
      }
    };

    void subscribe();

    return () => {
      cancelled = true;
      if (subscribedRef.current) {
        socketService.emit("presence.unsubscribe", { conversationId });
        unsubscribeConversation(conversationId);
        subscribedRef.current = false;
      }
    };
  }, [conversationId, connected, connectionEpoch, subscribeConversation, unsubscribeConversation]);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    socketService.emit("typing.start", { conversationId });
    // Refresh every 3 s while still typing (server expires at 5 s)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
    }, 3_000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    socketService.emit("typing.stop", { conversationId });
  }, [conversationId]);

  return { participants, typingUsers, startTyping, stopTyping };
}
