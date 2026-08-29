import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Types ─────────────────────────────────────────────────────────────────────
type CallDirection = "incoming" | "outgoing" | "missed";
type CallType = "voice" | "video";

interface CallRecord {
  id: string;
  name: string;
  avatarUrl: string;
  direction: CallDirection;
  type: CallType;
  date: string;
  time: string;
  duration?: string; // undefined = missed
}

interface Favourite {
  id: string;
  name: string;
  avatarUrl: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const FAVOURITES: Favourite[] = [
  { id: "f1", name: "Jane Cooper", avatarUrl: "https://i.pravatar.cc/150?u=2" },
  {
    id: "f2",
    name: "Darrell Steward",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: "f3",
    name: "Theresa Webb",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: "f4",
    name: "Ronald Richards",
    avatarUrl: "https://i.pravatar.cc/150?u=6",
  },
];

const ALL_CALLS: CallRecord[] = [
  {
    id: "c1",
    name: "Darrell Steward",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    direction: "incoming",
    type: "voice",
    date: "Today",
    time: "11:47 PM",
    duration: "4m 23s",
  },
  {
    id: "c2",
    name: "Jane Cooper",
    avatarUrl: "https://i.pravatar.cc/150?u=2",
    direction: "missed",
    type: "voice",
    date: "Today",
    time: "11:23 PM",
  },
  {
    id: "c3",
    name: "Theresa Webb",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
    direction: "outgoing",
    type: "video",
    date: "Today",
    time: "10:17 PM",
    duration: "12m 05s",
  },
  {
    id: "c4",
    name: "Annette Black",
    avatarUrl: "https://i.pravatar.cc/150?u=5",
    direction: "missed",
    type: "voice",
    date: "Today",
    time: "08:13 PM",
  },
  {
    id: "c5",
    name: "Guy Hawkins",
    avatarUrl: "https://i.pravatar.cc/150?u=7",
    direction: "incoming",
    type: "voice",
    date: "Yesterday",
    time: "09:30 PM",
    duration: "2m 11s",
  },
  {
    id: "c6",
    name: "Ronald Richards",
    avatarUrl: "https://i.pravatar.cc/150?u=6",
    direction: "outgoing",
    type: "video",
    date: "Yesterday",
    time: "06:15 PM",
    duration: "28m 47s",
  },
  {
    id: "c7",
    name: "Jane Cooper",
    avatarUrl: "https://i.pravatar.cc/150?u=2",
    direction: "missed",
    type: "voice",
    date: "Monday",
    time: "03:00 PM",
  },
  {
    id: "c8",
    name: "Work Team",
    avatarUrl: "https://i.pravatar.cc/150?u=4",
    direction: "incoming",
    type: "video",
    date: "Monday",
    time: "10:00 AM",
    duration: "45m 30s",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupCallsByDate(
  calls: CallRecord[],
): { title: string; data: CallRecord[] }[] {
  const map: Record<string, CallRecord[]> = {};
  for (const call of calls) {
    (map[call.date] ??= []).push(call);
  }
  return Object.keys(map).map((title) => ({ title, data: map[title] }));
}

function directionIcon(
  dir: CallDirection,
  type: CallType,
): { name: React.ComponentProps<typeof Feather>["name"]; color: string } {
  if (dir === "missed") return { name: "phone-missed", color: "#e8503a" };
  if (dir === "incoming")
    return {
      name: type === "video" ? "video" : "phone-incoming",
      color: "#57b77d",
    };
  return {
    name: type === "video" ? "video" : "phone-outgoing",
    color: "#57b77d",
  };
}

// ── CallRow ───────────────────────────────────────────────────────────────────
function CallRow({ call }: { call: CallRecord }) {
  const icon = directionIcon(call.direction, call.type);
  const isMissed = call.direction === "missed";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-row items-center px-5 py-3.5"
    >
      <AvatarWidget url={call.avatarUrl} size={48} />
      <View className="flex-1 ml-3">
        <Text
          className={`text-body-lg font-display-bold ${isMissed ? "text-red-400" : "text-foreground"}`}
        >
          {call.name}
        </Text>
        <View className="flex-row items-center mt-0.5 gap-1.5">
          <Feather name={icon.name} size={13} color={icon.color} />
          <Text className="text-body-sm text-muted font-display-medium">
            {call.direction === "missed"
              ? "Missed"
              : call.direction === "incoming"
                ? "Incoming"
                : "Outgoing"}{" "}
            · {call.type === "video" ? "Video" : "Voice"}
            {call.duration ? ` · ${call.duration}` : ""}
          </Text>
        </View>
      </View>
      <View className="items-end gap-1">
        <Text className="text-body-xs text-muted">{call.time}</Text>
        <TouchableOpacity
          onPress={() => Alert.alert("Calling", `Calling ${call.name}…`)}
          className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center"
        >
          <Feather
            name={call.type === "video" ? "video" : "phone"}
            size={15}
            color="#57b77d"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function CallsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const sections = groupCallsByDate(ALL_CALLS);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View
        className="px-5 pb-5 bg-primary-400 dark:bg-surface"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-h2 font-display-bold text-white">Calls</Text>
          <View className="flex-row gap-4">
            <TouchableOpacity>
              <Feather name="search" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert("New Call", "Select a contact to call.")}
            >
              <Feather name="phone-call" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View className="px-5 py-2 bg-background border-b border-border/30">
            <Text className="text-body-sm font-display-bold text-muted uppercase tracking-wider">
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => <CallRow call={item} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <>
            {/* ── Favourites ── */}
            <View className="pt-4 pb-2">
              <View className="flex-row items-center justify-between px-5 mb-3">
                <Text className="text-body-md font-display-bold text-foreground">
                  Favourites
                </Text>
                <TouchableOpacity>
                  <Text className="text-body-sm font-display-medium text-primary-400">
                    See all
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={FAVOURITES}
                keyExtractor={(f) => f.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="items-center"
                    activeOpacity={0.8}
                    onPress={() =>
                      Alert.alert("Calling", `Calling ${item.name}…`)
                    }
                  >
                    <View className="relative">
                      <AvatarWidget url={item.avatarUrl} size={60} isOnline />
                      {/* Call badge */}
                      <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-400 border-2 border-background items-center justify-center">
                        <Feather name="phone" size={11} color="#fff" />
                      </View>
                    </View>
                    <Text
                      className="text-body-xs font-display-medium text-foreground mt-2 max-w-[60px] text-center"
                      numberOfLines={1}
                    >
                      {item.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* ── Divider ── */}
            <View className="mx-5 my-2 border-t border-border/40" />
            <View className="px-5 pb-1">
              <Text className="text-body-md font-display-bold text-foreground">
                Recent
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-5">
              <Feather name="phone-off" size={34} color="#57b77d" />
            </View>
            <Text className="text-h4 font-display-bold text-foreground text-center mb-2">
              No recent calls
            </Text>
            <Text className="text-body-md text-muted text-center">
              Your recent calls will appear here.
            </Text>
          </View>
        }
      />

      {/* ── New Call FAB ── */}
      <Pressable
        onPress={() => Alert.alert("New Call", "Select a contact to call.")}
        style={{
          position: "absolute",
          right: 24,
          bottom: insets.bottom + 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#57b77d",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Feather name="phone-call" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
