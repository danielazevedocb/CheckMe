import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useDatabase } from '@/contexts/database-context';
import { useThemeMode } from '@/contexts/theme-context';
import { resetDatabase } from '@/lib/database';

const OPTIONS: { mode: 'light' | 'dark' | 'system'; title: string; description: string }[] = [
  { mode: 'light', title: 'Claro', description: 'Mantém sempre no modo claro.' },
  { mode: 'dark', title: 'Escuro', description: 'Mantém sempre no modo escuro.' },
  { mode: 'system', title: 'Automático', description: 'Segue o tema do sistema.' },
];

export default function ConfigScreen(): JSX.Element {
  const { mode, setMode, resolved } = useThemeMode();
  const db = useDatabase();
  const palette = Colors[resolved];

  const handleResetDatabase = () => {
    Alert.alert(
      'Resetar Banco de Dados',
      'Tem certeza? Todas as checklists serão apagadas permanentemente. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Sucesso', 'Banco de dados resetado. O app será recarregado.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível resetar o banco de dados.');
              console.error(error);
            }
          },
        },
      ],
    );
  };

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

      <View style={styles.dangerZone}>
        <ThemedText type="defaultSemiBold">Zona de Perigo</ThemedText>
        <ThemedText style={{ color: palette.textMuted, fontSize: 13 }}>
          Ações aqui são permanentes e não podem ser desfeitas.
        </ThemedText>
        <Button label="Resetar Banco de Dados" variant="danger" onPress={handleResetDatabase} />
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
  dangerZone: {
    marginTop: 'auto',
    paddingTop: 32,
    gap: 8,
  },
});
