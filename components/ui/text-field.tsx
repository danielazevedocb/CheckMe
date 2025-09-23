import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
  helperText?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, errorMessage, helperText, style, ...inputProps },
  ref,
) {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const hasError = Boolean(errorMessage);

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="defaultSemiBold" style={styles.label} accessibilityRole="text">
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        ref={ref}
        {...inputProps}
        style={[
          styles.input,
          {
            backgroundColor: palette.surface,
            borderColor: hasError ? palette.destructive : palette.border,
            color: palette.text,
          },
          style,
        ]}
        placeholderTextColor={palette.textMuted}
      />
      {hasError ? (
        <ThemedText type="default" style={[styles.message, { color: palette.destructive }]}>
          {errorMessage}
        </ThemedText>
      ) : helperText ? (
        <ThemedText type="default" style={[styles.message, { color: palette.textMuted }]}>
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 4,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  message: {
    fontSize: 13,
  },
});
