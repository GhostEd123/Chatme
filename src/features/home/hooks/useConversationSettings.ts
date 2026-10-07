import { apiRequest } from "@/core/lib/apiClient";
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
