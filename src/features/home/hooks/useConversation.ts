import { apiRequest } from "@/core/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Conversation } from "./useConversations";

export function useConversation(conversationId: string | undefined) {
  return useQuery<Conversation>({
    queryKey: ["conversation", conversationId],
    queryFn: () =>
      apiRequest<Conversation>(`/conversations/${conversationId}`),
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}
