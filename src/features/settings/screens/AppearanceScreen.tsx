import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";
import { SettingsItem } from "../components/SettingsItem";
import { useState } from "react";
import Spacer from "@/shared/components/Spacer";

const StyledFeather = withUniwind(Feather);

export default function AppearanceScreen() {
  const router = useRouter();
  const [nightMode, setNightMode] = useState(false);
  const [largeEmoji, setLargeEmoji] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center border-b border-border/50 bg-primary dark:bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Appearance</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <View className="bg-primary/10 rounded-3xl p-6 mb-8 items-center border border-primary/20">
          <Text className="text-body-lg text-primary text-center mb-4">Habitant elit pellentesque curabitur morbi sit fusce elit</Text>
          <View className="bg-primary px-4 py-2 rounded-full">
            <Text className="text-white text-body-sm">Gravida lectus semper orci</Text>
          </View>
        </View>

        <Text className="text-h4 font-display-bold text-foreground mb-4">Select a Theme</Text>
        <View className="flex-row justify-between mb-8">
          {["bg-green-500", "bg-blue-500", "bg-red-500", "bg-orange-500"].map((color, i) => (
            <View key={i} className="items-center">
              <TouchableOpacity className={`w-16 h-16 rounded-2xl ${color} mb-2 items-center justify-center`}>
                {i === 0 && <View className="w-8 h-2 bg-white/50 rounded-full" />}
              </TouchableOpacity>
              <Text className="text-body-sm text-muted">{["Green", "Blue", "Red", "Orange"][i]}</Text>
            </View>
          ))}
        </View>

        <SettingsItem 
          icon="moon" 
          label="Night Mode" 
          isToggle 
          toggleValue={nightMode}
          onToggle={setNightMode}
        />
        <SettingsItem 
          icon="smile" 
          label="Large Emoji" 
          isToggle 
          toggleValue={largeEmoji}
          onToggle={setLargeEmoji}
        />

        <Spacer size={24} />
        
        <Text className="text-h4 font-display-bold text-foreground mb-4 mt-4">App Icon</Text>
        <View className="flex-row justify-between">
          {[
            { color: "text-green-500", label: "Green" },
            { color: "text-blue-500", label: "Blue" },
            { color: "text-red-500", label: "Red" },
            { color: "text-orange-500", label: "Orange" }
          ].map((item, i) => (
            <View key={i} className="items-center">
              <View className={`w-16 h-16 rounded-2xl border-2 ${i === 0 ? "border-green-500" : "border-border"} mb-2 items-center justify-center bg-surface`}>
                <StyledFeather name="message-square" size={32} className={item.color} />
              </View>
              <Text className="text-body-sm text-muted">{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
