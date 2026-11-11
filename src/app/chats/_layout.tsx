/**
 * Auth guard for all /chats/* routes.
 *
 * A signed-out user who deep-links directly into /chats/[id] has their target
 * path captured in pendingRedirect, is redirected through the authentication flow,
 * and upon successful authentication lands on their intended conversation.
 */
import { useAuthStore } from "@/features/auth/store/authStore";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function ChatsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!user?.id || !accessToken) {
      if (pathname && pathname !== "/" && !pathname.startsWith("/(auth)")) {
        useAuthStore.getState().setPendingRedirect(pathname);
      }
      router.replace("/");
    }
  }, [user, accessToken, pathname, router]);

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
