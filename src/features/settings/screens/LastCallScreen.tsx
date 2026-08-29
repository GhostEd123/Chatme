import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

const MOCK_CALLS = [
  { id: "1", name: "Annie Miles", type: "Incoming", time: "10:30 PM", date: "TODAY", avatar: "https://i.pravatar.cc/150?u=4", icon: "phone-incoming", color: "accent-primary" },
  { id: "2", name: "Wade Warren", type: "Incoming", time: "10:00 PM", date: "TODAY", avatar: "https://i.pravatar.cc/150?u=5", icon: "phone-incoming", color: "accent-primary" },
  { id: "3", name: "Guy Hawkins", type: "Missed Call", time: "08:32 PM", date: "TODAY", avatar: "https://i.pravatar.cc/150?u=6", icon: "phone-missed", color: "accent-red-500" },
  { id: "4", name: "Robert Fox", type: "Incoming", time: "11:11 PM", date: "YESTERDAY", avatar: "https://i.pravatar.cc/150?u=7", icon: "phone-incoming", color: "accent-primary" },
  { id: "5", name: "Savannah Nguyen", type: "Incoming", time: "10:22 PM", date: "YESTERDAY", avatar: "https://i.pravatar.cc/150?u=8", icon: "phone-incoming", color: "accent-primary" },
  { id: "6", name: "Albert Flores", type: "Outgoing", time: "10:10 PM", date: "YESTERDAY", avatar: "https://i.pravatar.cc/150?u=9", icon: "phone-outgoing", color: "accent-primary" },
];

export default function LastCallScreen() {
  const router = useRouter();

  // Group by date
  const grouped = MOCK_CALLS.reduce((acc, call) => {
    if (!acc[call.date]) acc[call.date] = [];
    acc[call.date].push(call);
    return acc;
  }, {} as Record<string, typeof MOCK_CALLS>);

  const sections = Object.keys(grouped).map(key => ({
    title: key,
    data: grouped[key]
  }));

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center justify-between border-b border-border/50 bg-primary dark:bg-surface">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
          </TouchableOpacity>
          <Text className="text-h3 font-display-bold text-white">Last Call</Text>
        </View>
        <TouchableOpacity>
          <StyledFeather name="edit" size={24} colorClassName="accent-white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={item => item.title}
        renderItem={({ item }) => (
          <View className="mb-4">
            <Text className="text-body-sm font-display-bold text-muted px-6 py-2 bg-surface/50 dark:bg-neutral-900/50">{item.title}</Text>
            {item.data.map(call => (
              <View key={call.id} className="flex-row items-center justify-between px-6 py-4 border-b border-border/30">
                <View className="flex-row items-center flex-1">
                  <AvatarWidget src={call.avatar} size="md" />
                  <View className="ml-4 flex-1">
                    <Text className="text-body-lg font-display-bold text-foreground">{call.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <StyledFeather name={call.icon as any} size={14} colorClassName={call.color} />
                      <Text className="text-body-sm text-muted ml-1">{call.type}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-body-sm text-muted mr-3">{call.time}</Text>
                  <StyledFeather name="info" size={20} colorClassName="accent-primary" />
                </View>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}
