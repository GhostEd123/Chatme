import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, View, Text, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/features/auth/store/authStore';
import PinDotsWidget from '@/shared/widgets/PinDotsWidget';
import NumpadWidget from '@/shared/widgets/NumpadWidget';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { withUniwind } from 'uniwind';

const StyledFeather = withUniwind(Feather);

interface AppLockContextValue {
  lockApp: () => void;
  unlockApp: () => void;
}

const AppLockContext = createContext<AppLockContextValue>({
  lockApp: () => {},
  unlockApp: () => {},
});

export function useAppLock() {
  return useContext(AppLockContext);
}

export default function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const pinKey = userId ? `chatme_pin_${userId}` : null;

  const insets = useSafeAreaInsets();
  const [lockState, setLockState] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  // Load PIN on mount or user change
  useEffect(() => {
    if (!pinKey) {
      setLockState('unlocked');
      return;
    }
    setLockState('checking');
    SecureStore.getItemAsync(pinKey)
      .then((pin) => {
        if (pin) {
          setSavedPin(pin);
          setLockState('locked');
        } else {
          setSavedPin(null);
          setLockState('unlocked');
        }
      })
      .catch(() => {
        // Error reading PIN — lock for security
        setLockState('locked');
      });
  }, [pinKey]);

  // Lock on background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
        if (savedPin) {
          setLockState('locked');
          setInput('');
          setError(false);
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [savedPin]);

  const handleNumpad = (val: string) => {
    if (input.length >= 4) return;
    setError(false);
    const next = input + val;
    setInput(next);
    if (next.length === 4) {
      if (next === savedPin) {
        setLockState('unlocked');
        setInput('');
      } else {
        setError(true);
        setTimeout(() => setInput(''), 400);
      }
    }
  };

  const handleBackspace = () => {
    setInput((p) => p.slice(0, -1));
    setError(false);
  };

  const lockApp = () => {
    if (savedPin) {
      setLockState('locked');
      setInput('');
      setError(false);
    }
  };

  const unlockApp = () => setLockState('unlocked');

  if (lockState === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#57b77d" />
      </View>
    );
  }

  if (lockState === 'locked') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F7F9', paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 64, flex: 1, alignItems: 'center' }}>
          <View style={{ backgroundColor: '#E8F5EE', width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <StyledFeather name="lock" size={28} colorClassName="accent-primary-400" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 }}>
            Enter your PIN
          </Text>
          <Text style={{ fontSize: 15, color: error ? '#ef4444' : '#6B7280', textAlign: 'center', marginBottom: 40 }}>
            {error ? 'Incorrect PIN. Try again.' : 'Unlock ChatMe to view your messages.'}
          </Text>
          <PinDotsWidget length={4} value={input} />
        </View>
        <NumpadWidget onPress={handleNumpad} onBackspace={handleBackspace} />
      </View>
    );
  }

  return (
    <AppLockContext.Provider value={{ lockApp, unlockApp }}>
      {children}
    </AppLockContext.Provider>
  );
}
