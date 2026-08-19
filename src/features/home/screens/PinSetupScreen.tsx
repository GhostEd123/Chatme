import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import NumpadWidget from "@/shared/widgets/NumpadWidget";
import PinDotsWidget from "@/shared/widgets/PinDotsWidget";
import { useAuthStore } from "@/features/auth/store/authStore";

const StyledFeather = withUniwind(Feather);

export default function PinSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuthStore();
  const [pin, setPin] = useState("");

  const handleNumpadPress = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        // Save pin state and navigate
        updateUser({ hasPinSetup: true });
        router.replace("/(tabs)/chats");
      }
    }
  };

  const handleNumpadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-4 flex-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="size-11 rounded-2xl border-[1.5px] border-border flex items-center justify-center bg-surface/50 mb-6"
        >
          <StyledFeather
            name="chevron-left"
            size={24}
            colorClassName="accent-neutral-900 dark:accent-white/90"
          />
        </Pressable>

        <View className="items-center mt-10">
          <Text className="text-h3 font-display-bold text-neutral-900 dark:text-white/90 text-center mb-3">
            Setup pin code
          </Text>
          <Text className="text-body-md font-display-medium text-neutral-400 dark:text-neutral-400 text-center max-w-64">
            Make sure the code is safe and no one else knows.
          </Text>
        </View>

        <View className="mt-16">
          <PinDotsWidget length={4} value={pin} />
        </View>
      </View>
      <NumpadWidget onPress={handleNumpadPress} onBackspace={handleNumpadBackspace} />
    </View>
  );
}
