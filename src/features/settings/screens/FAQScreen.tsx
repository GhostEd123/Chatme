import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

const MOCK_FAQ = [
  { id: "1", q: "How can i use this app?", a: "You can download it in the play store/app store, then type in the search menu with the name \"ChatMe\" then press download to be able to communicate easily.", isOpen: true },
  { id: "2", q: "Is this app paid?", a: "No, this app is free.", isOpen: false },
  { id: "3", q: "How to send messages and videos?", a: "Go to a chat and use the attachment icon.", isOpen: false },
  { id: "4", q: "Are there any special requirements for using this application?", a: "Just an active internet connection.", isOpen: false },
  { id: "5", q: "How to send files?", a: "Use the attachment icon in the chat screen.", isOpen: false },
];

export default function FAQScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-6 border-b border-border/50 bg-primary dark:bg-surface">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <StyledFeather name="chevron-left" size={24} colorClassName="accent-white" />
          </TouchableOpacity>
          <Text className="text-h3 font-display-bold text-white">FAQ</Text>
        </View>

        <View className="flex-row items-center bg-white/20 rounded-xl px-4 py-3">
          <StyledFeather name="search" size={20} colorClassName="accent-white" />
          <TextInput 
            className="flex-1 ml-3 font-display-medium text-white text-body-md"
            placeholder="Search questions ..."
            placeholderTextColor="rgba(255,255,255,0.6)"
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4">
        {MOCK_FAQ.map(item => (
          <View key={item.id} className="py-4 border-b border-border/50">
            <View className="flex-row items-center justify-between">
              <Text className="text-body-lg font-display-bold text-foreground flex-1 pr-4">{item.q}</Text>
              <View className={`w-6 h-6 rounded-full items-center justify-center border ${item.isOpen ? 'bg-primary border-primary' : 'border-primary'}`}>
                <StyledFeather name={item.isOpen ? "minus" : "plus"} size={14} colorClassName={item.isOpen ? "accent-white" : "accent-primary"} />
              </View>
            </View>
            {item.isOpen && (
              <Text className="text-body-sm text-muted mt-3 leading-relaxed">
                {item.a}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
