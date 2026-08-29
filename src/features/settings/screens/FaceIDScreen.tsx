import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";
import ThemedButton from "@/shared/components/ThemedButton";

const StyledFeather = withUniwind(Feather);

export default function FaceIDScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-neutral-900">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center relative z-10">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Face ID</Text>
      </View>

      <Text className="text-body-md text-white/80 text-center mt-4 px-6 relative z-10">
        Please put your phone in front of your face
      </Text>

      <View className="flex-1 items-center justify-center relative mt-[-60px]">
        {/* Placeholder for Face ID Scanner Graphic */}
        <View className="w-72 h-72 rounded-[40px] border-4 border-white/40 items-center justify-center relative overflow-hidden">
          <View className="absolute inset-0 bg-black/20" />
          <StyledFeather name="user" size={120} colorClassName="accent-white/50" />
          
          {/* Scanner Line Mock */}
          <View className="absolute top-1/2 left-0 right-0 h-1 bg-primary w-full shadow-md shadow-primary" />
        </View>

        {/* Progress Bar */}
        <View className="w-72 mt-12">
          <View className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <View className="h-full bg-primary w-3/5 rounded-full" />
          </View>
          <Text className="text-body-sm text-white text-center mt-4 font-display-bold">
            60% Complete
          </Text>
        </View>
      </View>

      <View className="px-6 pb-safe-offset-6 absolute bottom-0 left-0 right-0">
        <ThemedButton label="Done" variant="primary" onPress={() => router.back()} />
      </View>
    </View>
  );
}
