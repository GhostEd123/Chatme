import { Chat } from "@/features/home/store/chatStore";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { withUniwind } from "uniwind";
import AvatarWidget from "./AvatarWidget";

const StyledFeather = withUniwind(Feather);

type ChatListItemWidgetProps = {
  chat: Chat;
  onPress: () => void;
  onMute: () => void;
  onPin: () => void;
  onDelete: () => void;
  onArchive: () => void;
};

export default function ChatListItemWidget({
  chat,
  onPress,
  onMute,
  onPin,
  onDelete,
  onArchive,
}: ChatListItemWidgetProps) {
  const renderLeftActions = () => {
    return (
      <View className="flex-row items-center h-full">
        <Pressable
          onPress={onMute}
          className="bg-orange-400 w-20 h-full items-center justify-center rounded-l-xl"
        >
          <StyledFeather name={chat.isMuted ? "volume-2" : "volume-x"} size={20} colorClassName="accent-white" />
          <Text className="text-white text-xs font-display-medium mt-1">
            {chat.isMuted ? "Unmute" : "Mute"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPin}
          className="bg-neutral-400 dark:bg-neutral-600 w-20 h-full items-center justify-center"
        >
          <StyledFeather name="map-pin" size={20} colorClassName="accent-white" />
          <Text className="text-white text-xs font-display-medium mt-1">
            {chat.isPinned ? "Unpin" : "Pinned"}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderRightActions = () => {
    return (
      <View className="flex-row items-center h-full">
        <Pressable
          onPress={onDelete}
          className="bg-red-500 w-20 h-full items-center justify-center"
        >
          <StyledFeather name="trash-2" size={20} colorClassName="accent-white" />
          <Text className="text-white text-xs font-display-medium mt-1">Delete</Text>
        </Pressable>
        <Pressable
          onPress={onArchive}
          className="bg-neutral-400 dark:bg-neutral-600 w-20 h-full items-center justify-center rounded-r-xl"
        >
          <StyledFeather name="archive" size={20} colorClassName="accent-white" />
          <Text className="text-white text-xs font-display-medium mt-1">Archived</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      containerStyle={{ marginBottom: 4 }}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl"
      >
        <AvatarWidget url={chat.avatarUrl} isOnline={true} />
        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-body-lg font-display-bold text-neutral-900 dark:text-white">
                {chat.name}
              </Text>
              {chat.isMuted && (
                <StyledFeather name="volume-x" size={12} colorClassName="accent-neutral-400 ml-2" />
              )}
            </View>
            <Text className="text-xs font-display-medium text-neutral-400">
              {chat.timestamp}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text
              className="text-body-sm font-display-regular text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              {chat.lastMessage}
            </Text>
            {chat.unreadCount ? (
              <View className="bg-primary-400 rounded-full min-w-5 h-5 items-center justify-center px-1 ml-2">
                <Text className="text-white text-[10px] font-display-bold">
                  {chat.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}
