import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ChecklistForm, type ChecklistFormValues } from '@/components/checklist/checklist-form';
import { EmptyState } from '@/components/ui/empty-state';
import { DEFAULT_CHECKLIST_COLOR } from '@/constants/checklist-colors';
import { Colors } from '@/constants/theme';
import { useDatabase } from '@/contexts/database-context';
import { useThemeMode } from '@/contexts/theme-context';
import {
  getChecklist,
  updateChecklistColor,
  updateChecklistIcon,
  updateChecklistTitle,
} from '@/repositories/checklist-repository';

export default function EditChecklistScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checklistId = Number(id);
  const router = useRouter();
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [formValues, setFormValues] = useState<ChecklistFormValues | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const record = await getChecklist(db, checklistId);
      if (!record) {
        setFormValues(null);
        setError(new Error('not_found'));
        return;
      }

      setFormValues({
        title: record.title,
        color: record.color,
        icon: record.icon ?? null,
      });
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [checklistId, db]);

  useEffect(() => {
    void load();
  }, [load]);

  const fallbackValues = useMemo(
    (): ChecklistFormValues => ({
      title: '',
      color: DEFAULT_CHECKLIST_COLOR,
      icon: null,
    }),
    [],
  );

  const handleSubmit = async (values: ChecklistFormValues) => {
    if (saving || !formValues) {
      return;
    }

    setSaving(true);
    try {
      if (values.title !== formValues.title) {
        await updateChecklistTitle(db, checklistId, values.title);
      }
      if (values.color !== formValues.color) {
        await updateChecklistColor(db, checklistId, values.color);
      }
      if (values.icon !== formValues.icon) {
        await updateChecklistIcon(db, checklistId, values.icon);
      }

      Alert.alert('Checklist atualizada', 'As alterações foram salvas.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a checklist.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !formValues) {
    return (
      <EmptyState
        title="Checklist não encontrada"
        description="Ela pode ter sido removida."
        actionLabel="Voltar"
        onPressAction={() => router.back()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ChecklistForm
          initialValues={formValues}
          submitLabel="Salvar alterações"
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
