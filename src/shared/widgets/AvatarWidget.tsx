import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";
import { cn } from "tailwind-variants";

const SIZE_MAP: Record<string, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

type AvatarWidgetProps = {
  url?: string;
  src?: string;
  size?: number | "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
};

export default function AvatarWidget({
  url,
  src,
  size = 48,
  isOnline = false,
  className,
}: AvatarWidgetProps) {
  const resolvedSize: number =
    typeof size === "string" ? (SIZE_MAP[size] ?? 48) : size;
  const resolvedUrl = url ?? src;

  return (
    <View
      style={{ width: resolvedSize, height: resolvedSize }}
      className={cn("relative rounded-full", className)}
    >
      <Image
        source={{ uri: resolvedUrl }}
        style={{ width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 }}
        contentFit="cover"
        transition={200}
      />
      {isOnline && (
        <View className="absolute bottom-0 right-0 size-3 bg-primary-400 rounded-full border-2 border-white dark:border-neutral-900" />
      )}
    </View>
  );
}

