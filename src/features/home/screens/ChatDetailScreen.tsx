import AvatarWidget from "@/shared/widgets/AvatarWidget";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useConversation } from "@/features/home/hooks/useConversation";
import { useMessages } from "@/features/home/hooks/useMessages";
import { useSendMessage } from "@/features/home/hooks/useSendMessage";
import { useMarkDelivered, useMarkRead } from "@/features/home/hooks/useReceipts";
import { useConversationRealtime } from "@/features/home/hooks/useConversationRealtime";
import { useSocketStore } from "@/core/store/socketStore";
import { queryClient } from "@/core/lib/queryClient";
import Feather from "@expo/vector-icons/Feather";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Asset,
  AssetField,
  MediaType,
  Query,
  requestPermissionsAsync as requestMediaPermissionsAsync,
} from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

// ── Menu action type ──────────────────────────────────────────────────────────
interface MediaMenuAction {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  const [message, setMessage] = useState("");
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [recentPhotos, setRecentPhotos] = useState<
    { id: string; uri: string }[]
  >([]);
  const [mediaPermission, setMediaPermission] = useState(false);
  const listRef = useRef<FlatList>(null);

  // ── API hooks ──
  const {
    data: serverMessages = [],
    isLoading: messagesLoading,
  } = useMessages(conversationId ?? "");

  const sendMessage = useSendMessage();
  const markDelivered = useMarkDelivered();
  const markRead = useMarkRead();

  // ── Conversation metadata (name, avatar) ──
  const { data: conversation } = useConversation(conversationId);
  const otherParticipantMeta =
    conversation?.type === "direct" ? conversation.otherParticipant : null;
  const conversationName =
    conversation?.type === "direct"
      ? conversation.otherParticipant.displayName
      : conversation?.type === "group"
      ? conversation.name
      : "Chat";

  // ── Real-time ──
  const { typingUsers, participants, startTyping, stopTyping } = useConversationRealtime(conversationId);

  // Incoming socket messages — merge into cache
  const incomingMessages = useSocketStore((s) =>
    conversationId ? s.incomingMessages[conversationId] : undefined
  );
  const clearIncoming = useSocketStore((s) => s.clearIncomingMessages);

  useEffect(() => {
    if (!incomingMessages || incomingMessages.length === 0) return;
    // Append socket events to the React Query cache
    queryClient.setQueryData<typeof serverMessages>(
      ["messages", conversationId],
      (old) => {
        const existing = old ?? [];
        const existingIds = new Set(existing.map((m) => m.id));
        const novel = incomingMessages.filter((m) => !existingIds.has(m.id));
        if (novel.length === 0) return old;
        const novelMapped = novel.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          clientMessageId: m.clientMessageId,
          senderId: m.senderId,
          kind: m.kind as "text",
          text: m.text,
          createdAt: m.createdAt,
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return [...novelMapped, ...existing];
      }
    );
    clearIncoming(conversationId!);
  }, [incomingMessages, conversationId, clearIncoming]);

  // Auto-mark delivered and read when new messages arrive from others
  useEffect(() => {
    const incoming = serverMessages.filter((m) => m.senderId !== currentUserId);
    if (incoming.length === 0) return;
    const lastId = incoming[0].id;
    if (conversationId) {
      markDelivered.mutate({ conversationId, throughMessageId: lastId });
      markRead.mutate({ conversationId, throughMessageId: lastId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMessages.length]);

  // Scroll to latest message when messages update
  useEffect(() => {
    if (serverMessages.length > 0) {
      setTimeout(
        () => listRef.current?.scrollToOffset({ offset: 0, animated: true }),
        100
      );
    }
  }, [serverMessages.length]);

  const panelAnim = useRef(new Animated.Value(0)).current;

  // ── Load recent photos (new v57 Query API) ──
  useEffect(() => {
    (async () => {
      const { status } = await requestMediaPermissionsAsync();
      if (status === "granted") {
        setMediaPermission(true);
        try {
          const assets: Asset[] = await new Query()
            .limit(10)
            .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
            .exe();
          const withUris = await Promise.all(
            assets.map(async (a) => ({ id: a.id, uri: await a.getUri() }))
          );
          setRecentPhotos(withUris);
        } catch {}
      }
    })();
  }, []);

  // ── Animate panel ──
  const openPanel = () => {
    setShowMediaPanel(true);
    Animated.spring(panelAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowMediaPanel(false));
  };

  const togglePanel = () => {
    if (showMediaPanel) {
      closePanel();
    } else {
      openPanel();
    }
  };

  // ── Send ──
  const handleSend = () => {
    if (!message.trim() || !conversationId) return;
    const text = message.trim();
    setMessage("");
    sendMessage.mutate({ conversationId, text });
  };

  // ── Typing (from realtime hook above) ──
  const handleTextChange = (text: string) => {
    setMessage(text);
    if (text.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // ── Menu actions ──
  const menuActions: MediaMenuAction[] = [
    {
      icon: "image",
      label: "Photo or Gallery",
      onPress: async () => {
        closePanel();
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow photo access.");
          return;
        }
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images", "videos"],
          allowsEditing: false,
          quality: 0.9,
        });
      },
    },
    {
      icon: "file-text",
      label: "Document",
      onPress: async () => {
        closePanel();
        await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
      },
    },
    {
      icon: "map-pin",
      label: "Location",
      onPress: () => {
        closePanel();
        Alert.alert("Location", "Location sharing coming soon!");
      },
    },
    {
      icon: "user",
      label: "Contact",
      onPress: () => {
        closePanel();
        router.push("/chats/new");
      },
    },
  ];

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 0],
  });

  // ── Conversation header info from participants ──
  const otherParticipant = participants.find((p) => p.userId !== currentUserId);
  const isOtherOnline = otherParticipant?.status === "online";
  const typingOthers = typingUsers.filter((t) => t.userId !== currentUserId);
  const isOtherTyping = typingOthers.length > 0;

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View
        className="px-4 pb-4 flex-row items-center bg-primary-400 dark:bg-surface"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <AvatarWidget
          url={otherParticipantMeta?.avatarUrl ?? undefined}
          size={40}
          isOnline={isOtherOnline}
        />
        <View className="ml-3 flex-1">
          <Text className="text-body-lg font-display-bold text-white">
            {conversationName}
          </Text>
          <Text className="text-body-sm text-white/80">
            {isOtherTyping
              ? "typing…"
              : isOtherOnline
              ? "Online"
              : "Offline"}
          </Text>
        </View>
        <TouchableOpacity className="mr-5">
          <Feather name="video" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Feather name="phone" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      {messagesLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#57b77d" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={serverMessages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUserId;
            // Added log as requested
            console.log("ChatDetailScreen Render Message:", { senderId: item.senderId, currentUserId, isMe, text: item.text });
            const time = new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <View
                className={`mb-4 max-w-[78%] ${isMe ? "self-end" : "self-start"}`}
              >
                <View
                  className={`px-4 py-3 rounded-2xl ${
                    isMe
                      ? "bg-primary-400 rounded-tr-sm"
                      : "bg-surface border border-border/50 rounded-tl-sm"
                  }`}
                >
                  <Text
                    className={`text-body-md font-display-medium ${
                      isMe ? "text-white" : "text-foreground"
                    }`}
                  >
                    {item.text}
                  </Text>
                </View>
                <View
                  className={`flex-row items-center mt-1 gap-1 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <Text className="text-body-xs text-muted">{time}</Text>
                  {isMe && (
                    <Feather name="check-circle" size={11} color="#57b77d" />
                  )}
                </View>
              </View>
            );
          }}
          ListHeaderComponent={
            isOtherTyping ? (
              <View className="self-start bg-surface border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 mb-4 mt-2">
                <View className="flex-row gap-1 items-center">
                  <View className="w-2 h-2 rounded-full bg-muted animate-bounce" />
                  <View className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                  <View className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* ── Input bar + media panel ── */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        {/* Media panel */}
        {showMediaPanel && (
          <Animated.View
            style={{
              transform: [{ translateY: panelTranslateY }],
              opacity: panelAnim,
            }}
            className="bg-white dark:bg-surface border-t border-border/50 mx-3 mb-2 rounded-3xl overflow-hidden"
            pointerEvents="box-none"
          >
            {/* Photo strip */}
            {mediaPermission && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="border-b border-border/30"
                contentContainerStyle={{ padding: 10, gap: 8 }}
              >
                {/* Camera shortcut */}
                <TouchableOpacity
                  onPress={async () => {
                    closePanel();
                    const { status } =
                      await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== "granted") return;
                    await ImagePicker.launchCameraAsync({ quality: 0.9 });
                  }}
                  className="w-20 h-20 rounded-2xl bg-neutral-100 items-center justify-center border border-border/30 overflow-hidden"
                >
                  <Feather name="camera" size={24} color="#57b77d" />
                </TouchableOpacity>

                {/* Recent photos */}
                {recentPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    className="w-20 h-20 rounded-2xl overflow-hidden"
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={{ width: 80, height: 80 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}

                {/* Placeholder tiles if no photos */}
                {recentPhotos.length === 0 &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <View
                      key={i}
                      className="w-20 h-20 rounded-2xl bg-neutral-100 border border-border/20"
                    />
                  ))}
              </ScrollView>
            )}

            {/* Menu options */}
            <View className="py-2">
              {menuActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                  className="flex-row items-center px-5 py-3.5"
                >
                  <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-4">
                    <Feather name={action.icon} size={18} color="#57b77d" />
                  </View>
                  <Text className="text-body-lg font-display-medium text-foreground">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Text input bar */}
        <View
          className="px-4 py-3 bg-surface border-t border-border/50 flex-row items-end"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <TouchableOpacity onPress={togglePanel} className="mr-3 mb-2">
            <Feather
              name={showMediaPanel ? "x-circle" : "paperclip"}
              size={22}
              color={showMediaPanel ? "#57b77d" : "#6e8597"}
            />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-end bg-background rounded-3xl px-4 min-h-[40px] border border-border">
            <TextInput
              className="flex-1 text-body-md text-foreground"
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={handleTextChange}
              onBlur={stopTyping}
              multiline
              style={{
                paddingTop: Platform.OS === "ios" ? 10 : 8,
                paddingBottom: Platform.OS === "ios" ? 10 : 8,
                maxHeight: 120,
              }}
              onFocus={() => {
                if (showMediaPanel) closePanel();
              }}
            />
            <TouchableOpacity className="ml-2 mb-2">
              <Feather name="smile" size={20} color="#6e8597" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={sendMessage.isPending}
            className="ml-3 mb-1 w-10 h-10 bg-primary-400 rounded-full items-center justify-center"
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather
                name={message.trim() ? "send" : "mic"}
                size={18}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>
    </View>
  );
}
