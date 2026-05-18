import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

const SAVED_INDICATOR_MS = 800;

interface PlannerNoteProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function PlannerNote({ value, onChangeText }: PlannerNoteProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (text: string) => {
      onChangeText(text);
      setShowSaved(false);

      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      savedTimeoutRef.current = setTimeout(() => {
        setShowSaved(true);
      }, SAVED_INDICATOR_MS);
    },
    [onChangeText],
  );

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.title} accessibilityRole="header">
          Anotações
        </ThemedText>
        {showSaved ? (
          <ThemedText type="default" style={[styles.savedLabel, { color: palette.success }]}>
            Salvo
          </ThemedText>
        ) : null}
      </View>
      <TextField
        value={value}
        onChangeText={handleChange}
        placeholder="Escreva suas anotações do dia..."
        multiline
        textAlignVertical="top"
        accessibilityLabel="Anotações do dia"
        accessibilityHint="Texto salvo automaticamente ao editar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  savedLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
