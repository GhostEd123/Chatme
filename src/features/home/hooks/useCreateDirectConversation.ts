import { apiRequest } from "@/core/lib/apiClient";
import { useMutation } from "@tanstack/react-query";
import { Conversation } from "./useConversations";

export function useCreateDirectConversation() {
  return useMutation<Conversation, Error, { participantId: string }>({
    mutationFn: (input) =>
      apiRequest<Conversation>("/conversations/direct", {
        method: "POST",
        body: input,
      }),
  });
}
