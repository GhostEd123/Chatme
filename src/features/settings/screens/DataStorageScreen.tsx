import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";
import { SettingsItem } from "../components/SettingsItem";

const StyledFeather = withUniwind(Feather);

export default function DataStorageScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center border-b border-border/50 bg-primary dark:bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Data and Storage</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4">
        <SettingsItem 
          icon="hard-drive" 
          label="Manage Storage" 
          onPress={() => router.navigate("/settings/data-storage/manage")} 
        />
        
        <Text className="text-body-sm font-display-bold text-muted mt-8 mb-2 uppercase">
          Auto Download
        </Text>
        
        <SettingsItem 
          icon="image" 
          label="Photos" 
          onPress={() => router.navigate("/settings/data-storage/photos")} 
          rightElement={<Text className="text-body-md text-muted mr-2">Off</Text>}
        />
        <SettingsItem 
          icon="music" 
          label="Audio" 
          onPress={() => {}} 
          rightElement={<Text className="text-body-md text-muted mr-2">Wi-Fi</Text>}
        />
        <SettingsItem 
          icon="file-text" 
          label="Documents" 
          onPress={() => {}} 
          rightElement={<Text className="text-body-md text-muted mr-2">Wi-Fi and Cellular</Text>}
        />
        <SettingsItem 
          icon="video" 
          label="Videos" 
          onPress={() => {}} 
          rightElement={<Text className="text-body-md text-muted mr-2">Off</Text>}
        />
      </ScrollView>
    </View>
  );
}
