import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (saving) return;

    const normalizedTitle = title.trim();
    const normalizedItems = items
      .map((item) => ({
        name: item.name.trim(),
        price: parseCurrencyInput(item.price),
      }))
      .filter((item) => item.name.length > 0);

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
      const checklistId = await createChecklist(db, normalizedTitle);
      for (const item of normalizedItems) {
        await createItem(db, { checklistId, name: item.name, price: item.price });
      }

      setTitle('');
      setItems([createDraftItem()]);

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
          {items.map((item, index) => (
            <View key={item.id} style={[styles.itemRow, { borderColor: palette.border }]}
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
        </View>

        <Button label="Salvar checklist" onPress={handleSubmit} loading={saving} />
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
});
