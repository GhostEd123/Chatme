// @/core/lib/persister.ts
import { storage } from "@/core/lib/storage";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const clientStoragePersister = createSyncStoragePersister({
  storage: {
    setItem: (key, value) => storage.set(key, value),
    getItem: (key) => storage.getString(key) ?? null,
    removeItem: (key) => storage.remove(key),
  },
});
