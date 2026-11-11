/**
 * Auth guard for all /chats/* routes.
 *
 * A signed-out user who deep-links directly into /chats/[id] is redirected to
 * the root index which will carry them through session restoration and the auth
 * flow before eventually arriving at this route.
 */
import { useAuthStore } from "@/features/auth/store/authStore";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function ChatsLayout() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    // If there is no authenticated session, redirect to root (which handles
    // the auth flow). This covers cold-starts directly into a private chat.
    if (!user?.id || !accessToken) {
      router.replace("/");
    }
  }, [user, accessToken]);

  // While we don't yet know the session state, show a spinner rather than
  // flashing the protected content.
  if (!user?.id || !accessToken) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#57b77d" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ headerShown: false }} />
      <Stack.Screen name="archived" options={{ headerShown: false }} />
    </Stack>
  );
}

