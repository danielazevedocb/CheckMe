import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { CHECKLIST_COLORS, DEFAULT_CHECKLIST_COLOR } from '@/constants/checklist-colors';
import { useThemeMode } from '@/contexts/theme-context';
import { useDatabase } from '@/contexts/database-context';
import { createChecklist } from '@/repositories/checklist-repository';
import { createItem } from '@/repositories/item-repository';
import { formatFullDate, parseCurrencyInput, parseQuantityInput, startOfDay } from '@/utils/format';
import type { ChecklistMode } from '@/types/checklist';

interface DraftItem {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

const createDraftItem = (): DraftItem => ({
  id: `${Date.now()}-${Math.random()}`,
  name: '',
  price: '',
  quantity: '1',
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
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(startOfDay(new Date()));
  const [color, setColor] = useState<string>(DEFAULT_CHECKLIST_COLOR);
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

  const handleOpenDatePicker = () => {
    const today = startOfDay(new Date());
    const currentDate = scheduledAt ?? today;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'date',
        minimumDate: today,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            setScheduledAt(startOfDay(date));
          }
        },
      });
      return;
    }

    setPickerDate(currentDate);
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    if (saving) return;

    const normalizedTitle = title.trim();
    let normalizedItems: { name: string; price: number | null; quantity: number; color: string }[];

    if (mode === 'list') {
      const indexedItems = items.map((item, index) => ({
        name: item.name.trim(),
        price: parseCurrencyInput(item.price),
        quantity: parseQuantityInput(item.quantity),
        color,
        originalIndex: index,
      }));

      const filledItems = indexedItems.filter((item) => item.name.length > 0);

      const invalidQuantity = filledItems.find((item) => item.quantity == null);
      if (invalidQuantity) {
        Alert.alert(
          'Quantidade inválida',
          `Informe uma quantidade válida para o item ${invalidQuantity.originalIndex + 1}.`,
        );
        return;
      }

      normalizedItems = filledItems.map(({ originalIndex, quantity, ...rest }) => ({
        ...rest,
        quantity: quantity ?? 1,
      }));
    } else {
      normalizedItems = linesToDrafts(textContent).map((item) => ({
        name: item.name.trim(),
        price: null,
        quantity: 1,
        color,
      }));
    }

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
      const scheduledTimestamp = scheduledAt ? startOfDay(scheduledAt).getTime() : null;
      const checklistId = await createChecklist(db, normalizedTitle, mode, color, scheduledTimestamp);
      for (const item of normalizedItems) {
        await createItem(db, {
          checklistId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
        });
      }

      setTitle('');
      setItems([createDraftItem()]);
      setTextContent('');
      setMode('list');
      setScheduledAt(null);

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

          <ColorSelector
            selectedColor={color}
            onSelect={setColor}
          />

          <ScheduleSelector
            scheduledAt={scheduledAt}
            onPickDate={handleOpenDatePicker}
            onClear={() => setScheduledAt(null)}
            palette={palette}
          />

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
                  <TextField
                    value={item.quantity}
                    onChangeText={(value) => handleItemChange(item.id, 'quantity', value)}
                    label="Quantidade"
                    placeholder="1"
                    keyboardType="number-pad"
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
              multiline
              numberOfLines={8}
              style={styles.textArea}
            />
          )}
        </View>

        <Button label="Salvar checklist" onPress={handleSubmit} loading={saving} />
      </ScrollView>

      <SchedulePickerModal
        visible={showDatePicker}
        initialDate={pickerDate}
        onCancel={() => setShowDatePicker(false)}
        onConfirm={(date) => {
          setScheduledAt(date);
          setShowDatePicker(false);
        }}
        palette={palette}
      />
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

function ScheduleSelector({
  scheduledAt,
  onPickDate,
  onClear,
  palette,
}: {
  scheduledAt: Date | null;
  onPickDate: () => void;
  onClear: () => void;
  palette: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.scheduleRow}>
      <Pressable
        style={({ pressed }) => [
          styles.scheduleButton,
          {
            borderColor: palette.border,
            backgroundColor: palette.surface,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={onPickDate}
        accessibilityRole="button"
        accessibilityLabel={scheduledAt ? 'Editar agendamento' : 'Agendar checklist'}>
        <Ionicons name="calendar" size={20} color={palette.primary} />
        <Text style={[styles.scheduleLabel, { color: palette.text }]}>
          {scheduledAt ? formatFullDate(scheduledAt.getTime()) : 'Agendar checklist'}
        </Text>
      </Pressable>
      {scheduledAt ? (
        <Pressable
          onPress={onClear}
          accessibilityLabel="Remover agendamento"
          style={({ pressed }) => [
            styles.clearButton,
            {
              borderColor: palette.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}>
          <Ionicons name="close" size={18} color={palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ColorSelector({
  selectedColor,
  onSelect,
  label = 'Cor da checklist',
}: {
  selectedColor: string;
  onSelect: (color: string) => void;
  label?: string;
}) {
  return (
    <View style={styles.colorSection}>
      {label ? <ThemedText type="defaultSemiBold">{label}</ThemedText> : null}
      <View
        style={styles.colorGrid}
        accessibilityRole="radiogroup"
        accessibilityLabel="Escolher cor">
        {CHECKLIST_COLORS.map((option) => {
          const isSelected = option.value === selectedColor;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Cor ${option.label}`}
              style={({ pressed }) => [
                styles.colorSwatch,
                {
                  backgroundColor: option.value,
                  transform: pressed ? [{ scale: 0.95 }] : undefined,
                  borderWidth: isSelected ? 3 : 1,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function SchedulePickerModal({
  visible,
  initialDate,
  onCancel,
  onConfirm,
  palette,
}: {
  visible: boolean;
  initialDate: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
  palette: (typeof Colors)['light'];
}) {
  const [tempDate, setTempDate] = useState<Date>(initialDate);

  useEffect(() => {
    if (visible) {
      setTempDate(initialDate);
    }
  }, [initialDate, visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerContent, { backgroundColor: palette.surface }]}
        accessibilityLabel="Selecionar data">
          <DateTimePicker
            value={tempDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              if (date) {
                setTempDate(startOfDay(date));
              }
            }}
            minimumDate={startOfDay(new Date())}
            style={Platform.OS === 'web' ? styles.webDatePicker : undefined}
          />
          <View style={styles.pickerActions}>
            <Button label="Cancelar" variant="ghost" onPress={onCancel} />
            <Button label="Confirmar" onPress={() => onConfirm(tempDate)} />
          </View>
        </View>
      </View>
    </Modal>
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
  modeSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    gap: 8,
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  colorSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  clearButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modePillLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerContent: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  webDatePicker: {
    width: '100%',
    height: 260,
  },
});
