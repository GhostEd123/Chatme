// @/lib/storage.ts
import { MMKV } from "react-native-mmkv";

// Use a fixed encryption key as a baseline improvement.
// TODO: Derive from secure device storage (expo-secure-store) during app bootstrap.
export const storage = new MMKV({
  id: "chatme-storage",
  encryptionKey: "chatme-mmkv-enc-v1",
});
