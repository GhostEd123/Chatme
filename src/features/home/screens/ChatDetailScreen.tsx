import AvatarWidget from "@/shared/widgets/AvatarWidget";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useConversation } from "@/features/home/hooks/useConversation";
import { useMessages } from "@/features/home/hooks/useMessages";
import { useSendMessage } from "@/features/home/hooks/useSendMessage";
import { useMarkDelivered, useMarkRead } from "@/features/home/hooks/useReceipts";
import { useConversationRealtime } from "@/features/home/hooks/useConversationRealtime";
import { useDraftStore } from "@/features/home/store/draftStore";
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
  Linking,
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
import type { Message } from "@/features/home/hooks/useMessages";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MediaMenuAction {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  // ── Composer Draft Persistence ──
  const draft = useDraftStore((s) => (conversationId ? s.drafts[conversationId] : undefined));
  const setDraft = useDraftStore((s) => s.setDraft);
  const clearDraft = useDraftStore((s) => s.clearDraft);

  const [message, setMessage] = useState(draft || "");
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [recentPhotos, setRecentPhotos] = useState<{ id: string; uri: string; sizeBytes: number; filename: string }[]>([]);
  const [mediaPermission, setMediaPermission] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Sync state if draft loads
  useEffect(() => {
    if (draft && !message) {
      setMessage(draft);
    }
  }, [draft, message]);

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

  // ── Conversation metadata (name, avatar, permissions) ──
  const {
    data: conversation,
    isLoading: conversationLoading,
    isError: conversationError,
  } = useConversation(conversationId);

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
    const { status, canAskAgain } = await requestMediaPermissionsAsync();
    if (status === "granted") {
      setMediaPermission(true);
      try {
        const assets: Asset[] = await new Query()
          .limit(10)
          .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
          .exe();
        const withDetails = await Promise.all(
          assets.map(async (a) => ({
            id: a.id,
            uri: await a.getUri(),
            sizeBytes: (a as any).fileSize || 500_000,
            filename: (a as any).filename || `photo_${a.id}.jpg`,
          }))
        );
        setRecentPhotos(withDetails);
      } catch {}
    } else if (!canAskAgain) {
      Alert.alert(
        "Photos Permission Required",
        "Chatme needs permission to access your photo library. Please grant access in your device Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
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
    if (conversationId) clearDraft(conversationId);
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
    if (conversationId) setDraft(conversationId, text);
    if (text.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // ── Pick and send image ──
  const handlePickImage = async () => {
    closePanel();
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Chatme needs access to your photos to send pictures. Please allow access in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          ...(canAskAgain ? [] : [{ text: "Open Settings", onPress: () => Linking.openSettings() }]),
        ]
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
    const estimatedSize = asset.fileSize || (asset.width && asset.height ? Math.round(asset.width * asset.height * 0.3) : 600_000);
    try {
      sendMessage.send({
        conversationId,
        file: {
          uri: asset.uri,
          contentType: asset.mimeType ?? "image/jpeg",
          sizeBytes: estimatedSize,
          fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
          type: asset.type === "video" ? "video" : "image",
        },
      });
    } catch (err: any) {
      Alert.alert("Attachment Error", err?.message ?? "Invalid file.");
    }
  };

  // ── Pick and send document ──
  const handlePickDocument = async () => {
    closePanel();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0 || !conversationId) return;

      const asset = result.assets[0];
      const validSize = asset.size && asset.size > 0 ? asset.size : 100_000;
      sendMessage.send({
        conversationId,
        file: {
          uri: asset.uri,
          contentType: asset.mimeType ?? "application/pdf",
          sizeBytes: validSize,
          fileName: asset.name ?? `document_${Date.now()}.pdf`,
          type: "document",
        },
      });
    } catch (err: any) {
      Alert.alert("Document Error", err?.message ?? "Could not attach document.");
    }
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
      label: "Location (Coming Soon)",
      onPress: () => {
        closePanel();
        Alert.alert("Coming Soon", "Location sharing will be available in a future update.");
      },
      disabled: true,
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

  // ── Unavailable / Missing Conversation State ──
  if (conversationError) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
          <Feather name="slash" size={32} color="#ef4444" />
        </View>
        <Text className="text-h3 font-display-bold text-foreground mb-2 text-center">
          Conversation Unavailable
        </Text>
        <Text className="text-body-md text-muted text-center mb-6">
          This conversation may have been deleted, or you don&apos;t have access to it.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/chats")}
          className="bg-primary-400 px-6 py-3 rounded-full"
          accessibilityLabel="Back to chats"
          accessibilityRole="button"
        >
          <Text className="text-white font-display-bold text-body-md">Back to Chats</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View
        className="px-4 pb-4 flex-row items-center bg-primary-400 dark:bg-surface"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
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
          onPress={() => Alert.alert("Calls", "Video calling will be available soon.")}
        >
          <Feather name="video" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Start voice call"
          accessibilityRole="button"
          onPress={() => Alert.alert("Calls", "Voice calling will be available soon.")}
        >
          <Feather name="phone" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      {messagesLoading || conversationLoading ? (
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
                    <TouchableOpacity
                      onPress={() => {
                        const docUrl = item.attachments?.[0]?.url;
                        if (docUrl) Linking.openURL(docUrl);
                      }}
                      className="flex-row items-center mb-2 p-2 bg-black/10 rounded-xl"
                      accessibilityLabel="Open document"
                      accessibilityRole="button"
                    >
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
                    </TouchableOpacity>
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
                    const { status, canAskAgain } =
                      await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== "granted") {
                      Alert.alert(
                        "Camera Permission Required",
                        "Chatme needs camera access to capture and send photos. Please allow access in Settings.",
                        [
                          { text: "Cancel", style: "cancel" },
                          ...(canAskAgain ? [] : [{ text: "Open Settings", onPress: () => Linking.openSettings() }]),
                        ]
                      );
                      return;
                    }
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
                    if (!result.canceled && result.assets.length > 0 && conversationId) {
                      const a = result.assets[0];
                      const size = a.fileSize || (a.width && a.height ? Math.round(a.width * a.height * 0.3) : 500_000);
                      sendMessage.send({
                        conversationId,
                        file: {
                          uri: a.uri,
                          contentType: a.mimeType ?? "image/jpeg",
                          fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
                          sizeBytes: size,
                          type: "image",
                        },
                      });
                    }
                  }}
                  className="w-20 h-20 rounded-2xl bg-neutral-100 items-center justify-center border border-border/30 overflow-hidden"
                  accessibilityLabel="Take a photo with camera"
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
                          fileName: photo.filename,
                          sizeBytes: photo.sizeBytes,
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
                  activeOpacity={action.disabled ? 1 : 0.7}
                  className={`flex-row items-center px-5 py-3.5 ${action.disabled ? "opacity-50" : ""}`}
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
              onPress={() => Alert.alert("Emoji", "Emoji picker will be available in an upcoming update.")}
            >
              <Feather name="smile" size={20} color="#6e8597" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={message.trim() ? handleSend : () => Alert.alert("Voice Message", "Voice recording will be available in an upcoming update.")}
            className="ml-3 mb-1 w-10 h-10 bg-primary-400 rounded-full items-center justify-center"
            accessibilityLabel={message.trim() ? "Send message" : "Voice recording unavailable"}
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
