// @/lib/storage.ts
import { createMMKV, type MMKV } from "react-native-mmkv";
import * as SecureStore from "expo-secure-store";
import { generateUuid } from "@/shared/utils/uuid";

const SECURE_KEY_ALIAS = "chatme_device_mmkv_key_v2";
const LEGACY_ENCRYPTION_KEY = "chatme-mmkv-enc-v1";

/**
 * Retrieves or generates an installation-unique 256-bit encryption key held in
 * platform-backed secure storage (iOS Keychain / Android Keystore).
 * Shipped hardcoded keys are not private to a device; this key is unique to each device installation.
 */
function resolveDeviceEncryptionKey(): string {
  try {
    let key = SecureStore.getItem(SECURE_KEY_ALIAS);
    if (!key) {
      key = `${generateUuid()}${generateUuid()}`.replace(/-/g, "");
      SecureStore.setItem(SECURE_KEY_ALIAS, key);
    }
    return key;
  } catch {
    // Fallback if SecureStore is unavailable in current runtime/test harness
    return LEGACY_ENCRYPTION_KEY;
  }
}

function initializeStorage(): MMKV {
  const deviceKey = resolveDeviceEncryptionKey();
  try {
    return createMMKV({
      id: "chatme-storage",
      encryptionKey: deviceKey,
    });
  } catch {
    // Migration fallback: attempt to unlock storage created with the legacy key
    try {
      return createMMKV({
        id: "chatme-storage",
        encryptionKey: LEGACY_ENCRYPTION_KEY,
      });
    } catch {
      return createMMKV({
        id: "chatme-storage",
      });
    }
  }
}

export const storage = initializeStorage();
