import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOutboxStore, outboxEntryToMessage } from "@/features/home/store/outboxStore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// ── Message kinds (API contract: MessageResponseDto.kind) ────────────────────

export type MessageKind = "text" | "image" | "audio" | "video" | "document";

/** API contract: Message*AttachmentResponseDto */
export interface MessageAttachment {
  mediaId: string;
  type: "image" | "audio" | "video" | "document";
  contentType: string;
  sizeBytes: number;
  url: string;
  width?: number;
  height?: number;
  durationMs?: number;
  /** Present for documents */
  filename?: string;
}

/** Local delivery state. Server messages have no status (treated as sent). */
export type MessageStatus = "uploading" | "sending" | "sent" | "failed" | "delivered" | "read";

export interface Message {
  id: string;
  conversationId: string;
  clientMessageId: string;
  senderId: string;
  kind: MessageKind;
  text: string | null;
  attachments?: MessageAttachment[];
  createdAt: string;
  /** Only present on local (outbox) or locally-annotated messages */
  status?: MessageStatus;
  /** Human-readable reason for a failed local message */
  error?: string;
  /** For local attachment messages: on-device preview URI */
  localPreviewUri?: string;
  /** For local attachment messages: display name of the file */
  localFileName?: string;
}

export interface MessagesResponse {
  items: Message[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

/**
 * Account-scoped query key for a conversation's message history.
 * Including userId guarantees two accounts that share a group never reuse each
 * other's cached history (in memory or in the persisted query cache).
 */
export function messagesQueryKey(userId: string, conversationId: string) {
  return ["messages", userId, conversationId] as const;
}

// ── Return type ───────────────────────────────────────────────────────────────

interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  nextCursor: string | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMessages(conversationId: string): UseMessagesResult {
  const userId = useAuthStore((s) => s.user?.id ?? "");

  const result = useInfiniteQuery<MessagesResponse>({
    queryKey: messagesQueryKey(userId, conversationId),
    queryFn: async ({ pageParam, signal }) => {
      const url = pageParam
        ? `/conversations/${conversationId}/messages?cursor=${encodeURIComponent(String(pageParam))}&limit=30`
        : `/conversations/${conversationId}/messages?limit=30`;
      const res = await apiRequest<MessagesResponse | Message[]>(url, { signal });
      if (Array.isArray(res)) {
        return { items: res, pageInfo: { nextCursor: null, hasNextPage: false } };
      }
      if (res && "items" in res) return res;
      return { items: [], pageInfo: { nextCursor: null, hasNextPage: false } };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pageInfo?.nextCursor ?? null,
    enabled: !!conversationId && !!userId,
    staleTime: 10_000,
  });

  // Unsent / failed messages live in the persisted outbox (survives refetch,
  // navigation and restart). Merge them in front of server history, skipping
  // any the server already has (matched by clientMessageId).
  const outboxEntries = useOutboxStore((s) => s.entries);

  const serverMessages = useMemo(
    () => result.data?.pages.flatMap((p) => p.items) ?? [],
    [result.data]
  );

  const messages = useMemo(() => {
    const serverClientIds = new Set(serverMessages.map((m) => m.clientMessageId));
    const local = Object.values(outboxEntries)
      .filter(
        (e) =>
          e.userId === userId &&
          e.conversationId === conversationId &&
          !serverClientIds.has(e.clientMessageId)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(outboxEntryToMessage);
    return [...local, ...serverMessages];
  }, [outboxEntries, serverMessages, userId, conversationId]);

  const lastPage = result.data?.pages[result.data.pages.length - 1];

  return {
    messages,
    isLoading: result.isLoading,
    isError: result.isError,
    refetch: result.refetch,
    nextCursor: lastPage?.pageInfo?.nextCursor ?? null,
    hasNextPage: result.hasNextPage,
    fetchNextPage: result.fetchNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
  };
}
