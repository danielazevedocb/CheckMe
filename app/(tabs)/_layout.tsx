import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

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
        tabBarStyle: {
          backgroundColor: palette.surfaceContainer,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: palette.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Checklists',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/config')}
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações"
              style={styles.headerAction}>
              <Ionicons name="settings-outline" size={22} color={palette.text} />
            </Pressable>
          ),
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

const styles = StyleSheet.create({
  tabItem: {
    minHeight: 56,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  headerAction: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
