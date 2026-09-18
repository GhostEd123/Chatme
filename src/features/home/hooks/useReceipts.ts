import { apiRequest } from "@/core/lib/apiClient";
import { queryClient } from "@/core/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface ReceiptInput {
  conversationId: string;
  throughMessageId: string;
}

export function useMarkDelivered() {
  return useMutation<void, Error, ReceiptInput>({
    mutationFn: ({ conversationId, throughMessageId }) =>
      apiRequest(`/conversations/${conversationId}/receipts/delivered`, {
        method: "PUT",
        body: { throughMessageId },
      }),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useMarkRead() {
  return useMutation<void, Error, ReceiptInput>({
    mutationFn: ({ conversationId, throughMessageId }) =>
      apiRequest(`/conversations/${conversationId}/receipts/read`, {
        method: "PUT",
        body: { throughMessageId },
      }),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}
