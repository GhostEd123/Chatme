import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

const MOCK_STORAGE = [
  { id: "1", name: "Esther Howard", phone: "+61-827-680-673", size: "120.3 MB", avatar: "https://i.pravatar.cc/150?u=20" },
  { id: "2", name: "Guy Hawkins", phone: "+61-664-234-133", size: "431.6 MB", avatar: "https://i.pravatar.cc/150?u=21" },
  { id: "3", name: "Robert Fox", phone: "+61-324-773-113", size: "183.11 MB", avatar: "https://i.pravatar.cc/150?u=22" },
  { id: "4", name: "Jacob Jones", phone: "+61-664-121-997", size: "623.3 MB", avatar: "https://i.pravatar.cc/150?u=23" },
  { id: "5", name: "Floyd Miles", phone: "+61-333-444-211", size: "325.67 MB", avatar: "https://i.pravatar.cc/150?u=24" },
  { id: "6", name: "Dianne Russell", phone: "+61-531-996-421", size: "123.3 MB", avatar: "https://i.pravatar.cc/150?u=25" },
];

export default function ManageStorageScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center border-b border-border/50 bg-primary dark:bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Manage Storage</Text>
      </View>

      <FlatList
        data={MOCK_STORAGE}
        keyExtractor={item => item.id}
        contentContainerClassName="p-6 pb-12"
        ListHeaderComponent={() => (
          <View className="mb-8">
            <Text className="text-body-lg font-display-bold text-foreground mb-4">Storage</Text>
            <View className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex-row">
              <View className="h-full bg-primary w-1/4" />
            </View>
            
            <View className="mt-4">
              <View className="flex-row items-center mb-2">
                <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                <Text className="text-body-md text-foreground font-display-medium">Media and Files • 2.1 GB</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 mr-2" />
                <Text className="text-body-md text-foreground font-display-medium">Free • 62.5 GB</Text>
              </View>
            </View>
            
            <TouchableOpacity className="mt-6">
              <Text className="text-body-md font-display-bold text-primary">Clear Cache</Text>
            </TouchableOpacity>

            <Text className="text-h4 font-display-bold text-foreground mt-8 mb-2">Chat</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between py-4 border-b border-border/30">
            <View className="flex-row items-center flex-1">
              <AvatarWidget src={item.avatar} size="md" />
              <View className="ml-4 flex-1">
                <Text className="text-body-lg font-display-bold text-foreground">{item.name}</Text>
                <Text className="text-body-sm text-muted mt-1">{item.phone}</Text>
              </View>
            </View>
            <Text className="text-body-sm font-display-medium text-foreground">{item.size}</Text>
          </View>
        )}
      />
    </View>
  );
}
