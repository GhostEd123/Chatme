import { socketService } from "@/core/lib/socketService";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ReactNode, useEffect } from "react";

/**
 * SocketProvider
 *
 * Mounts inside AppProviders. Connects the socket when the user is
 * authenticated and disconnects on logout. Automatically reconnects
 * if the accessToken changes (e.g. after a silent token refresh).
 */
export default function SocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      socketService.connect(accessToken);
    } else {
      socketService.disconnect();
    }

    return () => {
      // Disconnect when the provider unmounts (app teardown)
      socketService.disconnect();
    };
  }, [accessToken]);

  // This provider has no UI — it's purely a side-effect wrapper
  return <>{children}</>;
}
