import { storage } from "@/core/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeColor = "green" | "blue" | "red" | "orange";
export type AppIconName = "green" | "blue" | "red" | "orange";

/** Per-theme primary palette values */
export const THEME_PALETTE: Record<
  ThemeColor,
  { primary: string; primaryLight: string; primaryTint: string; primary400: string }
> = {
  green: {
    primary: "#57b77d",
    primaryLight: "#abdbbe",
    primaryTint: "#f5fbf7",
    primary400: "#57b77d",
  },
  blue: {
    primary: "#007cff",
    primaryLight: "#aad3ff",
    primaryTint: "#ecf5ff",
    primary400: "#007cff",
  },
  red: {
    primary: "#e8503a",
    primaryLight: "#f7c5bd",
    primaryTint: "#fff5f3",
    primary400: "#e8503a",
  },
  orange: {
    primary: "#ffb23f",
    primaryLight: "#ffe5bf",
    primaryTint: "#fff9ef",
    primary400: "#ffb23f",
  },
};

const zustandMmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

type ThemeState = {
  theme: ThemeColor;
  appIcon: AppIconName;
  nightMode: boolean;
  largeEmoji: boolean;
  setTheme: (theme: ThemeColor) => void;
  setAppIcon: (icon: AppIconName) => void;
  setNightMode: (value: boolean) => void;
  setLargeEmoji: (value: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "green",
      appIcon: "green",
      nightMode: false,
      largeEmoji: false,
      setTheme: (theme) => set({ theme }),
      setAppIcon: (appIcon) => set({ appIcon }),
      setNightMode: (nightMode) => set({ nightMode }),
      setLargeEmoji: (largeEmoji) => set({ largeEmoji }),
    }),
    {
      name: "chatme-theme-storage",
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
