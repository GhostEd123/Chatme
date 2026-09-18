import { storage } from "@/core/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const zustandMmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
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
  accessToken: string | null;
  refreshToken: string | null;
  /** Transient: set during OTP flow, cleared after verify */
  challengeId: string | null;
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  setChallengeId: (id: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      challengeId: null,
      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...data }
            : ({ id: "", name: "", phone: "", ...data } as User),
        })),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      setChallengeId: (challengeId) => set({ challengeId }),
      clearSession: () =>
        set({ user: null, accessToken: null, refreshToken: null, challengeId: null }),
    }),
    {
      name: "chatme-auth-storage",
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
