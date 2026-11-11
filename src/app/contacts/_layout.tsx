/**
 * Auth guard for all /contacts/* routes.
 * Prevents unauthenticated entry into contact creation.
 */
import { useAuthStore } from "@/features/auth/store/authStore";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function ContactsLayout() {
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
      <Stack.Screen name="new" options={{ headerShown: false }} />
    </Stack>
  );
}

