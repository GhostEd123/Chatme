import { Stack } from "expo-router";
import { View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function AuthLayout() {
  const backgroundColor = useCSSVariable("--color-background") as
    string | undefined;
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: backgroundColor ?? "#F5F7F9" }, // fixed: matches --color-background light value
        }}
      >
        <Stack.Screen name="login" />
      </Stack>
    </View>
  );
}
