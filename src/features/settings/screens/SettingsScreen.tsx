import ChatLayoutWrapper from "@/shared/components/ChatLayoutWrapper";
import Spacer from "@/shared/components/Spacer";
import AvatarWidget from "@/shared/widgets/AvatarWidget";
import { useRouter } from "expo-router";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SettingsItem } from "../components/SettingsItem";
import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { withUniwind } from "uniwind";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";

const StyledFeather = withUniwind(Feather);

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  
  const { user } = useAuthStore();
  const logout = useLogout();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      router.replace("/");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-safe-offset-6 pb-4 flex-row items-center justify-between border-b border-border/50">
        <Text className="text-h3 font-display-bold text-foreground">Settings</Text>
        <TouchableOpacity onPress={() => router.navigate("/settings/profile")}>
          <StyledFeather name="edit" size={24} colorClassName="accent-primary" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-safe-offset-6">
        <TouchableOpacity 
          className="flex-row items-center px-6 py-6 border-b border-border/50"
          onPress={() => router.navigate("/settings/profile")}
        >
          <AvatarWidget url={user?.photo ?? undefined} size={40} isOnline={false} />
          <View className="ml-4 flex-1">
            <Text className="text-h4 font-display-bold text-foreground">{user?.name || "No Name"}</Text>
            <Text className="text-body-md text-muted mt-1">{user?.phone || ""}</Text>
          </View>
          <TouchableOpacity onPress={() => router.navigate("/settings/qr-code")}>
            <StyledFeather name="maximize" size={24} colorClassName="accent-primary" />
          </TouchableOpacity>
        </TouchableOpacity>

        <View className="px-6 py-4">
          <SettingsItem 
            icon="star" 
            label="Star messages" 
            onPress={() => router.navigate("/settings/star-message")} 
          />
          <SettingsItem 
            icon="phone-call" 
            label="Last call" 
            onPress={() => router.navigate("/settings/last-call")} 
          />
          <SettingsItem 
            icon="folder" 
            label="My folder" 
            onPress={() => {}} 
          />
          <SettingsItem 
            icon="moon" 
            label="Appearance" 
            onPress={() => router.navigate("/settings/appearance")} 
          />
          <SettingsItem 
            icon="bell" 
            label="Notification" 
            isToggle 
            toggleValue={notificationEnabled}
            onToggle={setNotificationEnabled}
          />
          <SettingsItem 
            icon="lock" 
            label="Privacy" 
            onPress={() => router.navigate("/settings/privacy")} 
          />
          <SettingsItem 
            icon="server" 
            label="Data and storage" 
            onPress={() => router.navigate("/settings/data-storage")} 
          />
          <SettingsItem 
            icon="help-circle" 
            label="FAQ" 
            onPress={() => router.navigate("/settings/faq")} 
          />
          {logout.isPending ? (
            <View className="flex-row items-center px-4 py-3 opacity-50">
               <ActivityIndicator size="small" color="#ef4444" className="mr-3" />
               <Text className="text-body-md text-red-500 font-display-medium">Logging out...</Text>
            </View>
          ) : (
            <SettingsItem 
              icon="log-out" 
              label="Logout" 
              onPress={handleLogout} 
              iconColor="accent-red-500"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
