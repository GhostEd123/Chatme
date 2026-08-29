import { useAppReady } from "@/core/hooks/useAppReady";
import AppProviders from "@/core/providers/AppProviders";
import { toastConfig } from "@/shared/constants/toastConfig";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useCSSVariable } from "uniwind";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useAppReady();

  const backgroundColor = useCSSVariable("--color-background") as
    string | undefined;

  const background = backgroundColor ?? "#F5F7F9";

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
      <View
        style={{
          flex: 1,
          backgroundColor: background,
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: background,
            },
            animation: "slide_from_right",
            animationTypeForReplace: "push",
            animationDuration: 300,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Sub-screens rendered outside (tabs) so the tab bar never shows */}
          <Stack.Screen name="chats/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chats/new" options={{ headerShown: false }} />
          <Stack.Screen name="contacts/new" options={{ headerShown: false }} />
          <Stack.Screen name="settings/appearance" options={{ headerShown: false }} />
          <Stack.Screen name="settings/profile" options={{ headerShown: false }} />
          <Stack.Screen name="settings/faq" options={{ headerShown: false }} />
          <Stack.Screen name="settings/last-call" options={{ headerShown: false }} />
          <Stack.Screen name="settings/qr-code" options={{ headerShown: false }} />
          <Stack.Screen name="settings/star-message" options={{ headerShown: false }} />
          <Stack.Screen name="settings/data-storage" options={{ headerShown: false }} />
          <Stack.Screen name="settings/data-storage/manage" options={{ headerShown: false }} />
          <Stack.Screen name="settings/data-storage/photos" options={{ headerShown: false }} />
          <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
          <Stack.Screen name="settings/privacy/blocked-contact" options={{ headerShown: false }} />
          <Stack.Screen name="settings/privacy/face-id" options={{ headerShown: false }} />
          <Stack.Screen name="settings/privacy/last-seen" options={{ headerShown: false }} />
        </Stack>
      </View>
      <Toast config={toastConfig} />
    </AppProviders>
    </GestureHandlerRootView>
  );
}
