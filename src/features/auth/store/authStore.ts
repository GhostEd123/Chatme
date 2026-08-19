import { storage } from "@/core/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const zustandMmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

export type User = {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  hasPinSetup?: boolean;
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: "chatme-auth-storage",
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
