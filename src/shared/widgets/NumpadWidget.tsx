import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

type NumpadWidgetProps = {
  onPress: (val: string) => void;
  onBackspace: () => void;
};

const keys = [
  { value: "1", label: "" },
  { value: "2", label: "A B C" },
  { value: "3", label: "D E F" },
  { value: "4", label: "G H I" },
  { value: "5", label: "J K L" },
  { value: "6", label: "M N O" },
  { value: "7", label: "P Q R S" },
  { value: "8", label: "T U V" },
  { value: "9", label: "W X Y Z" },
];

export default function NumpadWidget({ onPress, onBackspace }: NumpadWidgetProps) {
  return (
    <View className="bg-neutral-200 dark:bg-neutral-800 pt-2 pb-safe-offset-4 px-1 flex-row flex-wrap justify-between">
      {keys.map((k) => (
        <Pressable
          key={k.value}
          onPress={() => onPress(k.value)}
          className="w-[31%] aspect-[2.1] bg-white dark:bg-neutral-700 rounded-xl mb-2 items-center justify-center shadow-sm active:opacity-70"
        >
          <Text className="text-h3 font-display-medium text-neutral-900 dark:text-white leading-tight">
            {k.value}
          </Text>
          {k.label ? (
            <Text className="text-[10px] font-display-bold text-neutral-900 dark:text-white tracking-widest mt-[-2px]">
              {k.label}
            </Text>
          ) : null}
        </Pressable>
      ))}

      <View className="w-[31%] mb-2" />
      <Pressable
        onPress={() => onPress("0")}
        className="w-[31%] aspect-[2.1] bg-white dark:bg-neutral-700 rounded-xl mb-2 items-center justify-center shadow-sm active:opacity-70"
      >
        <Text className="text-h3 font-display-medium text-neutral-900 dark:text-white leading-tight">
          0
        </Text>
      </Pressable>

      <Pressable
        onPress={onBackspace}
        className="w-[31%] aspect-[2.1] rounded-xl mb-2 items-center justify-center active:opacity-70"
      >
        <StyledFeather name="delete" size={24} colorClassName="accent-neutral-900 dark:accent-white" />
      </Pressable>
    </View>
  );
}
