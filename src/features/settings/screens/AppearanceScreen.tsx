import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeStore, THEME_PALETTE, ThemeColor, AppIconName } from "@/core/store/themeStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setAppIcon as setNativeAppIcon } from "@howincodes/expo-dynamic-app-icon";


// ─── Theme image assets ────────────────────────────────────────────────────
const THEME_IMAGES: Record<ThemeColor, ImageSourcePropType> = {
  green: require("../../../../assets/green.png"),
  blue: require("../../../../assets/blue.png"),
  red: require("../../../../assets/red.png"),
  orange: require("../../../../assets/orange.png"),
};

// ─── App icon image assets ─────────────────────────────────────────────────
const ICON_IMAGES: Record<AppIconName, ImageSourcePropType> = {
  green: require("../../../../assets/green_icon.png"),
  blue: require("../../../../assets/blue_icon.png"),
  red: require("../../../../assets/red_icon.png"),
  orange: require("../../../../assets/orange_icon.png"),
};

// Label & border colour per theme
const THEME_META: Record<ThemeColor, { label: string; color: string }> = {
  green:  { label: "Green",  color: "#57b77d" },
  blue:   { label: "Blue",   color: "#007cff" },
  red:    { label: "Red",    color: "#e8503a" },
  orange: { label: "Orange", color: "#ffb23f" },
};

const THEMES: ThemeColor[] = ["green", "blue", "red", "orange"];

export default function AppearanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { theme, appIcon, nightMode, largeEmoji, setTheme, setAppIcon, setNightMode, setLargeEmoji } =
    useThemeStore();

  const primary = THEME_PALETTE[theme].primary;

  const handleSetTheme = (t: ThemeColor) => {
    setTheme(t);
  };

  const handleSetAppIcon = async (icon: AppIconName) => {
    setAppIcon(icon);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await setNativeAppIcon(icon as any);
    } catch (_) {
      // setNativeAppIcon may throw in Expo Go; silently ignore
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        style={{ backgroundColor: primary, paddingTop: insets.top + 8, paddingBottom: 14 }}
        className="px-5 flex-row items-center"
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white">Appearance</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Chat preview ─────────────────────────────────────────────── */}
        <View
          className="mx-4 mt-4 mb-6 rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#e8efe9", minHeight: 130 }}
        >
          {/* Decorative ghost icons */}
          <View style={{ position: "absolute", inset: 0, opacity: 0.08 }} pointerEvents="none">
            <Feather name="gift" size={40} color="#333" style={{ position: "absolute", top: 8, right: 60 }} />
            <Feather name="star" size={32} color="#333" style={{ position: "absolute", top: 30, right: 20 }} />
            <Feather name="gift" size={28} color="#333" style={{ position: "absolute", bottom: 10, left: 10 }} />
          </View>

          {/* Received bubble */}
          <View className="flex-row items-end mt-6 mx-4 mb-2">
            <View
              className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]"
              style={{ backgroundColor: "#fff" }}
            >
              <Text className="text-body-md text-neutral-800 font-display-regular">
                Habitant elit pellentesque curabitur morbi sit fusce elit
              </Text>
            </View>
            <Text className="text-[11px] text-neutral-400 font-display-regular ml-2 mb-1">18:25</Text>
          </View>

          {/* Sent bubble */}
          <View className="flex-row-reverse items-end mx-4 mb-5">
            <View
              className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-[65%]"
              style={{ backgroundColor: primary }}
            >
              <Text className="text-white text-body-md font-display-regular">
                Gravida lectus semper orci
              </Text>
            </View>
            <Text className="text-[11px] text-neutral-400 font-display-regular mr-2 mb-1">19:40</Text>
          </View>
        </View>

        {/* ── Select a Theme ───────────────────────────────────────────── */}
        <View className="px-4 mb-6">
          <Text className="text-h4 font-display-bold text-foreground mb-4">Select a Theme</Text>
          <View className="flex-row justify-between">
            {THEMES.map((t) => {
              const isSelected = theme === t;
              const meta = THEME_META[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleSetTheme(t)}
                  activeOpacity={0.85}
                  style={{ alignItems: "center", width: "23%" }}
                >
                  {/* Card */}
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 0.8,
                      borderRadius: 14,
                      borderWidth: isSelected ? 2.5 : 1.5,
                      borderColor: isSelected ? meta.color : "#e0e0e0",
                      overflow: "hidden",
                      backgroundColor: "#fff",
                    }}
                  >
                    <Image
                      source={THEME_IMAGES[t]}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />

                    {/* Selection checkmark overlay */}
                    {isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: meta.color,
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 3,
                        }}
                      >
                        <Feather name="check" size={13} color="#fff" />
                      </View>
                    )}

                    {/* Bottom colour label bar (only selected) */}
                    {isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: meta.color,
                          paddingVertical: 5,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontFamily: "SFProDisplay-Bold" }}>
                          {meta.label}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Label below card (unselected only) */}
                  {!isSelected && (
                    <Text
                      style={{ color: meta.color, fontSize: 12, marginTop: 5, fontFamily: "SFProDisplay-Medium" }}
                    >
                      {meta.label}
                    </Text>
                  )}
                  {isSelected && <View style={{ height: 17 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Toggles ──────────────────────────────────────────────────── */}
        <View className="mx-4 bg-surface rounded-2xl mb-6 overflow-hidden">
          {/* Night Mode */}
          <View className="flex-row items-center px-4 py-4 border-b border-border/50">
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: primary + "20" }}
            >
              <Feather name="moon" size={18} color={primary} />
            </View>
            <Text className="flex-1 text-body-lg font-display-medium text-foreground">Night Mode</Text>
            <Switch
              value={nightMode}
              onValueChange={setNightMode}
              trackColor={{ false: "#d1d5db", true: primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Large Emoji */}
          <View className="flex-row items-center px-4 py-4">
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: primary + "20" }}
            >
              <Feather name="smile" size={18} color={primary} />
            </View>
            <Text className="flex-1 text-body-lg font-display-medium text-foreground">Large Emoji</Text>
            <Switch
              value={largeEmoji}
              onValueChange={setLargeEmoji}
              trackColor={{ false: "#d1d5db", true: primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── App Icon ─────────────────────────────────────────────────── */}
        <View className="px-4">
          <Text className="text-h4 font-display-bold text-foreground mb-4">App Icon</Text>
          <View className="flex-row justify-between">
            {THEMES.map((t) => {
              const isSelected = appIcon === t;
              const meta = THEME_META[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleSetAppIcon(t)}
                  activeOpacity={0.85}
                  style={{ alignItems: "center", width: "23%" }}
                >
                  {/* Icon image */}
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 18,
                      borderWidth: isSelected ? 2.5 : 1.5,
                      borderColor: isSelected ? meta.color : "#e0e0e0",
                      overflow: "hidden",
                      backgroundColor: "#fff",
                    }}
                  >
                    <Image
                      source={ICON_IMAGES[t]}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />

                    {/* Selection overlay */}
                    {isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: meta.color + "18",
                        }}
                      />
                    )}
                  </View>

                  <Text
                    style={{
                      color: isSelected ? meta.color : "#6e8597",
                      fontSize: 12,
                      marginTop: 6,
                      fontFamily: isSelected ? "SFProDisplay-Bold" : "SFProDisplay-Medium",
                    }}
                  >
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
