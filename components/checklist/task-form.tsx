import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrioritySelector } from '@/components/checklist/priority-selector';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { DEFAULT_TASK_PRIORITY, type TaskPriority } from '@/types/checklist';

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
}

interface TaskFormProps {
  initialValues?: Partial<TaskFormValues>;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TaskForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  loading = false,
}: TaskFormProps): JSX.Element {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(
    initialValues?.priority ?? DEFAULT_TASK_PRIORITY,
  );
  const [titleError, setTitleError] = useState<string | undefined>();

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setPriority(initialValues?.priority ?? DEFAULT_TASK_PRIORITY);
    setTitleError(undefined);
  }, [initialValues?.title, initialValues?.description, initialValues?.priority]);

  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Informe um título para a tarefa.');
      return;
    }

    setTitleError(undefined);
    void onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      priority,
    });
  }, [description, onSubmit, priority, title]);

  return (
    <View style={styles.form} accessibilityLabel="Formulário de tarefa">
      <TextField
        label="Título"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          if (titleError && value.trim()) {
            setTitleError(undefined);
          }
        }}
        placeholder="Ex: Revisar capítulo 3"
        errorMessage={titleError}
        editable={!loading}
        autoFocus
      />
      <TextField
        label="Descrição (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Detalhes adicionais"
        multiline
        numberOfLines={3}
        editable={!loading}
      />
      <View style={styles.prioritySection}>
        <ThemedText type="defaultSemiBold" style={styles.priorityLabel}>
          Prioridade
        </ThemedText>
        <PrioritySelector value={priority} onChange={setPriority} disabled={loading} />
      </View>
      <View style={styles.actions}>
        <Button label="Cancelar" variant="ghost" onPress={onCancel} disabled={loading} />
        <Button label={submitLabel} onPress={handleSubmit} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  prioritySection: {
    gap: 8,
  },
  priorityLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
