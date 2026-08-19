import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { TextInput, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

export default function SearchInputWidget() {
  return (
    <View className="flex-row items-center bg-white/20 dark:bg-neutral-800 rounded-xl px-4 py-2 min-h-11">
      <StyledFeather name="search" size={18} colorClassName="accent-white dark:accent-neutral-400" />
      <TextInput
        className="flex-1 ml-2 text-white dark:text-neutral-100 font-display-medium text-body-md h-full"
        placeholderTextColorClassName="accent-white/70 dark:accent-neutral-400"
        placeholder="Search chat, people and more..."
      />
    </View>
  );
}
