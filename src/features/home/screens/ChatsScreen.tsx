import { useChatStore } from "@/features/home/store/chatStore";
import ChatListItemWidget from "@/shared/widgets/ChatListItemWidget";
import SearchInputWidget from "@/shared/widgets/SearchInputWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { useAuthStore } from "@/features/auth/store/authStore";
import ThemedButton from "@/shared/components/ThemedButton";

const StyledFeather = withUniwind(Feather);

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chats, muteChat, pinChat, deleteChat, archiveChat } = useChatStore();
  const { user, updateUser } = useAuthStore();
  
  // Only show pin prompt if they haven't made a choice yet. For simplicity, if hasPinSetup is undefined, we prompt.
  const [showPinPrompt, setShowPinPrompt] = useState(user?.hasPinSetup === undefined);

  const handleSetupPin = () => {
    setShowPinPrompt(false);
    router.push("/(auth)/pin"); // Assuming we route to a pin setup screen
  };

  const handleSkipPin = () => {
    updateUser({ hasPinSetup: false });
    setShowPinPrompt(false);
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2 bg-primary-400 rounded-b-3xl pb-6">
        <Text className="text-h2 font-display-bold text-white mb-4">Chats</Text>
        <SearchInputWidget />
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-4 pb-24"
        renderItem={({ item }) => (
          <ChatListItemWidget
            chat={item}
            onPress={() => console.log("Open chat", item.id)}
            onMute={() => muteChat(item.id, !item.isMuted)}
            onPin={() => pinChat(item.id, !item.isPinned)}
            onDelete={() => deleteChat(item.id)}
            onArchive={() => archiveChat(item.id, !item.isArchived)}
          />
        )}
      />

      {/* FAB */}
      <Pressable className="absolute bottom-6 right-6 size-14 rounded-full bg-primary-400 items-center justify-center shadow-lg active:scale-95">
        <StyledFeather name="plus" size={24} colorClassName="accent-white" />
      </Pressable>

      {/* Pin Prompt Modal */}
      <Modal visible={showPinPrompt} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full items-center shadow-xl">
            <View className="bg-surface dark:bg-neutral-800 size-14 rounded-2xl items-center justify-center mb-4 -mt-12 shadow-sm border border-border dark:border-neutral-700">
              <StyledFeather name="lock" size={24} colorClassName="accent-primary-400" />
            </View>
            <Text className="text-h3 font-display-bold text-neutral-900 dark:text-white text-center mb-2">
              Do you want to add a pin code?
            </Text>
            <Text className="text-body-md font-display-regular text-neutral-500 dark:text-neutral-400 text-center mb-8 px-4">
              Add a verification code to make it more secure.
            </Text>
            <View className="w-full gap-3">
              <ThemedButton label="Yes" variant="primary" onPress={handleSetupPin} />
              <ThemedButton label="No, thanks" variant="tertiary" onPress={handleSkipPin} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
