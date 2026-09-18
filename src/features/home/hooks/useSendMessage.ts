import { apiRequest } from "@/core/lib/apiClient";
import { queryClient } from "@/core/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Message } from "./useMessages";

/** Generate a UUID v4 string */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


interface SendMessageInput {
  conversationId: string;
  text: string;
  /** Optional: pass a pre-generated clientMessageId for idempotency */
  clientMessageId?: string;
}

export function useSendMessage() {
  return useMutation<Message, Error, SendMessageInput>({
    mutationFn: ({ conversationId, text, clientMessageId }) =>
      apiRequest<Message>(
        `/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: {
            clientMessageId: clientMessageId ?? generateId(),
            text,
          },
        }
      ),
    onSuccess: (newMessage, variables) => {
      // Optimistically prepend to cached message list using the known conversationId (list is latest-first)
      queryClient.setQueryData<Message[]>(
        ["messages", variables.conversationId],
        (old) => (old ? [newMessage, ...old] : [newMessage])
      );
      // Refresh conversation list to update lastMessage
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
