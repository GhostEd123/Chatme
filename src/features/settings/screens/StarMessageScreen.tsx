import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

const MOCK_STARRED = [
  { id: "1", name: "Dianne Russell", date: "21/07/2021", msg: "Orci maecenas hendrerit mattis consectetur. Mauris.", time: "15:46", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: "2", name: "Annie Miles", date: "22/07/2021", msg: "Egestas interdum orci commodo faucibus pretium.", time: "18:23", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: "3", name: "Bessie Cooper", date: "21/07/2021", msg: "Orci maecenas hendrerit mattis consectetur. Mauris.", time: "19:40", avatar: "https://i.pravatar.cc/150?u=3" },
];

export default function StarMessageScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center justify-between border-b border-border/50 bg-primary dark:bg-surface">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
          </TouchableOpacity>
          <Text className="text-h3 font-display-bold text-white">Star Message</Text>
        </View>
        <TouchableOpacity>
          <StyledFeather name="search" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_STARRED}
        keyExtractor={item => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <View className="mb-4">
            <View className="bg-primary-50 dark:bg-primary-900/30 rounded-t-2xl rounded-br-2xl p-4 mr-12 relative border border-primary/10">
              <Text className="text-body-md text-foreground font-display-medium leading-relaxed">{item.msg}</Text>
              <View className="flex-row items-center justify-end mt-2">
                <StyledFeather name="star" size={12} colorClassName="accent-primary" />
                <Text className="text-body-sm text-muted ml-1">{item.time}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center justify-between mt-3 px-2">
              <View className="flex-row items-center">
                <AvatarWidget src={item.avatar} size="sm" />
                <Text className="text-body-md font-display-bold text-foreground ml-3">{item.name}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-body-sm text-muted mr-1">{item.date}</Text>
                <StyledFeather name="chevron-right" size={16} colorClassName="accent-muted" />
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}
