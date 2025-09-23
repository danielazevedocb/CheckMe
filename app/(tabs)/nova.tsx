import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { useDatabase } from '@/contexts/database-context';
import { createChecklist } from '@/repositories/checklist-repository';
import { createItem } from '@/repositories/item-repository';
import { parseCurrencyInput } from '@/utils/format';
import type { ChecklistMode } from '@/types/checklist';

interface DraftItem {
  id: string;
  name: string;
  price: string;
}

const createDraftItem = (): DraftItem => ({
  id: `${Date.now()}-${Math.random()}`,
  name: '',
  price: '',
});

export default function NovaChecklistScreen(): JSX.Element {
  const router = useRouter();
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  const [title, setTitle] = useState('');
  const [items, setItems] = useState<DraftItem[]>([createDraftItem()]);
  const [mode, setMode] = useState<ChecklistMode>('list');
  const [textContent, setTextContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleModeChange = (nextMode: ChecklistMode) => {
    if (nextMode === mode) {
      return;
    }

    if (nextMode === 'text') {
      const draft = items.map((item) => item.name.trim()).filter(Boolean).join('\n');
      setTextContent(draft);
    } else {
      setItems(linesToDrafts(textContent));
    }

    setMode(nextMode);
  };

  const handleSubmit = async () => {
    if (saving) return;

    const normalizedTitle = title.trim();
    const normalizedItems =
      mode === 'list'
        ? items
            .map((item) => ({
              name: item.name.trim(),
              price: parseCurrencyInput(item.price),
            }))
            .filter((item) => item.name.length > 0)
        : linesToDrafts(textContent).map((item) => ({ name: item.name.trim(), price: null }));

    if (!normalizedTitle) {
      Alert.alert('Informe um título', 'A checklist precisa de um nome.');
      return;
    }

    if (normalizedItems.length === 0) {
      Alert.alert('Adicione itens', 'Inclua pelo menos um item antes de salvar.');
      return;
    }

    setSaving(true);

    try {
      const checklistId = await createChecklist(db, normalizedTitle, mode);
      for (const item of normalizedItems) {
        await createItem(db, {
          checklistId,
          name: item.name,
          price: mode === 'list' ? item.price : null,
        });
      }

      setTitle('');
      setItems([createDraftItem()]);
      setTextContent('');
      setMode('list');

      Alert.alert('Checklist criada!', 'Quer ver os detalhes agora?', [
        {
          text: 'Depois',
          style: 'cancel',
        },
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

  const handleItemChange = (id: string, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createDraftItem()]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <TextField
            value={title}
            onChangeText={setTitle}
            label="Título"
            placeholder="Ex: Lista do mercado"
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <View style={[styles.modeSelector, { backgroundColor: palette.surface }]}
            accessibilityRole="radiogroup">
            <ModePill
              label="Lista"
              selected={mode === 'list'}
              onPress={() => handleModeChange('list')}
              palette={palette}
            />
            <ModePill
              label="Texto"
              selected={mode === 'text'}
              onPress={() => handleModeChange('text')}
              palette={palette}
            />
          </View>

          {mode === 'list' ? (
            <>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.itemRow, { borderColor: palette.border }]}
                  accessibilityLabel={`Item ${index + 1}`}>
                  <TextField
                    value={item.name}
                    onChangeText={(value) => handleItemChange(item.id, 'name', value)}
                    label={`Item ${index + 1}`}
                    placeholder="Nome do item"
                  />
                  <TextField
                    value={item.price}
                    onChangeText={(value) => handleItemChange(item.id, 'price', value)}
                    label="Preço"
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                  />
                  <Button
                    label="Remover"
                    variant="ghost"
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.removeButton}
                    accessibilityLabel={`Remover item ${index + 1}`}
                  />
                </View>
              ))}
              <Button label="Adicionar item" variant="secondary" onPress={handleAddItem} />
            </>
          ) : (
            <TextField
              label="Texto da checklist"
              value={textContent}
              onChangeText={setTextContent}
              placeholder={'Item 1\nItem 2\nItem 3'}
              multiline
              numberOfLines={8}
              style={styles.textArea}
              helperText="Cada linha será convertida em um item."
            />
          )}
        </View>

        <Button label="Salvar checklist" onPress={handleSubmit} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModePill({
  label,
  selected,
  onPress,
  palette,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: (typeof Colors)['light'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.modePill,
        {
          backgroundColor: selected ? palette.primary : 'transparent',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}>
      <Text
        style={[
          styles.modePillLabel,
          { color: selected ? palette.primaryForeground : palette.text },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function linesToDrafts(text: string): DraftItem[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [createDraftItem()];
  }

  return lines.map((line) => ({ ...createDraftItem(), name: line }));
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 24,
    paddingBottom: 48,
  },
  section: {
    gap: 16,
  },
  itemRow: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    gap: 8,
  },
  modePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  modePillLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
});
