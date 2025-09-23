import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

export default function TabLayout() {
  const { resolved } = useThemeMode();
  const router = useRouter();
  const palette = Colors[resolved];

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: { backgroundColor: palette.surface },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: palette.background },
      }}>
      <Tabs.Screen
        name="abertas"
        options={{
          title: 'Abertas',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/config')}
              accessibilityRole="button"
              style={{ paddingHorizontal: 16 }}>
              <Ionicons name="settings-outline" size={22} color={palette.text} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="concluidas"
        options={{
          title: 'Concluídas',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="nova"
        options={{
          title: 'Nova',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
