import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

const MOCK_BLOCKED = [
  { id: "1", name: "Annette Black", phone: "+61-827-680-673", avatar: "https://i.pravatar.cc/150?u=10" },
  { id: "2", name: "Arlene McCoy", phone: "+61-827-680-673", avatar: "https://i.pravatar.cc/150?u=11" },
  { id: "3", name: "Annie Miles", phone: "+61-827-680-673", avatar: "https://i.pravatar.cc/150?u=12" },
];

export default function BlockedContactScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center border-b border-border/50 bg-primary dark:bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Blocked Contact</Text>
      </View>

      <FlatList
        data={MOCK_BLOCKED}
        keyExtractor={item => item.id}
        contentContainerClassName="p-6"
        ListFooterComponent={() => (
          <Text className="text-body-sm text-muted mt-4">
            Blocked contacts can't send messages and call you.
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between py-4 border-b border-border/50">
            <View className="flex-row items-center flex-1">
              <AvatarWidget src={item.avatar} size="md" />
              <View className="ml-4 flex-1">
                <Text className="text-body-lg font-display-bold text-foreground">{item.name}</Text>
                <Text className="text-body-sm text-muted mt-1">{item.phone}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <StyledFeather name="chevron-right" size={20} colorClassName="accent-muted" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
