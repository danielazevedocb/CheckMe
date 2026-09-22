import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';

import { Colors, Shapes } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  const { backgroundColor, textColor, borderColor } = getStylesForVariant(palette, variant);

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.38 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function getStylesForVariant(
  palette: (typeof Colors)['light'],
  variant: ButtonVariant,
): { backgroundColor: string; textColor: string; borderColor: string } {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: palette.surfaceContainer,
        textColor: palette.text,
        borderColor: 'transparent',
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        textColor: palette.primary,
        borderColor: 'transparent',
      };
    case 'danger':
      return {
        backgroundColor: palette.errorContainer,
        textColor: palette.onErrorContainer,
        borderColor: 'transparent',
      };
    case 'primary':
    default:
      return {
        backgroundColor: palette.primary,
        textColor: palette.primaryForeground,
        borderColor: palette.primary,
      };
  }
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Shapes.full,
    paddingHorizontal: 24,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
