import AvatarWidget from "@/shared/widgets/AvatarWidget";
import Feather from "@expo/vector-icons/Feather";
import * as Contacts from "expo-contacts/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Country codes (simple subset) ────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+62", flag: "🇮🇩" },
  { code: "+61", flag: "🇦🇺" },
  { code: "+234", flag: "🇳🇬" },
];

export default function NewContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isActive =
    firstName.trim().length > 0 || lastName.trim().length > 0 || phone.length > 0;

  // ── Avatar picker ──
  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow photo access to set an avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // ── Save contact ──
  const handleSave = async () => {
    if (!firstName.trim() && !lastName.trim()) {
      Alert.alert("Name required", "Please enter at least a first or last name.");
      return;
    }
    setSaving(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Allow contacts access to save this contact.",
        );
        setSaving(false);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Contacts.addContactAsync as any)({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumbers: phone.trim()
          ? [
              {
                number: `${countryCode.code}${phone.trim()}`,
                label: "mobile",
                isPrimary: true,
              },
            ]
          : [],
        contactType: Contacts.ContactTypes.Person,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      Alert.alert("Saved!", `${firstName} ${lastName} added to your contacts.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Could not save contact. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View
        className="px-5 pb-6 bg-primary-400 items-center"
        style={{ paddingTop: insets.top + 12 }}
      >
        {/* Nav row */}
        <View className="w-full flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-h3 font-display-bold text-white flex-1 text-center mr-8">
            New Contact
          </Text>
        </View>

        {/* Avatar */}
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
          <View className="relative">
            {avatarUri ? (
              <AvatarWidget url={avatarUri} size={96} />
            ) : (
              <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center">
                <Feather name="user" size={40} color="rgba(255,255,255,0.7)" />
              </View>
            )}
            {/* Camera badge */}
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 border-2 border-white items-center justify-center">
              <Feather name="camera" size={14} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* First Name */}
        <Text className="text-body-sm font-display-bold text-foreground mb-2 mt-2">
          First Name
        </Text>
        <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 py-3 mb-5">
          <Feather name="user" size={16} color="#6e8597" />
          <TextInput
            className="flex-1 ml-3 text-body-md text-foreground font-display-medium"
            placeholder="First Name"
            placeholderTextColor="#6e8597"
            value={firstName}
            onChangeText={setFirstName}
            autoCorrect={false}
          />
        </View>

        {/* Last Name */}
        <Text className="text-body-sm font-display-bold text-foreground mb-2">
          Last Name
        </Text>
        <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 py-3 mb-5">
          <Feather name="user" size={16} color="#6e8597" />
          <TextInput
            className="flex-1 ml-3 text-body-md text-foreground font-display-medium"
            placeholder="Last Name"
            placeholderTextColor="#6e8597"
            value={lastName}
            onChangeText={setLastName}
            autoCorrect={false}
          />
        </View>

        {/* Phone */}
        <Text className="text-body-sm font-display-bold text-foreground mb-2">
          Phone Number
        </Text>
        <View
          className={`flex-row items-center bg-surface border rounded-2xl overflow-hidden mb-6 ${
            isActive && phone.length > 0
              ? "border-primary-400"
              : "border-border"
          }`}
        >
          {/* Country code selector */}
          <TouchableOpacity
            className="flex-row items-center px-3 py-3 border-r border-border bg-background"
            onPress={() => {
              const idx = COUNTRY_CODES.indexOf(countryCode);
              setCountryCode(
                COUNTRY_CODES[(idx + 1) % COUNTRY_CODES.length],
              );
            }}
          >
            <Text className="text-body-md mr-1">{countryCode.flag}</Text>
            <Text className="text-body-md font-display-bold text-foreground">
              {countryCode.code}
            </Text>
          </TouchableOpacity>
          <TextInput
            className="flex-1 px-4 py-3 text-body-md text-foreground font-display-medium"
            placeholder="Phone number"
            placeholderTextColor="#6e8597"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* QR Code stub */}
        <TouchableOpacity className="items-center mb-8" activeOpacity={0.7}>
          <Feather name="grid" size={28} color="#57b77d" />
          <Text className="text-body-sm font-display-medium text-primary-400 mt-2">
            Or add via QR code
          </Text>
        </TouchableOpacity>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isActive}
          activeOpacity={0.85}
          style={{
            backgroundColor:
              isActive && !saving ? "#57b77d" : "#abdbbe",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text className="text-white font-display-bold text-body-lg">
            {saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
