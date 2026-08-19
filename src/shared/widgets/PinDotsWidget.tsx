import React from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

type PinDotsWidgetProps = {
  length: number;
  value: string;
};

const Dot = ({ active }: { active: boolean }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: active ? withTiming("#4ADE80") : withTiming("transparent"), // Tailwind green-400 roughly, we can use bg-primary
      borderColor: active ? withTiming("#4ADE80") : withTiming("#E5E5E5"), // neutral-200
    };
  });

  return (
    <Animated.View
      className="size-4 rounded-full border-[1.5px] mx-2"
      style={[
        {
          borderColor: "transparent",
        },
        animatedStyle,
      ]}
    />
  );
};

export default function PinDotsWidget({ length, value }: PinDotsWidgetProps) {
  const dots = Array.from({ length }).map((_, i) => i);
  return (
    <View className="flex-row items-center justify-center py-4">
      {dots.map((i) => (
        <Dot key={i} active={i < value.length} />
      ))}
    </View>
  );
}
