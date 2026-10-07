// TabsLayout.tsx
import {
  TABS,
  TabBarLabelSize,
  TabBarLayout,
} from "@/shared/constants/TabsConfig";
import { Tabs } from "expo-router";
import { ColorValue, Text, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgProps } from "react-native-svg";
import { useCSSVariable } from "uniwind";
import { useThemeStore, THEME_PALETTE } from "@/core/store/themeStore";

function renderIcon(Icon: React.FC<SvgProps>, focused: boolean) {
  return (
    <Icon
      className={focused ? "text-primary" : "text-muted"}
      style={{ width: 24, height: 24 }}
      width={24}
      height={24}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [surface, neutral300, fontMd, fontBold] = useCSSVariable([
    "--color-surface",
    "--color-neutral-300",
    "--font-display-medium",
    "--font-display-bold",
  ]);

  const activeTheme = useThemeStore((s) => s.theme);
  const primaryColor = THEME_PALETTE[activeTheme].primary;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          ...(TabBarLayout as ViewStyle),
          backgroundColor: surface as string,
          paddingBottom: insets.bottom + 10,
        },
        tabBarActiveTintColor: primaryColor as ColorValue,
        tabBarInactiveTintColor: neutral300 as ColorValue,
        tabBarBackground: () => null,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={{
                  fontSize: TabBarLabelSize,
                  marginTop: 4,
                  fontFamily:
                    (focused ? (fontBold as string) : (fontMd as string)) ??
                    "System",
                  color,
                }}
              >
                {tab.label}
              </Text>
            ),
            tabBarIcon: ({ focused }) => renderIcon(tab.icon, focused),
            headerShown: false,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate(tab.name, {
                screen: tab.initialRoute ?? "index",
              });
            },
          })}
        />
      ))}
    </Tabs>
  );
}
