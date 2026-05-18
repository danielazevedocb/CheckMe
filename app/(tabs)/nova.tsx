import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ChecklistForm, type ChecklistFormValues } from '@/components/checklist/checklist-form';
import { DEFAULT_CHECKLIST_COLOR } from '@/constants/checklist-colors';
import { Colors } from '@/constants/theme';
import { useDatabase } from '@/contexts/database-context';
import { useThemeMode } from '@/contexts/theme-context';
import { createChecklist } from '@/repositories/checklist-repository';

export default function NovaChecklistScreen(): JSX.Element {
  const router = useRouter();
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [saving, setSaving] = useState(false);

  const initialValues: ChecklistFormValues = {
    title: '',
    color: DEFAULT_CHECKLIST_COLOR,
    icon: null,
  };

  const handleSubmit = async (values: ChecklistFormValues) => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const checklistId = await createChecklist(db, values.title, values.color, values.icon);
      Alert.alert('Checklist criada', 'Quer abrir a lista agora?', [
        { text: 'Depois', style: 'cancel' },
        {
          text: 'Abrir',
          onPress: () => router.push(`/checklist/${checklistId}`),
        },
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
  },
});
