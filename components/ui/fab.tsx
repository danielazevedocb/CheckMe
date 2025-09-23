import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
}

export function FloatingActionButton({
  onPress,
  iconName = 'add',
  accessibilityLabel = 'Adicionar',
}: FloatingActionButtonProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.primary,
          shadowColor: palette.overlay,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}>
      <Ionicons name={iconName} size={28} color={palette.primaryForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
