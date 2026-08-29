import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";
import { SettingsItem } from "../components/SettingsItem";

const StyledFeather = withUniwind(Feather);

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center border-b border-border/50 bg-primary dark:bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Privacy</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4">
        <SettingsItem 
          icon="eye" 
          label="Last Seen" 
          onPress={() => router.navigate("/settings/privacy/last-seen")} 
          rightElement={<Text className="text-body-md text-muted mr-2">Everyone</Text>}
        />
        <SettingsItem 
          icon="image" 
          label="Profile Photo" 
          onPress={() => {}} 
          rightElement={<Text className="text-body-md text-muted mr-2">My Contact</Text>}
        />
        <SettingsItem 
          icon="info" 
          label="About" 
          onPress={() => {}} 
          rightElement={<Text className="text-body-md text-muted mr-2">My Contact</Text>}
        />
        <SettingsItem 
          icon="users" 
          label="Group" 
          onPress={() => {}} 
          rightElement={<Text className="text-body-md text-muted mr-2">Everyone</Text>}
        />
        <SettingsItem 
          icon="user-x" 
          label="Blocked Contact" 
          onPress={() => router.navigate("/settings/privacy/blocked-contact")} 
          rightElement={<Text className="text-body-md text-muted mr-2">4 Contacts</Text>}
        />
        <SettingsItem 
          icon="shield" 
          label="Face ID" 
          onPress={() => router.navigate("/settings/privacy/face-id")} 
        />
        <Text className="text-body-sm text-muted mt-4">
          With face ID, you can secure your apps
        </Text>
      </ScrollView>
    </View>
  );
}
