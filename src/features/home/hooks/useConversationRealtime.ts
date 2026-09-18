import { socketService } from "@/core/lib/socketService";
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
 * Automatically emits `presence.subscribe` on mount and
 * `presence.unsubscribe` on unmount.
 */
export function useConversationRealtime(
  conversationId: string | undefined
): UseConversationRealtimeResult {
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

  const typingUsers = useSocketStore(
    (s) =>
      conversationId
        ? (s.conversations[conversationId]?.typing ?? EMPTY_TYPING)
        : EMPTY_TYPING
  );

  // Track whether we've already subscribed so we don't double-subscribe
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!conversationId) return;

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
      }
    };

    subscribe();

    return () => {
      cancelled = true;
      if (subscribedRef.current) {
        socketService.emit("presence.unsubscribe", { conversationId });
        unsubscribeConversation(conversationId);
        subscribedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

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
