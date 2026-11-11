import { storage } from "@/core/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const zustandMmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

type DraftState = {
  drafts: Record<string, string>;
  setDraft: (conversationId: string, text: string) => void;
  clearDraft: (conversationId: string) => void;
  clearAllDrafts: () => void;
};

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (conversationId, text) =>
        set((s) => ({ drafts: { ...s.drafts, [conversationId]: text } })),
      clearDraft: (conversationId) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[conversationId];
          return { drafts: next };
        }),
      clearAllDrafts: () => set({ drafts: {} }),
    }),
    {
      name: "chatme-composer-drafts",
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);

