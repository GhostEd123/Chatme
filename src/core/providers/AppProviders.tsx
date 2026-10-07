import { clientStoragePersister } from "@/core/lib/persister";
import { queryClient } from "@/core/lib/queryClient";
import SocketProvider from "@/core/providers/SocketProvider";
import { THEME_PALETTE, useThemeStore } from "@/core/store/themeStore";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactNode, useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaListener,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Uniwind } from "uniwind";

/**
 * Reads the selected theme from the store and injects the corresponding
 * CSS custom-property values into Uniwind so every component that uses
 * --color-primary (and its variants) automatically re-renders in the
 * chosen brand colour.
 *
 * Uniwind.updateCSSVariables(theme, vars) updates CSS variables for a
 * given theme. We always use the 'light' theme name for our overrides
 * since we're using the light/dark semantic tokens.
 */
function ThemeInjector() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const palette = THEME_PALETTE[theme];
    // Update both light and dark variants so the override applies in both modes
    const vars: Record<string, string> = {
      "--color-primary": palette.primary,
      "--color-primary-light": palette.primaryLight,
      "--color-primary-tint": palette.primaryTint,
      "--color-primary-400": palette.primary400,
    };
    try {
      // 'light' and 'dark' are the theme names registered via global.css @variant
      Uniwind.updateCSSVariables("light", vars);
      Uniwind.updateCSSVariables("dark", vars);
    } catch (_) {
      // Silently ignore if theme names aren't registered
    }
  }, [theme]);

  return null;
}

const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: clientStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.queryKey[0] !== "presence",
        },
      }}
    >
      <SafeAreaProvider>
        <SafeAreaListener
          onChange={({ insets }) => Uniwind.updateInsets(insets)}
        >
          <KeyboardProvider>
            <SocketProvider>
              <ThemeInjector />
              {children}
            </SocketProvider>
          </KeyboardProvider>
        </SafeAreaListener>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
};

export default AppProviders;
