// @/lib/storage.ts
import { createMMKV } from "react-native-mmkv";

// react-native-mmkv v4 exposes a factory (`createMMKV`) instead of the
// `new MMKV()` constructor used in v2/v3.
// Use a fixed encryption key as a baseline improvement.
// TODO: Derive from secure device storage (expo-secure-store) during app bootstrap.
export const storage = createMMKV({
  id: "chatme-storage",
  encryptionKey: "chatme-mmkv-enc-v1",
});
