import Spacer from "@/shared/components/Spacer";
import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { withUniwind } from "uniwind";
import ChatLayoutWrapper from "@/shared/components/ChatLayoutWrapper";
import ThemedButton from "@/shared/components/ThemedButton";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUpdateProfile } from "@/features/settings/hooks/useProfile";
import { useState } from "react";

const StyledFeather = withUniwind(Feather);

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  
  const [name, setName] = useState(user?.name || "");

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ displayName: name });
      router.back();
    } catch (e) {
      console.error("Failed to update profile", e);
    }
  };

  return (
    <ChatLayoutWrapper
      bottomInput={<View />}
      bottomWidget={
        <View className="px-6 pb-safe-offset-6">
          <ThemedButton 
            label={updateProfile.isPending ? "Saving..." : "Save"} 
            variant="primary" 
            onPress={handleSave} 
            disabled={updateProfile.isPending || !name.trim()}
          />
        </View>
      }
    >
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-foreground" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-foreground">Edit Profile</Text>
      </View>

      <View className="items-center mt-8">
        <View className="relative">
          <AvatarWidget url={user?.photo ?? undefined} size={96} />
          <TouchableOpacity className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 border-background">
            <StyledFeather name="camera" size={16} colorClassName="accent-white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 mt-12">
        <Text className="text-body-md font-display-medium text-muted mb-2">Name</Text>
        <View className="flex-row items-center bg-surface dark:bg-neutral-800 rounded-xl px-4 py-3 border border-border">
          <StyledFeather name="user" size={20} colorClassName="accent-muted" />
          <TextInput 
            className="flex-1 ml-3 font-display-medium text-foreground text-body-md"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9ca3af"
            placeholder="Your name"
          />
        </View>

        <Spacer size={24} />

        <Text className="text-body-md font-display-medium text-muted mb-2">Phone Number</Text>
        <View className="flex-row items-center bg-surface dark:bg-neutral-800/50 rounded-xl px-4 py-3 border border-border opacity-60">
          <StyledFeather name="phone" size={20} colorClassName="accent-muted" />
          <TextInput 
            className="flex-1 ml-3 font-display-medium text-foreground text-body-md"
            value={user?.phone || ""}
            editable={false}
          />
        </View>
      </View>
    </ChatLayoutWrapper>
  );
}
