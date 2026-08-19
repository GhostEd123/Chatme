import { clientStoragePersister } from "@/core/lib/persister";
import { queryClient } from "@/core/lib/queryClient";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactNode } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaListener,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Uniwind } from "uniwind";

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
          <KeyboardProvider>{children}</KeyboardProvider>
        </SafeAreaListener>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
};

export default AppProviders;
