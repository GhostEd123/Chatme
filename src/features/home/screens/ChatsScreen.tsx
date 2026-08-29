import { useAuthStore } from "@/features/auth/store/authStore";
import { useChatStore } from "@/features/home/store/chatStore";
import ThemedButton from "@/shared/components/ThemedButton";
import ChatListItemWidget from "@/shared/widgets/ChatListItemWidget";
import SearchInputWidget from "@/shared/widgets/SearchInputWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
  const { chats, muteChat, pinChat, deleteChat, archiveChat } = useChatStore();
  const { user, updateUser } = useAuthStore();

  const [showPinPrompt, setShowPinPrompt] = useState(
    user?.hasPinSetup === undefined,
  );
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
        className="px-5 pb-6 bg-primary-400 dark:bg-surface"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text className="text-h2 font-display-bold text-white mb-4">Chats</Text>
        <SearchInputWidget />
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-4 pb-32"
        renderItem={({ item }) => (
          <ChatListItemWidget
            chat={item}
            onPress={() => router.push(`/chats/${item.id}`)}
            onMute={() => muteChat(item.id, !item.isMuted)}
            onPin={() => pinChat(item.id, !item.isPinned)}
            onDelete={() => deleteChat(item.id)}
            onArchive={() => archiveChat(item.id, !item.isArchived)}
          />
        )}
      />

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
          backgroundColor: "#57b77d",
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
