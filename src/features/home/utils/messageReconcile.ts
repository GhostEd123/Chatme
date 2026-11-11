import { queryClient } from "@/core/lib/queryClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { InfiniteData } from "@tanstack/react-query";
import {
  messagesQueryKey,
  type Message,
  type MessagesResponse,
} from "../hooks/useMessages";

/**
 * Upserts a message into the account-scoped infinite query cache for a
 * conversation. This is the ONE reconciliation path used by the send-response
 * handler, socket `message.created` events and retries.
 *
 * Matches by server `id` or `clientMessageId`, so whichever of the HTTP
 * response / socket echo arrives first, the other merges into the same entry.
 * If not found, prepends to the first page (newest-first ordering).
 *
 * @param userId account that owns the cache entry. Defaults to the current
 *   user; pass it explicitly from async work that captured it earlier so a
 *   late result can never land in another account's cache.
 */
export function upsertMessageInCache(
  conversationId: string,
  message: Message,
  userId: string = useAuthStore.getState().user?.id ?? ""
): void {
  if (!userId) return;
  queryClient.setQueryData<InfiniteData<MessagesResponse>>(
    messagesQueryKey(userId, conversationId),
    (old) => {
      if (!old || old.pages.length === 0) {
        // No history loaded yet — let the next fetch populate it rather than
        // seeding a fake single-page history.
        return old;
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
            return { ...existing, ...message };
          }
          return existing;
        });
        return { ...page, items: newItems };
      });

      if (!found) {
        const [firstPage, ...rest] = newPages;
        return {
          ...old,
          pages: [{ ...firstPage, items: [message, ...firstPage.items] }, ...rest],
        };
      }

      return { ...old, pages: newPages };
    }
  );
}
