import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: boolean }) => {
      if (pin) {
        return apiRequest(`/conversations/${id}/pin`, { method: "PUT" });
      } else {
        return apiRequest(`/conversations/${id}/pin`, { method: "DELETE" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["archivedConversations"] });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      if (archive) {
        return apiRequest(`/conversations/${id}/archive`, { method: "PUT" });
      } else {
        return apiRequest(`/conversations/${id}/archive`, { method: "DELETE" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["archivedConversations"] });
    },
  });
}

export function useMuteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mute }: { id: string; mute: boolean }) => {
      if (mute) {
        return apiRequest(`/conversations/${id}/mute`, {
          method: "PUT",
          body: { duration: "8_hours" },
        });
      } else {
        return apiRequest(`/conversations/${id}/mute`, { method: "DELETE" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["archivedConversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? "");

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiRequest(`/conversations/${id}`, { method: "DELETE" });
    },
    onSuccess: (_data, { id }) => {
      // Optimistically remove from the conversations list
      queryClient.setQueryData<import("@/features/home/hooks/useConversations").Conversation[]>(
        ["conversations", userId],
        (old) => (old ? old.filter((c) => c.id !== id) : old)
      );
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      queryClient.invalidateQueries({ queryKey: ["archivedConversations", userId] });
    },
    onError: (err: Error) => {
     
      throw err;
    },
  });
}
