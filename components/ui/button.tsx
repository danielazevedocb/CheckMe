import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';

import { Colors } from '@/constants/theme';
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
        { backgroundColor, borderColor, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
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
        backgroundColor: palette.surface,
        textColor: palette.text,
        borderColor: palette.border,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        textColor: palette.primary,
        borderColor: 'transparent',
      };
    case 'danger':
      return {
        backgroundColor: palette.destructive,
        textColor: palette.primaryForeground,
        borderColor: palette.destructive,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
