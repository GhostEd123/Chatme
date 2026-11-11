/**
 * Auth guard for all /settings/* private sibling routes.
 * Prevents unauthenticated direct entry into settings screens.
 */
import { useAuthStore } from "@/features/auth/store/authStore";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function SettingsLayout() {
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

  if (!user?.id || !accessToken) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#57b77d" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="appearance" options={{ headerShown: false }} />
      <Stack.Screen name="faq" options={{ headerShown: false }} />
      <Stack.Screen name="last-call" options={{ headerShown: false }} />
      <Stack.Screen name="qr-code" options={{ headerShown: false }} />
      <Stack.Screen name="star-message" options={{ headerShown: false }} />
      <Stack.Screen name="data-storage/index" options={{ headerShown: false }} />
      <Stack.Screen name="data-storage/manage" options={{ headerShown: false }} />
      <Stack.Screen name="data-storage/photos" options={{ headerShown: false }} />
      <Stack.Screen name="privacy/index" options={{ headerShown: false }} />
      <Stack.Screen name="privacy/blocked-contact" options={{ headerShown: false }} />
      <Stack.Screen name="privacy/face-id" options={{ headerShown: false }} />
      <Stack.Screen name="privacy/last-seen" options={{ headerShown: false }} />
    </Stack>
  );
}

