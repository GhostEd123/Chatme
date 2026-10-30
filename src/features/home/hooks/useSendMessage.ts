import { apiRequest } from "@/core/lib/apiClient";
import { queryClient } from "@/core/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Message } from "./useMessages";
import { upsertMessageInCache, markMessageFailed } from "../utils/messageReconcile";

/** Generate a UUID v4 string */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface SendMessageInput {
  conversationId: string;
  text: string;
  /** Pre-generated clientMessageId — pass the same ID on retry */
  clientMessageId?: string;
}

type SendMessageMutationInput = SendMessageInput & { _clientMessageId: string };

export function useSendMessage() {
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  return useMutation<Message, Error, SendMessageMutationInput>({
    mutationFn: ({ conversationId, text, _clientMessageId }) =>
      apiRequest<Message>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { clientMessageId: _clientMessageId, text },
      }),
    onMutate: async ({ conversationId, text, _clientMessageId }) => {
      // Create an optimistic message
      const optimistic: Message = {
        id: `optimistic-${_clientMessageId}`,
        conversationId,
        clientMessageId: _clientMessageId,
        senderId: currentUserId,
        kind: "text",
        text,
        createdAt: new Date().toISOString(),
        status: "sending",
        _pendingText: text,
      };
      upsertMessageInCache(conversationId, optimistic);
      return { optimistic };
    },
    onSuccess: (serverMessage, { conversationId }) => {
      // Replace the optimistic message with the real server message
      upsertMessageInCache(conversationId, { ...serverMessage, status: "sent" });
      // Refresh conversation list preview
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_err, { conversationId, _clientMessageId }) => {
      // Mark the optimistic message as failed
      markMessageFailed(conversationId, _clientMessageId);
    },
  });
}

/**
 * Helper: create a send payload with a stable clientMessageId.
 * Call this once when the user taps send, then pass the result to useSendMessage.mutate.
 */
export function createSendPayload(
  conversationId: string,
  text: string,
  clientMessageId?: string
): SendMessageInput & { _clientMessageId: string } {
  const id = clientMessageId ?? generateId();
  return { conversationId, text, clientMessageId: id, _clientMessageId: id };
}
