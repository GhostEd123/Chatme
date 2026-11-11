import { useAuthStore } from "@/features/auth/store/authStore";
import { usePinConversation, useArchiveConversation, useMuteConversation, useDeleteConversation } from "@/features/home/hooks/useConversationSettings";
import { useConversations, useArchivedConversations, getConversationDisplay } from "@/features/home/hooks/useConversations";
import ThemedButton from "@/shared/components/ThemedButton";
import ChatListItemWidget from "@/shared/widgets/ChatListItemWidget";
import SearchInputWidget from "@/shared/widgets/SearchInputWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { useThemeStore, THEME_PALETTE } from "@/core/store/themeStore";

const StyledFeather = withUniwind(Feather);

// ── Speed-dial action ────────────────────────────────────────────────────────
interface SpeedDialItemProps {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  delay: number;
  animValue: Animated.Value;
}

function SpeedDialItem({
  label,
  icon,
  onPress,
  animValue,
}: SpeedDialItemProps) {
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  return (
    <Animated.View
      style={{ opacity: animValue, transform: [{ translateY }] }}
      className="flex-row items-center justify-end mb-3"
    >
      {/* Label pill */}
      <View className="bg-white rounded-full px-3 py-1.5 mr-3 shadow-sm">
        <Text className="text-body-md font-display-bold text-neutral-800">
          {label}
        </Text>
      </View>
      {/* Icon button */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-md"
      >
        <Feather name={icon} size={20} color="#57b77d" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Real API-backed mutations
  const { mutate: pinChat } = usePinConversation();
  const { mutate: archiveChat } = useArchiveConversation();
  const { mutate: muteChat } = useMuteConversation();
  const { mutate: deleteConversation } = useDeleteConversation();
  const { user, updateUser } = useAuthStore();

  // Theme colour
  const activeTheme = useThemeStore((s) => s.theme);
  const primaryColor = THEME_PALETTE[activeTheme].primary;

  // Real conversation data from API
  const { data: conversations, isLoading, isError, refetch } = useConversations();

  // Map API conversations to the shape ChatListItemWidget expects
  const currentUserId = user?.id ?? "";
  const allChats = (conversations ?? []).map((conv) => {
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
      // Use real settings from API
      isPinned: conv.settings?.pinned ?? false,
      isMuted: conv.settings?.muted ?? false,
      isArchived: conv.settings?.archived ?? false,
    };
  });

  const { data: archivedConversationsData } = useArchivedConversations();
  
  const archivedChats = (archivedConversationsData ?? []).map((conv) => {
    const { name } = getConversationDisplay(conv, currentUserId);
    return { name };
  });

  const chats = allChats.filter((c) => !c.isArchived);

  const [showPinPrompt, setShowPinPrompt] = useState(false);

  const [fabOpen, setFabOpen] = useState(false);

  // Three independent animation values for staggered reveal
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  const openFab = () => {
    setFabOpen(true);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fabRotate, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.stagger(50, [
        Animated.spring(anim1, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.spring(anim2, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.spring(anim3, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
      ]),
    ]).start();
  };

  const closeFab = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fabRotate, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(anim1, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(anim2, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(anim3, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFabOpen(false);
      cb?.();
    });
  };

  const handleFabPress = () => {
    if (fabOpen) {
      closeFab();
    } else {
      openFab();
    }
  };

  const handleSetupPin = () => {
    setShowPinPrompt(false);
    router.push("/(auth)/pin");
  };

  const handleSkipPin = () => {
    updateUser({ hasPinSetup: false });
    setShowPinPrompt(false);
  };

  const rotate = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      {/* Header */}
      <View
        style={{ backgroundColor: primaryColor, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 20 }}
      >
        <Text className="text-h2 font-display-bold text-white mb-4">Chats</Text>
        <SearchInputWidget />
      </View>

      {/* Chat List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-3 text-body-md text-muted font-display-medium">Loading chats…</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="wifi-off" size={40} color="#6e8597" />
          <Text className="mt-3 text-body-lg font-display-bold text-foreground text-center">Couldn&apos;t load chats</Text>
          <Text className="mt-1 text-body-md text-muted text-center mb-5">Check your connection and try again.</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{ backgroundColor: primaryColor }}
            className="px-6 py-3 rounded-2xl"
          >
            <Text className="text-white font-display-bold text-body-md">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 128 }}
          ListHeaderComponent={() => (
            <TouchableOpacity
              onPress={() => router.push("/chats/archived")}
              className="flex-row items-center px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl mb-1"
              activeOpacity={0.8}
            >
              {/* Archive icon box */}
              <View
                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: primaryColor, alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="archive" size={22} color="#fff" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-body-lg font-display-bold text-neutral-900 dark:text-white">Archived Chat</Text>
                <Text className="text-body-sm font-display-regular text-neutral-500" numberOfLines={1}>
                  {archivedChats.length > 0 
                    ? archivedChats.map((c) => c.name).join(", ") 
                    : "No archived chats"}
                </Text>
              </View>
              {/* Count badge */}
              {archivedChats.length > 0 && (
                <View style={{ backgroundColor: primaryColor }} className="rounded-full min-w-5 h-5 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-display-bold">{archivedChats.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          renderItem={({ item }) => (
            <ChatListItemWidget
              chat={item}
              onPress={() => router.push(`/chats/${item.id}`)}
              onMute={() => muteChat({ id: item.id, mute: !item.isMuted })}
              onPin={() => pinChat({ id: item.id, pin: !item.isPinned })}
              onDelete={() => {
                Alert.alert(
                  "Delete conversation",
                  "This will permanently delete this conversation. Continue?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () =>
                        deleteConversation(
                          { id: item.id },
                          {
                            onError: () =>
                              Alert.alert(
                                "Error",
                                "Could not delete the conversation. Please try again."
                              ),
                          }
                        ),
                    },
                  ]
                );
              }}
              onArchive={() => archiveChat({ id: item.id, archive: !item.isArchived })}
            />
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-24">
              <Feather name="message-circle" size={48} color="#6e8597" />
              <Text className="mt-4 text-body-lg font-display-bold text-foreground">No conversations yet</Text>
              <Text className="mt-1 text-body-md text-muted">Tap + to start chatting</Text>
            </View>
          )}
        />
      )}

      {/* ── FAB backdrop ── */}
      {fabOpen && (
        <Pressable
          onPress={() => closeFab()}
          style={{ position: "absolute", inset: 0 }}
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              opacity: backdropAnim,
            }}
          />
        </Pressable>
      )}

      {/* ── Speed-dial items ── */}
      {fabOpen && (
        <View
          className="absolute right-6"
          style={{ bottom: insets.bottom + 96 }}
          pointerEvents="box-none"
        >
          <SpeedDialItem
            label="New Group"
            icon="users"
            animValue={anim3}
            delay={0}
            onPress={() =>
              closeFab(() => router.push("/chats/new"))
            }
          />
          <SpeedDialItem
            label="New Contact"
            icon="user-plus"
            animValue={anim2}
            delay={50}
            onPress={() =>
              closeFab(() => router.push("/contacts/new"))
            }
          />
          <SpeedDialItem
            label="New Chat"
            icon="message-circle"
            animValue={anim1}
            delay={100}
            onPress={() =>
              closeFab(() => router.push("/chats/new"))
            }
          />
        </View>
      )}

      {/* ── FAB ── */}
      <Pressable
        onPress={handleFabPress}
        style={{
          position: "absolute",
          right: 24,
          bottom: insets.bottom + 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: primaryColor,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="plus" size={24} color="#fff" />
        </Animated.View>
      </Pressable>

      {/* ── Pin Prompt Modal ── */}
      <Modal visible={showPinPrompt} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full items-center shadow-xl">
            <View className="bg-surface dark:bg-neutral-800 size-14 rounded-2xl items-center justify-center mb-4 -mt-12 shadow-sm border border-border dark:border-neutral-700">
              <StyledFeather
                name="lock"
                size={24}
                colorClassName="accent-primary-400"
              />
            </View>
            <Text className="text-h3 font-display-bold text-neutral-900 dark:text-white text-center mb-2">
              Do you want to add a pin code?
            </Text>
            <Text className="text-body-md font-display-regular text-neutral-500 dark:text-neutral-400 text-center mb-8 px-4">
              Add a verification code to make it more secure.
            </Text>
            <View className="w-full gap-3">
              <ThemedButton
                label="Yes"
                variant="primary"
                onPress={handleSetupPin}
              />
              <ThemedButton
                label="No, thanks"
                variant="tertiary"
                onPress={handleSkipPin}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
