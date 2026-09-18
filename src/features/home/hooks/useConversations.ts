import { apiRequest } from "@/core/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

// ── Real API shapes ────────────────────────────────────────────────────────────

export interface ConversationParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role?: string;
}

export interface ConversationSettings {
  archived: boolean;
  muted: boolean;
  pinned: boolean;
  favorited: boolean;
  archivedAt: string | null;
  mutedAt: string | null;
  mutedUntil: string | null;
  pinnedAt: string | null;
  favoritedAt: string | null;
  clearedAt: string | null;
  clearedThroughMessageId: string | null;
}

export interface LatestMessage {
  id: string;
  kind: string;
  preview: string;
  senderId: string;
  createdAt: string;
}

/** A direct conversation — has otherParticipant */
export interface DirectConversation {
  id: string;
  type: "direct";
  latestMessage: LatestMessage | null;
  unreadCount: number;
  settings: ConversationSettings;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  otherParticipant: ConversationParticipant;
}

/** A group conversation — has name, avatarUrl, participants[] */
export interface GroupConversation {
  id: string;
  type: "group";
  name: string;
  avatarUrl: string | null;
  latestMessage: LatestMessage | null;
  unreadCount: number;
  settings: ConversationSettings;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  role: "owner" | "admin" | "member";
}

export type Conversation = DirectConversation | GroupConversation;

interface ConversationsResponse {
  items: Conversation[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

// ── Helper ─────────────────────────────────────────────────────────────────────

/** Get the display name and avatar for the "other side" of any conversation. */
export function getConversationDisplay(
  conv: Conversation,
  currentUserId: string
): { name: string; avatarUrl: string | null } {
  if (conv.type === "direct") {
    return {
      name: conv.otherParticipant.displayName,
      avatarUrl: conv.otherParticipant.avatarUrl,
    };
  }
  // Group: use group name
  return { name: conv.name, avatarUrl: conv.avatarUrl };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await apiRequest<ConversationsResponse>("/conversations");
      // API returns { items: [], pageInfo: {} }
      return res?.items ?? [];
    },
    staleTime: 30_000,
  });
}
