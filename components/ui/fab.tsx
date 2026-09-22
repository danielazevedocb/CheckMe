import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { Colors, Shapes } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function FloatingActionButton({
  onPress,
  iconName = 'add',
  accessibilityLabel = 'Adicionar',
  style,
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
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
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
    bottom: 16,
    height: 56,
    width: 56,
    borderRadius: Shapes.large,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
      },
    }),
  },
});
