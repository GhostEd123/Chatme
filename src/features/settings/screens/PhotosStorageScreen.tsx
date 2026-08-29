import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

export default function PhotosStorageScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center border-b border-border/50 bg-primary dark:bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Photos</Text>
      </View>

      <View className="p-6">
        <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-border/50">
          <Text className="text-body-lg font-display-medium text-foreground">Off</Text>
          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
            <StyledFeather name="check" size={14} colorClassName="accent-white" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-border/50">
          <Text className="text-body-lg font-display-medium text-foreground">Wi-Fi</Text>
          <View className="w-6 h-6 rounded-full border border-border" />
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-border/50">
          <Text className="text-body-lg font-display-medium text-foreground">Wifi and Cellular</Text>
          <View className="w-6 h-6 rounded-full border border-border" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
