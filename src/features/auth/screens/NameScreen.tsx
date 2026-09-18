import AuthTemplate from "@/features/auth/components/Blueprint";
import Spacer from "@/shared/components/Spacer";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View, Alert } from "react-native";
import { cn } from "tailwind-variants";
import { withUniwind } from "uniwind";
import { useUpdateProfile } from "@/features/settings/hooks/useProfile";

const Icon = withUniwind(FontAwesome6);
export default function NameScreen() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [name, setName] = useState("");
  const updateProfile = useUpdateProfile();

  const handleNext = async () => {
    if (!name.trim()) return;
    try {
      await updateProfile.mutateAsync({ displayName: name.trim() });
      router.push("/(auth)/upload");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to save your name.");
    }
  };

  return (
    <AuthTemplate
      goBack
      title="What's your name?"
      description="Write your name. You can change it back in settings."
      buttonProps={{
        onPress: handleNext,
        disabled: !name.trim() || updateProfile.isPending,
        label: updateProfile.isPending ? "Saving..." : "Continue",
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
            value={name}
            onChangeText={setName}
            editable={!updateProfile.isPending}
          />
        </View>
      </View>
    </AuthTemplate>
  );
}
