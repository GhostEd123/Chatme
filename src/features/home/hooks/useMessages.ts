import { apiRequest } from "@/core/lib/apiClient";
import { useInfiniteQuery } from "@tanstack/react-query";

// ── Message kinds ─────────────────────────────────────────────────────────────

export type MessageKind = "text" | "image" | "file" | "audio" | "video" | "document";

export interface MessageAttachment {
  id: string;
  kind: string;
  url: string;
  mimeType?: string;
  fileName?: string;
  size?: number;
}

/** Status of an optimistic (locally-created) message */
export type MessageStatus = "sending" | "sent" | "failed" | "delivered" | "read";

export interface Message {
  id: string;
  conversationId: string;
  clientMessageId: string;
  senderId: string;
  kind: MessageKind;
  text: string | null;
  attachments?: MessageAttachment[];
  createdAt: string;
  /** Only present on locally-optimistic messages */
  status?: MessageStatus;
  /** For optimistic messages: the text to retry with */
  _pendingText?: string;
}

export interface MessagesResponse {
  items: Message[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

// ── Return type ───────────────────────────────────────────────────────────────

interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
  nextCursor: string | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMessages(conversationId: string): UseMessagesResult {
  const result = useInfiniteQuery<MessagesResponse>({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/conversations/${conversationId}/messages?cursor=${pageParam}&limit=30`
        : `/conversations/${conversationId}/messages?limit=30`;
      const res = await apiRequest<MessagesResponse | Message[]>(url);
      if (Array.isArray(res)) {
        return { items: res, pageInfo: { nextCursor: null, hasNextPage: false } };
      }
      if (res && "items" in res) return res;
      return { items: [], pageInfo: { nextCursor: null, hasNextPage: false } };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pageInfo?.nextCursor ?? null,
    enabled: !!conversationId,
    staleTime: 10_000,
  });

  const messages = result.data?.pages.flatMap((p) => p.items) ?? [];
  const lastPage = result.data?.pages[result.data.pages.length - 1];

  return {
    messages,
    isLoading: result.isLoading,
    isError: result.isError,
    nextCursor: lastPage?.pageInfo?.nextCursor ?? null,
    hasNextPage: result.hasNextPage,
    fetchNextPage: result.fetchNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
  };
}
