import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { Colors, Layout } from '@/constants/theme';
import { useDatabase } from '@/contexts/database-context';
import { useThemeMode } from '@/contexts/theme-context';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
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
  const { gutter } = useResponsiveLayout();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [formValues, setFormValues] = useState<ChecklistFormValues | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const record = await getChecklist(db, checklistId);
        if (!isActive) return;

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
        if (isActive) setError(err as Error);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [checklistId, db]);

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
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: gutter }]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic">
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
    width: '100%',
    maxWidth: Layout.maxFormWidth,
    alignSelf: 'center',
    paddingTop: 16,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
