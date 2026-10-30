import { apiRequest } from "@/core/lib/apiClient";
import { bumpSessionGeneration } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { socketService } from "@/core/lib/socketService";
import { queryClient } from "@/core/lib/queryClient";
import { storage } from "@/core/lib/storage";
import { useSocketStore } from "@/core/store/socketStore";
import { useMutation } from "@tanstack/react-query";

export function useLogout() {
  const { refreshToken, clearSession } = useAuthStore.getState();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (refreshToken) {
        // Best-effort — don't block logout if request fails
        await apiRequest("/auth/logout", {
          method: "POST",
          body: { refreshToken },
        }).catch(() => {});
      }
    },
    onSettled: () => {
      // 1. Disconnect socket
      socketService.disconnect();

      // 2. Bump session generation — discards any in-flight token refresh
      bumpSessionGeneration();

      // 3. Clear auth session
      clearSession();

      // 4. Cancel + clear all React Query caches (memory)
      queryClient.cancelQueries();
      queryClient.clear();
      queryClient.getQueryCache().clear();

      // 5. Remove the persisted query cache from MMKV
      storage.delete("REACT_QUERY_OFFLINE_CACHE");

      // 6. Reset realtime socket store state
      useSocketStore.setState({
        connected: false,
        conversations: {},
        incomingMessages: {},
      });
    },
  });
}
