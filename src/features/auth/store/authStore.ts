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
  accessToken: string | null;
  refreshToken: string | null;
  /**
   * Transient onboarding state: set during the OTP flow, never persisted.
   * Use this instead of storing phone/challengeId on the main user object.
   */
  onboarding: { phone: string; challengeId: string | null } | null;
  setUser: (user: User | null) => void;
  /** Only updates an existing user — will not create a phantom user with an empty ID. */
  updateUser: (data: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  setOnboarding: (phone: string, challengeId: string) => void;
  clearOnboarding: () => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      onboarding: null,
      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => {
          // Guard: only update if a real user already exists (non-empty ID)
          if (!state.user) return state;
          return { user: { ...state.user, ...data } };
        }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      setOnboarding: (phone, challengeId) =>
        set({ onboarding: { phone, challengeId } }),
      clearOnboarding: () => set({ onboarding: null }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          onboarding: null,
        }),
    }),
    {
      name: "chatme-auth-storage",
      storage: createJSONStorage(() => zustandMmkvStorage),
      // Only persist the authenticated identity — onboarding state and
      // challengeId are intentionally excluded.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
