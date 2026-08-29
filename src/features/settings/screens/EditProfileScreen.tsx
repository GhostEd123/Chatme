import Spacer from "@/shared/components/Spacer";
import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";
import ChatLayoutWrapper from "@/shared/components/ChatLayoutWrapper";
import ThemedButton from "@/shared/components/ThemedButton";

const StyledFeather = withUniwind(Feather);

export default function EditProfileScreen() {
  const router = useRouter();

  return (
    <ChatLayoutWrapper
      bottomInput={<View />}
      bottomWidget={
        <View className="px-6 pb-safe-offset-6">
          <ThemedButton label="Save" variant="primary" onPress={() => router.back()} />
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
          <AvatarWidget url="https://i.pravatar.cc/150?u=a042581f4e29026024d" size={96} />
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
            value="Roberto William"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <Spacer size={24} />

        <Text className="text-body-md font-display-medium text-muted mb-2">Phone Number</Text>
        <View className="flex-row items-center bg-surface dark:bg-neutral-800 rounded-xl px-4 py-3 border border-border">
          <Text className="text-h4">🇮🇩</Text>
          <Text className="ml-2 font-display-bold text-foreground">+62</Text>
          <TextInput 
            className="flex-1 ml-3 font-display-medium text-foreground text-body-md"
            value="85-830-544-382"
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>
    </ChatLayoutWrapper>
  );
}
