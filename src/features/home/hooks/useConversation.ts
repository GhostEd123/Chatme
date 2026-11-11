import { apiRequest } from "@/core/lib/apiClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Conversation } from "./useConversations";

export function conversationQueryKey(userId: string, conversationId: string | undefined) {
  return ["conversation", userId, conversationId] as const;
}

export function useConversation(conversationId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id ?? "");

  return useQuery<Conversation>({
    queryKey: conversationQueryKey(userId, conversationId),
    queryFn: ({ signal }) =>
      apiRequest<Conversation>(`/conversations/${conversationId}`, { signal }),
    enabled: !!conversationId && !!userId,
    staleTime: 60_000,
  });
}
