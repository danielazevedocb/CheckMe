import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/contexts/database-context';
import { ThemeProvider } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="config" options={{ title: 'Configurações' }} />
        </Stack>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
