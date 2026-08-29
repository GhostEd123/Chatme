import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";
import ChatLayoutWrapper from "@/shared/components/ChatLayoutWrapper";

const StyledFeather = withUniwind(Feather);

export default function QRCodeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-primary">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">QR Code</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-surface dark:bg-neutral-800 rounded-3xl p-8 w-full items-center shadow-lg pt-12 relative mt-10">
          <View className="absolute -top-10">
            <AvatarWidget src="https://i.pravatar.cc/150?u=a042581f4e29026024d" size="xl" />
          </View>
          
          <Text className="text-h4 font-display-bold text-foreground mt-2">Roberto William</Text>
          <Text className="text-body-md text-muted mt-1">+61-827-680-673</Text>
          
          <View className="mt-8 bg-white p-4 rounded-xl border border-border">
            {/* Placeholder for actual QR code */}
            <View className="w-48 h-48 bg-neutral-200 dark:bg-neutral-700 items-center justify-center">
              <StyledFeather name="grid" size={100} colorClassName="accent-neutral-400" />
            </View>
          </View>
        </View>
      </View>

      <View className="pb-safe-offset-6 pt-4 items-center">
        <TouchableOpacity className="flex-row items-center bg-white/20 px-6 py-3 rounded-full">
          <StyledFeather name="camera" size={20} colorClassName="accent-white" />
          <Text className="ml-2 font-display-medium text-white text-body-lg">Scan QR code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
