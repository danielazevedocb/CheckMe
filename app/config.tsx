import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

const OPTIONS: { mode: 'light' | 'dark' | 'system'; title: string; description: string }[] = [
  { mode: 'light', title: 'Claro', description: 'Mantém sempre no modo claro.' },
  { mode: 'dark', title: 'Escuro', description: 'Mantém sempre no modo escuro.' },
  { mode: 'system', title: 'Automático', description: 'Segue o tema do sistema.' },
];

export default function ConfigScreen(): JSX.Element {
  const { mode, setMode, resolved } = useThemeMode();
  const palette = Colors[resolved];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}
      accessibilityLabel="Configurações de aparência">
      <ThemedText type="title">Tema</ThemedText>
      <ThemedText style={{ color: palette.textMuted }}>
        Escolha como o CheckMe deve se adaptar às preferências de cor.
      </ThemedText>

      <View style={styles.list}>
        {OPTIONS.map((option) => {
          const selected = option.mode === mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => setMode(option.mode)}
              style={[
                styles.item,
                {
                  backgroundColor: palette.surface,
                  borderColor: selected ? palette.primary : palette.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.title}>
              <View>
                <ThemedText type="defaultSemiBold">{option.title}</ThemedText>
                <ThemedText style={{ color: palette.textMuted }}>{option.description}</ThemedText>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={24} color={palette.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
