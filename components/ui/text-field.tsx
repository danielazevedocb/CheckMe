import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { Colors, Shapes } from '@/constants/theme';
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
  const isMultiline = Boolean(inputProps.multiline);

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
          isMultiline ? styles.inputMultiline : null,
          {
            backgroundColor: palette.surface,
            borderColor: hasError ? palette.destructive : palette.outline,
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
    gap: 6,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  input: {
    minHeight: 56,
    borderRadius: Shapes.small,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
