import AvatarWidget from "@/shared/widgets/AvatarWidget";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useConversation } from "@/features/home/hooks/useConversation";
import { useMessages } from "@/features/home/hooks/useMessages";
import { useSendMessage } from "@/features/home/hooks/useSendMessage";
import { useMarkDelivered, useMarkRead } from "@/features/home/hooks/useReceipts";
import { useConversationRealtime } from "@/features/home/hooks/useConversationRealtime";
import { useSocketStore } from "@/core/store/socketStore";
import { upsertMessageInCache } from "@/features/home/utils/messageReconcile";
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
import type { Message } from "@/features/home/hooks/useMessages";

const StyledFeather = withUniwind(Feather);

// ── Types ─────────────────────────────────────────────────────────────────────
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
  const [recentPhotos, setRecentPhotos] = useState<{ id: string; uri: string }[]>([]);
  const [mediaPermission, setMediaPermission] = useState(false);
  const listRef = useRef<FlatList>(null);

  // ── API hooks ──
  const {
    messages,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
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
  const { typingUsers, participants, startTyping, stopTyping } =
    useConversationRealtime(conversationId);

  // Incoming socket messages — merge into cache
  const incomingMessages = useSocketStore((s) =>
    conversationId ? s.incomingMessages[conversationId] : undefined
  );
  const clearIncoming = useSocketStore((s) => s.clearIncomingMessages);

  useEffect(() => {
    if (!incomingMessages || incomingMessages.length === 0) return;
    incomingMessages.forEach((m) => {
      upsertMessageInCache(conversationId!, {
        id: m.id,
        conversationId: m.conversationId,
        clientMessageId: m.clientMessageId,
        senderId: m.senderId,
        kind: (m.kind as Message["kind"]) || "text",
        text: m.text ?? null,
        createdAt: m.createdAt,
        status: "delivered",
      });
    });
    clearIncoming(conversationId!);
  }, [incomingMessages, conversationId, clearIncoming]);

  // Auto-mark delivered and read when new messages arrive from others
  useEffect(() => {
    const incoming = messages.filter(
      (m) => m.senderId !== currentUserId && !!conversationId
    );
    if (incoming.length === 0 || !conversationId) return;
    const lastId = incoming[0].id;
    markDelivered.mutate({ conversationId, throughMessageId: lastId });
    markRead.mutate({ conversationId, throughMessageId: lastId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversationId]);

  // Scroll to latest message when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => listRef.current?.scrollToOffset({ offset: 0, animated: true }),
        100
      );
    }
  }, [messages.length]);

  const panelAnim = useRef(new Animated.Value(0)).current;

  // ── Load recent photos when panel opens ──
  const loadRecentPhotos = async () => {
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
  };

  // ── Animate panel ──
  const openPanel = () => {
    loadRecentPhotos();
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

  // ── Send text ──
  const handleSend = () => {
    if (!message.trim() || !conversationId) return;
    const text = message.trim();
    setMessage("");
    sendMessage.send({ conversationId, text });
  };

  // ── Retry ──
  const handleRetry = (item: Message) => {
    if (!item.clientMessageId) return;
    sendMessage.retry(item.clientMessageId);
  };

  // ── Typing ──
  const handleTextChange = (text: string) => {
    setMessage(text);
    if (text.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // ── Pick and send image ──
  const handlePickImage = async () => {
    closePanel();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo access in Settings.",
        [{ text: "OK" }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0 || !conversationId) return;

    const asset = result.assets[0];
    sendMessage.send({
      conversationId,
      file: {
        uri: asset.uri,
        contentType: asset.mimeType ?? "image/jpeg",
        sizeBytes: asset.fileSize ?? 1024,
        fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.type === "video" ? "video" : "image",
      },
    });
  };

  // ── Pick and send document ──
  const handlePickDocument = async () => {
    closePanel();
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0 || !conversationId) return;

    const asset = result.assets[0];
    sendMessage.send({
      conversationId,
      file: {
        uri: asset.uri,
        contentType: asset.mimeType ?? "application/octet-stream",
        sizeBytes: asset.size ?? 1024,
        fileName: asset.name ?? `doc_${Date.now()}`,
        type: "document",
      },
    });
  };

  // ── Menu actions ──
  const menuActions: MediaMenuAction[] = [
    {
      icon: "image",
      label: "Photo or Gallery",
      onPress: handlePickImage,
    },
    {
      icon: "file-text",
      label: "Document",
      onPress: handlePickDocument,
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
        <TouchableOpacity
          className="mr-5"
          accessibilityLabel="Start video call"
          accessibilityRole="button"
        >
          <Feather name="video" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Start voice call"
          accessibilityRole="button"
        >
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
          data={messages}
          inverted
          keyExtractor={(item) => item.clientMessageId || item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUserId;
            const isFailed = item.status === "failed";
            const isUploading = item.status === "uploading";
            const time = item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            const imageUri =
              item.localPreviewUri ||
              item.attachments?.find((a: any) => a.type === "image")?.url;
            const isDoc = item.kind === "document";

            return (
              <View
                className={`mb-4 max-w-[78%] ${isMe ? "self-end" : "self-start"}`}
                accessible
                accessibilityLabel={`${isMe ? "You" : conversationName}: ${item.text ?? (imageUri ? "Photo" : isDoc ? "Document" : "")}, sent at ${time}${isFailed ? ", failed to send" : ""}`}
              >
                <View
                  className={`px-4 py-3 rounded-2xl ${
                    isMe
                      ? isFailed
                        ? "bg-red-100 rounded-tr-sm border border-red-300"
                        : "bg-primary-400 rounded-tr-sm"
                      : "bg-surface border border-border/50 rounded-tl-sm"
                  }`}
                >
                  {/* Image attachment */}
                  {imageUri && (
                    <View className="mb-2 rounded-xl overflow-hidden bg-neutral-200">
                      <Image
                        source={{ uri: imageUri }}
                        style={{ width: 220, height: 160 }}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Document attachment */}
                  {isDoc && (
                    <View className="flex-row items-center mb-2 p-2 bg-black/10 rounded-xl">
                      <Feather
                        name="file-text"
                        size={20}
                        color={isMe && !isFailed ? "#fff" : "#111827"}
                      />
                      <Text
                        className={`ml-2 text-body-sm font-display-medium flex-1 ${
                          isMe && !isFailed ? "text-white" : "text-foreground"
                        }`}
                        numberOfLines={1}
                      >
                        {item.localFileName || item.attachments?.[0]?.filename || "Document"}
                      </Text>
                    </View>
                  )}

                  {/* Text */}
                  {!!item.text && (
                    <Text
                      className={`text-body-md font-display-medium ${
                        isMe && !isFailed ? "text-white" : "text-foreground"
                      }`}
                    >
                      {item.text}
                    </Text>
                  )}
                </View>

                {/* Subtext info (time, status icon, retry) */}
                <View
                  className={`flex-row items-center mt-1 gap-1 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <Text className="text-body-xs text-muted">{time}</Text>
                  {isMe && (
                    <Feather
                      name={
                        isUploading
                          ? "upload-cloud"
                          : item.status === "sending"
                          ? "clock"
                          : isFailed
                          ? "alert-circle"
                          : "check-circle"
                      }
                      size={11}
                      color={isFailed ? "#ef4444" : "#57b77d"}
                    />
                  )}
                  {/* Retry button for failed messages */}
                  {isMe && isFailed && (
                    <TouchableOpacity
                      onPress={() => handleRetry(item)}
                      accessibilityLabel="Retry sending this message"
                      accessibilityRole="button"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className="text-body-xs text-red-500 font-display-bold ml-1">
                        Retry
                      </Text>
                    </TouchableOpacity>
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
                  <View
                    className="w-2 h-2 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay: "150ms" } as any}
                  />
                  <View
                    className="w-2 h-2 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay: "300ms" } as any}
                  />
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
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
                    if (!result.canceled && result.assets.length > 0 && conversationId) {
                      const a = result.assets[0];
                      sendMessage.send({
                        conversationId,
                        file: {
                          uri: a.uri,
                          contentType: a.mimeType ?? "image/jpeg",
                          fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
                          sizeBytes: a.fileSize ?? 1024,
                          type: "image",
                        },
                      });
                    }
                  }}
                  className="w-20 h-20 rounded-2xl bg-neutral-100 items-center justify-center border border-border/30 overflow-hidden"
                  accessibilityLabel="Take a photo"
                  accessibilityRole="button"
                >
                  <Feather name="camera" size={24} color="#57b77d" />
                </TouchableOpacity>

                {/* Recent photos */}
                {recentPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    className="w-20 h-20 rounded-2xl overflow-hidden"
                    accessibilityLabel="Select this photo"
                    accessibilityRole="button"
                    onPress={() => {
                      closePanel();
                      if (!conversationId) return;
                      sendMessage.send({
                        conversationId,
                        file: {
                          uri: photo.uri,
                          contentType: "image/jpeg",
                          fileName: `photo_${Date.now()}.jpg`,
                          sizeBytes: 1024,
                          type: "image",
                        },
                      });
                    }}
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
                  accessibilityLabel={action.label}
                  accessibilityRole="button"
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
          <TouchableOpacity
            onPress={togglePanel}
            className="mr-3 mb-2"
            accessibilityLabel={showMediaPanel ? "Close attachment menu" : "Open attachment menu"}
            accessibilityRole="button"
            accessibilityState={{ expanded: showMediaPanel }}
          >
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
              accessibilityLabel="Message input"
            />
            <TouchableOpacity
              className="ml-2 mb-2"
              accessibilityLabel="Emoji picker"
              accessibilityRole="button"
            >
              <Feather name="smile" size={20} color="#6e8597" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim()}
            className="ml-3 mb-1 w-10 h-10 bg-primary-400 rounded-full items-center justify-center"
            accessibilityLabel={message.trim() ? "Send message" : "Record voice message"}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !message.trim(),
            }}
          >
            <Feather
              name={message.trim() ? "send" : "mic"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>
    </View>
  );
}
