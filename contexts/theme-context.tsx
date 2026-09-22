import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const STORAGE_KEY = '@checkme:theme-mode';

type ThemePreference = 'light' | 'dark' | 'system';

type ResolvedScheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemePreference;
  resolved: ResolvedScheme;
  setMode: (mode: ThemePreference) => Promise<void>;
  toggle: () => Promise<void>;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren): JSX.Element {
  const systemPreference = useSystemColorScheme();
  const systemScheme: ResolvedScheme = systemPreference === 'dark' ? 'dark' : 'light';
  const [mode, setModeState] = useState<ThemePreference>('system');
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        } else {
          setModeState('dark');
          await AsyncStorage.setItem(STORAGE_KEY, 'dark');
        }
      } finally {
        setReady(true);
      }
    };

    void loadPreference();
  }, []);

  const resolved = mode === 'system' ? systemScheme : mode;

  const persistMode = useCallback(async (nextMode: ThemePreference) => {
    setModeState(nextMode);
    if (nextMode === 'system') {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    }
  }, []);

  const toggle = useCallback(async () => {
    const nextMode: ThemePreference = resolved === 'dark' ? 'light' : 'dark';
    await persistMode(nextMode);
  }, [persistMode, resolved]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      setMode: persistMode,
      toggle,
      isReady,
    }),
    [isReady, mode, persistMode, resolved, toggle],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      {children}
      {!isReady ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
        </View>
      ) : null}
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function useThemeMode(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return value;
}
