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
  quantity: number;
  price: number | null;
}

interface TaskFormProps {
  initialValues?: Partial<TaskFormValues>;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  shoppingMode?: boolean;
}

export function TaskForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  loading = false,
  shoppingMode = false,
}: TaskFormProps): JSX.Element {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(
    initialValues?.priority ?? DEFAULT_TASK_PRIORITY,
  );
  const [quantityText, setQuantityText] = useState(String(initialValues?.quantity ?? 1));
  const [priceText, setPriceText] = useState(
    initialValues?.price != null ? String(initialValues.price) : '',
  );
  const [titleError, setTitleError] = useState<string | undefined>();

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setPriority(initialValues?.priority ?? DEFAULT_TASK_PRIORITY);
    setQuantityText(String(initialValues?.quantity ?? 1));
    setPriceText(initialValues?.price != null ? String(initialValues.price) : '');
    setTitleError(undefined);
  }, [initialValues?.title, initialValues?.description, initialValues?.priority, initialValues?.quantity, initialValues?.price]);

  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Informe um título para a tarefa.');
      return;
    }

    const quantity = Math.max(1, parseInt(quantityText, 10) || 1);
    const parsedPrice = parseFloat(priceText.replace(',', '.'));
    const price = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;

    setTitleError(undefined);
    void onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      quantity,
      price,
    });
  }, [description, onSubmit, priority, priceText, quantityText, title]);

  return (
    <View style={styles.form} accessibilityLabel="Formulário de tarefa">
      <TextField
        label={shoppingMode ? 'Item' : 'Título'}
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          if (titleError && value.trim()) {
            setTitleError(undefined);
          }
        }}
        placeholder={shoppingMode ? 'Ex: Arroz, Leite, Detergente' : 'Ex: Revisar capítulo 3'}
        errorMessage={titleError}
        editable={!loading}
        autoFocus
      />
      {shoppingMode ? (
        <>
          <View style={styles.shoppingRow}>
            <View style={styles.shoppingQtyField}>
              <TextField
                label="Quantidade"
                value={quantityText}
                onChangeText={setQuantityText}
                placeholder="1"
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
            <View style={styles.shoppingPriceField}>
              <TextField
                label="Preço unitário (R$)"
                value={priceText}
                onChangeText={setPriceText}
                placeholder="0,00"
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>
          <View style={styles.prioritySection}>
            <ThemedText type="defaultSemiBold" style={styles.priorityLabel}>
              Prioridade
            </ThemedText>
            <PrioritySelector value={priority} onChange={setPriority} disabled={loading} />
          </View>
        </>
      ) : (
        <>
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
        </>
      )}
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
  shoppingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shoppingQtyField: {
    width: 100,
  },
  shoppingPriceField: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
