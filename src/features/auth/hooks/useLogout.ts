import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { socketService } from "@/core/lib/socketService";
import { queryClient } from "@/core/lib/queryClient";
import { storage } from "@/core/lib/storage";
import { useSocketStore } from "@/core/store/socketStore";
import { useOutboxStore } from "@/features/home/store/outboxStore";
import { useMutation } from "@tanstack/react-query";

/**
 * Logout ends the local session immediately and revokes the refresh token on
 * the server best-effort. Local teardown never waits on the network.
 */
export function useLogout() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      // Capture credentials *at call time* (not at hook render time).
      const { refreshToken, accessToken } = useAuthStore.getState();

      // 1. Stop realtime first so no reconnect loop or event handler can run
      //    for this session after this point.
      socketService.disconnect();

      // 2. End the session — this bumps the session generation, so any
      //    in-flight token refresh / reconnect / upload from this account
      //    discards its result.
      useAuthStore.getState().clearSession();

      // 3. Cancel + clear all React Query caches (memory)
      await queryClient.cancelQueries();
      queryClient.clear();

      // 4. Remove the persisted query cache from MMKV
      storage.remove("REACT_QUERY_OFFLINE_CACHE");

      // 5. Reset realtime socket store state and the account's outbox
      useSocketStore.setState({
        connected: false,
        conversations: {},
        incomingMessages: {},
      });
      useOutboxStore.getState().clearAll();

      // 6. Best-effort server revocation, fire-and-forget with a short
      //    timeout. Uses the captured token explicitly because the store is
      //    already cleared.
      if (refreshToken) {
        apiRequest("/auth/logout", {
          method: "POST",
          body: { refreshToken },
          skipAuth: true,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          timeoutMs: 5_000,
        }).catch(() => {});
      }
    },
  });
}
