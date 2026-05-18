import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChecklistForm, type ChecklistFormValues } from '@/components/checklist/checklist-form';
import { DEFAULT_CHECKLIST_COLOR } from '@/constants/checklist-colors';
import { Colors } from '@/constants/theme';
import { useDatabase } from '@/contexts/database-context';
import { useThemeMode } from '@/contexts/theme-context';
import { createChecklist } from '@/repositories/checklist-repository';
import type { ChecklistType } from '@/types/checklist';

const TYPE_OPTIONS: { type: ChecklistType; icon: string; label: string; description: string }[] = [
  { type: 'task', icon: '✅', label: 'Dia a dia', description: 'Tarefas com prioridade' },
  { type: 'shopping', icon: '🛒', label: 'Mercado', description: 'Itens com qtd. e valor' },
];

export default function NovaChecklistScreen(): JSX.Element {
  const router = useRouter();
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [saving, setSaving] = useState(false);

  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const [checklistType, setChecklistType] = useState<ChecklistType>(
    typeParam === 'shopping' ? 'shopping' : 'task',
  );

  const initialValues: ChecklistFormValues = {
    title: '',
    color: DEFAULT_CHECKLIST_COLOR,
    icon: null,
  };

  const handleSubmit = async (values: ChecklistFormValues) => {
    if (saving) return;
    setSaving(true);
    try {
      const checklistId = await createChecklist(db, {
        title: values.title,
        color: values.color,
        icon: values.icon,
        type: checklistType,
      });
      Alert.alert('Checklist criada', 'Quer abrir a lista agora?', [
        { text: 'Depois', style: 'cancel' },
        { text: 'Abrir', onPress: () => router.push(`/checklist/${checklistId}`) },
      ]);
    } catch (error) {
      Alert.alert('Erro ao salvar', 'Não foi possível criar a checklist. Tente novamente.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => {
            const selected = checklistType === opt.type;
            return (
              <Pressable
                key={opt.type}
                onPress={() => setChecklistType(opt.type)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: selected ? palette.primary : palette.surface,
                    borderColor: selected ? palette.primary : palette.border,
                  },
                ]}>
                <Text style={styles.typeIcon}>{opt.icon}</Text>
                <Text style={[styles.typeLabel, { color: selected ? palette.primaryForeground : palette.text }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.typeDesc, { color: selected ? palette.primaryForeground : palette.textMuted }]}>
                  {opt.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ChecklistForm
          initialValues={initialValues}
          submitLabel="Criar checklist"
          onSubmit={handleSubmit}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 48,
    gap: 24,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
});
