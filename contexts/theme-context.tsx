import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
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
import { ActivityIndicator, ColorSchemeName, View } from 'react-native';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const STORAGE_KEY = '@checkme:theme-mode';

type ThemePreference = 'light' | 'dark' | 'system';

type ResolvedScheme = Exclude<ColorSchemeName, null | undefined>;

interface ThemeContextValue {
  mode: ThemePreference;
  resolved: ResolvedScheme;
  setMode: (mode: ThemePreference) => Promise<void>;
  toggle: () => Promise<void>;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren): JSX.Element {
  const systemScheme = (useSystemColorScheme() ?? 'light') as ResolvedScheme;
  const [mode, setModeState] = useState<ThemePreference>('system');
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
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
      <NavigationThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
        {isReady ? (
          children
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        )}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return value;
}
