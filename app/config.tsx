import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors, Layout, Shapes } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { resetDatabase } from '@/lib/database';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

const OPTIONS: { mode: 'light' | 'dark' | 'system'; title: string; description: string }[] = [
  { mode: 'light', title: 'Claro', description: 'Mantém sempre no modo claro.' },
  { mode: 'dark', title: 'Escuro', description: 'Mantém sempre no modo escuro.' },
  { mode: 'system', title: 'Automático', description: 'Segue o tema do sistema.' },
];

export default function ConfigScreen(): JSX.Element {
  const { mode, setMode, resolved } = useThemeMode();
  const palette = Colors[resolved];
  const { gutter } = useResponsiveLayout();

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
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[styles.container, { paddingHorizontal: gutter }]}
      contentInsetAdjustmentBehavior="automatic"
      accessibilityLabel="Configurações de aparência">
      <View style={styles.content}>
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
              <View style={styles.itemText}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxFormWidth,
    alignSelf: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
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
    minHeight: 72,
    borderRadius: Shapes.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    flex: 1,
    paddingRight: 12,
  },
  dangerZone: {
    marginTop: 'auto',
    paddingTop: 32,
    gap: 8,
  },
});
