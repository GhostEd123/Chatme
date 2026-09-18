import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { socketService } from "@/core/lib/socketService";
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
      socketService.disconnect();
      clearSession();
    },
  });
}
