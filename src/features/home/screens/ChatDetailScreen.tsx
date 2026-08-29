import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Asset,
  AssetField,
  MediaType,
  Query,
  requestPermissionsAsync as requestMediaPermissionsAsync,
} from "expo-media-library";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);

// ── Mock messages ─────────────────────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: "1",
    text: "Habitant elit pellentesque curabitur morbi sit fusce elit",
    isMe: false,
    time: "18:25",
  },
  {
    id: "2",
    text: "Gravida lectus semper orci",
    isMe: true,
    time: "19:40",
  },
  {
    id: "3",
    text: "Egestas interdum orci commodo faucibus pretium, neque etiam",
    isMe: false,
    time: "19:40",
  },
  {
    id: "4",
    text: "Orci maecenas hendrerit mattis consectetur. Mauris.",
    isMe: false,
    time: "19:40",
  },
];

// ── Menu action type ──────────────────────────────────────────────────────────
interface MediaMenuAction {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState("");
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [recentPhotos, setRecentPhotos] = useState<
    { id: string; uri: string }[]
  >([]);
  const [mediaPermission, setMediaPermission] = useState(false);

  const panelAnim = useRef(new Animated.Value(0)).current;

  // ── Load recent photos (new v57 Query API) ──
  useEffect(() => {
    (async () => {
      const { status } = await requestMediaPermissionsAsync();
      if (status === "granted") {
        setMediaPermission(true);
        try {
          const assets: Asset[] = await new Query()
            .limit(10)
            .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
            .exe();
      
          const withUris = await Promise.all(
            assets.map(async (a) => ({ id: a.id, uri: await a.getUri() })),
          );
          setRecentPhotos(withUris);
        } catch {
 
        }
      }
    })();
  }, []);

  // ── Animate panel ──
  const openPanel = () => {
    setShowMediaPanel(true);
    Animated.spring(panelAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowMediaPanel(false));
  };

  const togglePanel = () => {
    if (showMediaPanel) {
      closePanel();
    } else {
      openPanel();
    }
  };

  // ── Menu actions ──
  const menuActions: MediaMenuAction[] = [
    {
      icon: "image",
      label: "Photo or Gallery",
      onPress: async () => {
        closePanel();
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow photo access.");
          return;
        }
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images", "videos"],
          allowsEditing: false,
          quality: 0.9,
        });
      },
    },
    {
      icon: "file-text",
      label: "Document",
      onPress: async () => {
        closePanel();
        await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
      },
    },
    {
      icon: "map-pin",
      label: "Location",
      onPress: () => {
        closePanel();
        Alert.alert("Location", "Location sharing coming soon!");
      },
    },
    {
      icon: "user",
      label: "Contact",
      onPress: () => {
        closePanel();
        router.push("/chats/new");
      },
    },
  ];

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 0],
  });

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View
        className="px-4 pb-4 flex-row items-center bg-primary-400 dark:bg-surface"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <AvatarWidget url="https://i.pravatar.cc/150?u=12" size={40} isOnline />
        <View className="ml-3 flex-1">
          <Text className="text-body-lg font-display-bold text-white">
            Keanu Murphy
          </Text>
          <Text className="text-body-sm text-white/80">Active 5 minutes ago</Text>
        </View>
        <TouchableOpacity className="mr-5">
          <Feather name="video" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Feather name="phone" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <FlatList
        data={MOCK_MESSAGES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <View
            className={`mb-4 max-w-[78%] ${item.isMe ? "self-end" : "self-start"}`}
          >
            <View
              className={`px-4 py-3 rounded-2xl ${
                item.isMe
                  ? "bg-primary-400 rounded-tr-sm"
                  : "bg-surface border border-border/50 rounded-tl-sm"
              }`}
            >
              <Text
                className={`text-body-md font-display-medium ${
                  item.isMe ? "text-white" : "text-foreground"
                }`}
              >
                {item.text}
              </Text>
            </View>
            <View
              className={`flex-row items-center mt-1 gap-1 ${
                item.isMe ? "justify-end" : "justify-start"
              }`}
            >
              <Text className="text-body-xs text-muted">{item.time}</Text>
              {item.isMe && (
                <Feather name="check-circle" size={11} color="#57b77d" />
              )}
            </View>
          </View>
        )}
      />

      {/* ── Input bar + media panel ── */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        {/* Media panel */}
        {showMediaPanel && (
          <Animated.View
            style={{
              transform: [{ translateY: panelTranslateY }],
              opacity: panelAnim,
            }}
            className="bg-white dark:bg-surface border-t border-border/50 mx-3 mb-2 rounded-3xl overflow-hidden"
            pointerEvents="box-none"
          >
            {/* Photo strip */}
            {mediaPermission && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="border-b border-border/30"
                contentContainerStyle={{ padding: 10, gap: 8 }}
              >
                {/* Camera shortcut */}
                <TouchableOpacity
                  onPress={async () => {
                    closePanel();
                    const { status } =
                      await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== "granted") return;
                    await ImagePicker.launchCameraAsync({ quality: 0.9 });
                  }}
                  className="w-20 h-20 rounded-2xl bg-neutral-100 items-center justify-center border border-border/30 overflow-hidden"
                >
                  <Feather name="camera" size={24} color="#57b77d" />
                </TouchableOpacity>

                {/* Recent photos */}
                {recentPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    className="w-20 h-20 rounded-2xl overflow-hidden"
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={{ width: 80, height: 80 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}

                {/* Placeholder tiles if no photos */}
                {recentPhotos.length === 0 &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <View
                      key={i}
                      className="w-20 h-20 rounded-2xl bg-neutral-100 border border-border/20"
                    />
                  ))}
              </ScrollView>
            )}

            {/* Menu options */}
            <View className="py-2">
              {menuActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                  className="flex-row items-center px-5 py-3.5"
                >
                  <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-4">
                    <Feather name={action.icon} size={18} color="#57b77d" />
                  </View>
                  <Text className="text-body-lg font-display-medium text-foreground">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Text input bar */}
        <View
          className="px-4 py-3 bg-surface border-t border-border/50 flex-row items-center"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <TouchableOpacity onPress={togglePanel} className="mr-3">
            <Feather
              name={showMediaPanel ? "x-circle" : "paperclip"}
              size={22}
              color={showMediaPanel ? "#57b77d" : "#6e8597"}
            />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center bg-background rounded-full px-4 py-2 border border-border">
            <TextInput
              className="flex-1 text-body-md text-foreground"
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={setMessage}
              multiline
              onFocus={() => {
                if (showMediaPanel) closePanel();
              }}
            />
            <TouchableOpacity className="ml-2">
              <Feather name="smile" size={20} color="#6e8597" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="ml-3 w-10 h-10 bg-primary-400 rounded-full items-center justify-center">
            <Feather
              name={message.trim() ? "send" : "mic"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>
    </View>
  );
}
