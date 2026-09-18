import { apiRequest } from "@/core/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface Message {
  id: string;
  conversationId: string;
  clientMessageId: string;
  senderId: string;
  kind: "text" | "image" | "file";
  text: string;
  createdAt: string;
}

interface MessagesResponse {
  items: Message[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

export function useMessages(conversationId: string) {
  return useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await apiRequest<MessagesResponse | Message[]>(
        `/conversations/${conversationId}/messages`
      );
      if (Array.isArray(res)) return res;
      if (res && "items" in res && Array.isArray(res.items)) {
        return res.items;
      }
      return [];
    },
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}
