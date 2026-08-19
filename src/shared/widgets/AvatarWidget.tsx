import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";
import { cn } from "tailwind-variants";

type AvatarWidgetProps = {
  url?: string;
  size?: number;
  isOnline?: boolean;
  className?: string;
};

export default function AvatarWidget({
  url,
  size = 48,
  isOnline = false,
  className,
}: AvatarWidgetProps) {
  return (
    <View
      style={{ width: size, height: size }}
      className={cn("relative rounded-full", className)}
    >
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
      />
      {isOnline && (
        <View className="absolute bottom-0 right-0 size-3 bg-primary-400 rounded-full border-2 border-white dark:border-neutral-900" />
      )}
    </View>
  );
}
