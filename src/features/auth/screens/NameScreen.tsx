import AuthTemplate from "@/features/auth/components/Blueprint";
import Spacer from "@/shared/components/Spacer";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { cn } from "tailwind-variants";
import { withUniwind } from "uniwind";

const Icon = withUniwind(FontAwesome6);
export default function NameScreen() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  return (
    <AuthTemplate
      goBack
      title="What's your name?"
      description="Write your name. You can change it back in settings."
      buttonProps={{
        onPress: () => router.navigate("/upload"),
      }}
    >
      <View className="flex-1">
        <Text className="text-body-md font-display-medium text-neutral-600 dark:text-neutral-50 px-1">
          Name
        </Text>
        <Spacer size={8} />
        <View
          className={cn(
            "flex-row items-center justify-between bg-surface dark:bg-neutral-800/50 rounded-xl px-4 py-2 min-h-13 border",
            isFocused
              ? "border-primary ring-1 ring-primary bg-primary-50 dark:bg-neutral-800"
              : "border-border dark:border-neutral-700",
          )}
        >
          <Icon
            name="user-large"
            size={14}
            colorClassName={isFocused ? "accent-primary" : "accent-neutral-300 dark:accent-neutral-500"}
          />

          <TextInput
            className="flex-1 ml-3 text-foreground dark:text-white font-display-medium text-body-md h-full"
            placeholderTextColorClassName="accent-muted dark:accent-neutral-500"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Name"
          />
        </View>
      </View>
    </AuthTemplate>
  );
}
