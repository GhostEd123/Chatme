import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { WelcomeScreen } from '@/features/welcome';

export default function Index() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // MMKV + zustand/persist is synchronous; after first render the store is ready
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.id && accessToken) {
      router.replace('/(tabs)/chats');
    }
  }, [hydrated, user, accessToken]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#57b77d" />
      </View>
    );
  }

  // Authenticated users will be redirected above; only unauthenticated users see this
  if (user?.id && accessToken) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#57b77d" />
      </View>
    );
  }

  return <WelcomeScreen />;
}
