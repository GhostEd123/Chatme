import { queryClient } from "@/core/lib/queryClient";
import type { InfiniteData } from "@tanstack/react-query";
import type { Message, MessagesResponse } from "../hooks/useMessages";

/**
 * Upserts a message into the infinite query cache for a conversation.
 * Matches by `id` (server ID) or `clientMessageId`.
 * If found, updates the existing entry. If not found, prepends to the first page.
 * Maintains latest-first ordering within each page.
 */
export function upsertMessageInCache(
  conversationId: string,
  message: Message
): void {
  queryClient.setQueryData<InfiniteData<MessagesResponse>>(
    ["messages", conversationId],
    (old) => {
      if (!old) {
        return {
          pages: [
            {
              items: [message],
              pageInfo: { nextCursor: null, hasNextPage: false },
            },
          ],
          pageParams: [null],
        };
      }

      let found = false;
      const newPages = old.pages.map((page) => {
        const newItems = page.items.map((existing) => {
          const matchById = !!message.id && existing.id === message.id;
          const matchByClientId =
            !!existing.clientMessageId &&
            !!message.clientMessageId &&
            existing.clientMessageId === message.clientMessageId;
          if (matchById || matchByClientId) {
            found = true;
            // Merge: server data wins over optimistic, but preserve status
            return { ...existing, ...message };
          }
          return existing;
        });
        return { ...page, items: newItems };
      });

      if (!found) {
        // Prepend to first page (latest-first ordering)
        const [firstPage, ...rest] = newPages;
        return {
          ...old,
          pages: [
            { ...firstPage, items: [message, ...firstPage.items] },
            ...rest,
          ],
        };
      }

      return { ...old, pages: newPages };
    }
  );
}

/**
 * Mark a message by clientMessageId as failed in the cache.
 */
export function markMessageFailed(
  conversationId: string,
  clientMessageId: string
): void {
  queryClient.setQueryData<InfiniteData<MessagesResponse>>(
    ["messages", conversationId],
    (old) => {
      if (!old) return old;
      const newPages = old.pages.map((page) => ({
        ...page,
        items: page.items.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, status: "failed" as const }
            : m
        ),
      }));
      return { ...old, pages: newPages };
    }
  );
}
