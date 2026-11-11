import { queryClient } from "@/core/lib/queryClient";
import { socketService } from "@/core/lib/socketService";
import { storage } from "@/core/lib/storage";
import { useSocketStore } from "@/core/store/socketStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOutboxStore } from "@/features/home/store/outboxStore";
import { useDraftStore } from "@/features/home/store/draftStore";

/**
 * Unified terminal teardown for EVERY terminal auth outcome:
 * - Definitive refresh rejection (400, 401, 403)
 * - Stale session transition
 * - Explicit user logout
 *
 * Ensures Account A's queries, persisted snapshots, outbox items,
 * and realtime state can never leak into Account B's session.
 */
export async function performTerminalTeardown(): Promise<void> {
  // 1. Immediately disconnect realtime socket
  try {
    socketService.disconnect();
  } catch {}

  // 2. Bump session generation and clear auth state
  try {
    useAuthStore.getState().clearSession();
  } catch {}

  // 3. Cancel all in-flight queries and purge in-memory cache
  try {
    await queryClient.cancelQueries();
    queryClient.clear();
  } catch {}

  // 4. Remove the persisted query cache snapshot from disk (MMKV)
  try {
    storage.remove("REACT_QUERY_OFFLINE_CACHE");
  } catch {}

  // 5. Reset realtime socket store
  try {
    useSocketStore.setState({
      connected: false,
      conversations: {},
      incomingMessages: {},
    });
  } catch {}

  // 6. Purge account outbox
  try {
    useOutboxStore.getState().clearAll();
  } catch {}

  // 7. Clear persisted drafts
  try {
    useDraftStore.getState().clearAllDrafts();
  } catch {}
}
