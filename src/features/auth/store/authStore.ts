import { storage } from "@/core/lib/storage";
import { bumpSessionGeneration } from "@/core/lib/session";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const zustandMmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => {
    storage.remove(name);
  },
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
  /**
   * Transient: a private route the user tried to open while signed out
   * (e.g. a cold-start deep link into /chats/123). After authentication the
   * app navigates here instead of the default chat list. Never persisted.
   */
  pendingRedirect: string | null;
  setUser: (user: User | null) => void;
  /** Only updates an existing user — will not create a phantom user with an empty ID. */
  updateUser: (data: Partial<User>) => void;
  /**
   * Begin a brand-new authenticated session. Bumps the session generation so
   * that any async work still running for a previous account is discarded.
   */
  startSession: (accessToken: string, refreshToken: string, user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  setOnboarding: (phone: string, challengeId: string) => void;
  clearOnboarding: () => void;
  setPendingRedirect: (path: string | null) => void;
  /** End the current session (logout or definitive credential rejection). */
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      onboarding: null,
      pendingRedirect: null,
      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => {
          // Guard: only update if a real user already exists (non-empty ID)
          if (!state.user) return state;
          return { user: { ...state.user, ...data } };
        }),
      startSession: (accessToken, refreshToken, user) => {
        bumpSessionGeneration();
        set({ accessToken, refreshToken, user, onboarding: null });
      },
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      setOnboarding: (phone, challengeId) =>
        set({ onboarding: { phone, challengeId } }),
      clearOnboarding: () => set({ onboarding: null }),
      setPendingRedirect: (path) => set({ pendingRedirect: path }),
      clearSession: () => {
        bumpSessionGeneration();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          onboarding: null,
        });
      },
    }),
    {
      name: "chatme-auth-storage",
      storage: createJSONStorage(() => zustandMmkvStorage),
      // Only persist the authenticated identity — onboarding state,
      // challengeId and pendingRedirect are intentionally excluded.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

/** True once a verified server identity with tokens is present. */
export function selectIsAuthenticated(s: AuthState): boolean {
  return !!s.user?.id && !!s.accessToken;
}
