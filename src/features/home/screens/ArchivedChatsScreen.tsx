import { useChatStore } from "@/features/home/store/chatStore";
import { usePinConversation, useArchiveConversation, useMuteConversation } from "@/features/home/hooks/useConversationSettings";
import { useArchivedConversations, getConversationDisplay } from "@/features/home/hooks/useConversations";
import { useAuthStore } from "@/features/auth/store/authStore";
import ChatListItemWidget from "@/shared/widgets/ChatListItemWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore, THEME_PALETTE } from "@/core/store/themeStore";

export default function ArchivedChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deleteChat } = useChatStore();
  const { mutate: pinChat } = usePinConversation();
  const { mutate: archiveChat } = useArchiveConversation();
  const { mutate: muteChat } = useMuteConversation();
  const { user } = useAuthStore();

  const activeTheme = useThemeStore((s) => s.theme);
  const primaryColor = THEME_PALETTE[activeTheme].primary;

  const { data: archivedConversations } = useArchivedConversations();
  const currentUserId = user?.id ?? "";

  const archivedChats = (archivedConversations ?? [])
    .map((conv) => {
      const { name, avatarUrl } = getConversationDisplay(conv, currentUserId);
      const latest = conv.latestMessage;
      return {
        id: conv.id,
        name,
        lastMessage: latest
          ? (latest.senderId === currentUserId ? `You: ${latest.preview}` : latest.preview)
          : "",
        timestamp: latest?.createdAt
          ? new Date(latest.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        unreadCount: conv.unreadCount,
        avatarUrl: avatarUrl ?? undefined,
        isPinned: conv.settings?.pinned ?? false,
        isMuted: conv.settings?.muted ?? false,
        isArchived: true,
      };
    });

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: primaryColor,
          paddingTop: insets.top + 8,
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Archived Chat</Text>
      </View>

      {/* ── List ─────────────────────────────────────────────────────── */}
      <FlatList
        data={archivedChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 64 }}
        renderItem={({ item }) => (
          <ChatListItemWidget
            chat={item}
            onPress={() => router.push(`/chats/${item.id}`)}
            onMute={() => muteChat({ id: item.id, mute: !item.isMuted })}
            onPin={() => pinChat({ id: item.id, pin: !item.isPinned })}
            onDelete={() => deleteChat(item.id)}
            // Unarchive on swipe
            onArchive={() => {
              archiveChat({ id: item.id, archive: false });
              if (archivedChats.length <= 1) router.back();
            }}
          />
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-24">
            <Feather name="archive" size={48} color="#6e8597" />
            <Text className="mt-4 text-body-lg font-display-bold text-foreground">
              No archived chats
            </Text>
            <Text className="mt-1 text-body-md text-muted">
              Swipe a chat and tap Archive to see it here
            </Text>
          </View>
        )}
      />
    </View>
  );
}
