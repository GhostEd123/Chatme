import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import * as Contacts from "expo-contacts/legacy";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { useMatchContacts } from "@/features/home/hooks/useMatchContacts";
import { useCreateDirectConversation } from "@/features/home/hooks/useCreateDirectConversation";

const StyledFeather = withUniwind(Feather);

// ── Types ────────────────────────────────────────────────────────────────────
interface ContactItem {
  id: string;
  name: string;
  phone: string;
  imageUri?: string;
}

interface Section {
  title: string;
  data: ContactItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function groupByLetter(contacts: ContactItem[]): Section[] {
  const map: Record<string, ContactItem[]> = {};
  for (const c of contacts) {
    const letter = (c.name[0] ?? "#").toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    (map[key] ??= []).push(c);
  }
  return Object.keys(map)
    .sort()
    .map((title) => ({ title, data: map[title] }));
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function NewMessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [allContacts, setAllContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<
    "loading" | "granted" | "denied"
  >("loading");

  const matchContacts = useMatchContacts();
  const createDirect = useCreateDirectConversation();
  const [isMatching, setIsMatching] = useState(false);

  // ── Load contacts ──
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setPermissionStatus("denied");
        return;
      }
      setPermissionStatus("granted");
      setIsMatching(true);

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
        ],
      });
      
      const phoneNumbers = data
        .flatMap((c) => c.phoneNumbers?.map((p) => p.number) ?? [])
        .filter(Boolean) as string[];

      const uniquePhones = Array.from(new Set(phoneNumbers));

      if (uniquePhones.length > 0) {
        try {
          const res = await matchContacts.mutateAsync(uniquePhones);
          const mapped: ContactItem[] = res.matches.map((m) => ({
            id: m.user.id,
            name: m.user.displayName || "Unknown User",
            phone: m.matchedPhoneNumber,
            imageUri: m.user.avatarUrl || undefined,
          }));
          setAllContacts(mapped);
        } catch (err) {
          console.error("Failed to match contacts", err);
        }
      }
      setIsMatching(false);
    })();
  }, []);

  // ── Filter + group ──
  const sections: Section[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? allContacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q),
        )
      : allContacts;
    return groupByLetter(filtered);
  }, [allContacts, search]);

  const handleContactPress = useCallback(
    async (contact: ContactItem) => {
      try {
        const conv = await createDirect.mutateAsync({ participantId: contact.id });
        router.navigate(`/chats/${conv.id}`);
      } catch (err) {
        console.error("Failed to start conversation", err);
      }
    },
    [router, createDirect]
  );

  // ── Render item ──
  const renderItem = useCallback(
    ({ item }: { item: ContactItem }) => (
      <TouchableOpacity
        className="flex-row items-center justify-between py-3 border-b border-border/20 mx-4"
        onPress={() => handleContactPress(item)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <AvatarWidget url={item.imageUri} size={46} />
          <View className="ml-3 flex-1">
            <Text className="text-body-lg font-display-bold text-foreground">
              {item.name}
            </Text>
            {!!item.phone && (
              <Text className="text-body-sm text-muted mt-0.5">{item.phone}</Text>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={18} color="#6e8597" />
      </TouchableOpacity>
    ),
    [handleContactPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View className="px-4 py-1 bg-background">
        <Text className="text-body-sm font-display-bold text-muted uppercase tracking-wider">
          {section.title}
        </Text>
      </View>
    ),
    [],
  );

  // ── States ──
  if (permissionStatus === "loading" || isMatching) {
    return (
      <View className="flex-1 bg-background">
        <ContactsHeader router={router} search={search} setSearch={setSearch} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#57b77d" />
          <Text className="mt-3 text-body-md text-muted font-display-medium">
            {isMatching ? "Finding friends on ChatMe…" : "Loading contacts…"}
          </Text>
        </View>
      </View>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <View className="flex-1 bg-background">
        <ContactsHeader router={router} search={search} setSearch={setSearch} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-5">
            <Feather name="users" size={36} color="#57b77d" />
          </View>
          <Text className="text-h4 font-display-bold text-foreground text-center mb-2">
            Contacts access required
          </Text>
          <Text className="text-body-md text-muted text-center mb-6">
            Allow ChatMe to access your contacts so you can find friends and start
            conversations.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            className="bg-primary-400 rounded-2xl px-8 py-4"
          >
            <Text className="text-white font-display-bold text-body-md">
              Open Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ContactsHeader router={router} search={search} setSearch={setSearch} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={() => (
          <View className="px-4 py-4 flex-row gap-4">
            <TouchableOpacity
              className="flex-row items-center flex-1 bg-surface border border-border rounded-2xl px-4 py-3"
              onPress={() => router.push("/contacts/new")}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Feather name="user-plus" size={18} color="#57b77d" />
              </View>
              <Text className="text-body-md font-display-bold text-foreground">
                New Contact
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center flex-1 bg-surface border border-border rounded-2xl px-4 py-3">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Feather name="users" size={18} color="#57b77d" />
              </View>
              <Text className="text-body-md font-display-bold text-foreground">
                New Group
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-16">
            <Feather name="search" size={36} color="#6e8597" />
            <Text className="mt-3 text-body-md text-muted font-display-medium">
              No contacts found
            </Text>
          </View>
        )}
      />
    </View>
  );
}

// ── Shared header ──────────────────────────────────────────────────────────
function ContactsHeader({
  router,
  search,
  setSearch,
}: {
  router: ReturnType<typeof useRouter>;
  search: string;
  setSearch: (v: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="px-6 pb-5 bg-primary-400 dark:bg-surface"
      style={{ paddingTop: insets.top + 16 }}
    >
      {/* Title row */}
      <View className="flex-row items-center mb-5">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-h3 font-display-bold text-white flex-1">
          Contact
        </Text>
      </View>

      {/* Search */}
      <View
        className="flex-row items-center bg-white rounded-2xl px-4 py-3"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        }}
      >
        <Feather name="search" size={18} color="#57b77d" />
        <TextInput
          className="flex-1 ml-3 font-display-medium text-foreground text-body-md"
          placeholder="Search people..."
          placeholderTextColor="#6e8597"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color="#6e8597" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
