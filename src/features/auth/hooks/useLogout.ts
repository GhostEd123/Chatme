import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { performTerminalTeardown } from "@/core/lib/sessionTeardown";
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

      // Perform complete local teardown (realtime, auth store, query cache, MMKV snapshot, outbox)
      await performTerminalTeardown();

      // Best-effort server revocation, fire-and-forget with a short timeout.
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
