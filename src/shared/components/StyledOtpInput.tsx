import React from "react";
import { View, Text } from "react-native";
import { cn } from "tailwind-variants";

type StyledOtpInputProps = {
  value: string;
  length?: number;
};

export default function StyledOtpInput({ value, length = 4 }: StyledOtpInputProps) {
  const cells = Array.from({ length }).map((_, i) => i);

  return (
    <View className="w-full px-4 my-6">
      <View className="flex-row justify-between w-full">
        {cells.map((i) => {
          const digit = value[i] || "";
          const isFocused = value.length === i;
          const isFilled = value.length > i;

          return (
            <View
              key={i}
              className={cn(
                "w-14 h-16 rounded-2xl border bg-surface dark:bg-neutral-800 flex items-center justify-center",
                isFocused
                  ? "border-primary-400 border-2"
                  : isFilled
                  ? "border-primary-400"
                  : "border-border dark:border-neutral-600"
              )}
            >
              <Text className="text-h3 font-display-bold text-foreground dark:text-white">
                {digit}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
