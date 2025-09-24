import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';

import { ChecklistItemRow } from '@/components/checklist/checklist-item-row';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { useChecklist } from '@/hooks/use-checklist';
import {
  deleteChecklist,
  updateChecklistMode,
  updateChecklistSchedule,
  updateChecklistTitle,
} from '@/repositories/checklist-repository';
import { createItem, deleteItem, setItemDone, updateItem } from '@/repositories/item-repository';
import type { ChecklistItem, ChecklistMode } from '@/types/checklist';
import {
  differenceInDays,
  formatCurrency,
  formatFullDate,
  formatProgress,
  parseCurrencyInput,
  startOfDay,
} from '@/utils/format';
import { useDatabase } from '@/contexts/database-context';
import type { Database } from '@/lib/database';

interface EditItemState {
  id: number;
  name: string;
  price: string;
}

type ScheduleState = 'today' | 'upcoming' | 'overdue' | 'default';

export default function ChecklistDetailsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checklistId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  const { checklist, loading, error, refresh } = useChecklist(checklistId);

  const [titleDraft, setTitleDraft] = useState('');
  const [isSavingTitle, setSavingTitle] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItem, setEditingItem] = useState<EditItemState | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [modeChanging, setModeChanging] = useState(false);
  const [textEditorVisible, setTextEditorVisible] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const [syncingText, setSyncingText] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(startOfDay(new Date()));

  useEffect(() => {
    if (checklist) {
      setTitleDraft(checklist.title);
    }
  }, [checklist]);

  useEffect(() => {
    if (checklist?.mode === 'text') {
      setTextDraft(itemsToText(checklist.items));
    }
  }, [checklist?.mode, checklist?.items]);

  useEffect(() => {
    navigation.setOptions({ title: checklist?.title ?? 'Checklist' });
  }, [checklist?.title, navigation]);

  useEffect(() => {
    if (checklist?.scheduledFor) {
      setScheduledDate(new Date(checklist.scheduledFor));
    } else {
      setScheduledDate(null);
    }
  }, [checklist?.scheduledFor]);

  const totals = useMemo(() => {
    if (!checklist) {
      return { totalItems: 0, completedItems: 0, totalAmount: 0, completedAmount: 0 };
    }

    const totalItems = checklist.items.length;
    let completedItems = 0;
    let totalAmount = 0;
    let completedAmount = 0;

    for (const item of checklist.items) {
      const price = item.price ?? 0;
      totalAmount += price;
      if (item.done) {
        completedItems += 1;
        completedAmount += price;
      }
    }

    return { totalItems, completedItems, totalAmount, completedAmount };
  }, [checklist]);

  const scheduleStatus = useMemo(() => {
    if (!checklist?.scheduledFor) {
      return null;
    }
    const diff = differenceInDays(Date.now(), checklist.scheduledFor);
    if (diff === 0) {
      return { label: 'Hoje', tone: 'today' as ScheduleState };
    }
    if (diff > 0) {
      const label = diff === 1 ? 'Amanhã' : `Em ${diff} dias`;
      return { label, tone: 'upcoming' as ScheduleState };
    }
    const overdue = Math.abs(diff);
    const label = overdue === 1 ? '1 dia em atraso' : `${overdue} dias em atraso`;
    return { label, tone: 'overdue' as ScheduleState };
  }, [checklist?.scheduledFor]);

  const handleSaveTitle = async () => {
    if (!checklist) return;
    const newTitle = titleDraft.trim();
    if (!newTitle || newTitle === checklist.title) {
      setTitleDraft(checklist.title);
      return;
    }

    setSavingTitle(true);
    try {
      await updateChecklistTitle(db, checklist.id, newTitle);
      await refresh();
      Alert.alert('Checklist atualizada', 'O título foi alterado com sucesso.');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o título.');
      console.error(err);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    try {
      await setItemDone(db, item.id, !item.done);
      await refresh();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o item.');
      console.error(err);
    }
  };

  const handleAddItem = async () => {
    const name = newItemName.trim();
    if (!name) {
      Alert.alert('Informe o nome do item');
      return;
    }

    setSavingItem(true);
    try {
      await createItem(db, {
        checklistId,
        name,
        price: parseCurrencyInput(newItemPrice),
      });
      setNewItemName('');
      setNewItemPrice('');
      await refresh();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
      console.error(err);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = (item: ChecklistItem) => {
    Alert.alert('Remover item', `Deseja remover "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(db, item.id);
            await refresh();
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível remover o item.');
            console.error(err);
          }
        },
      },
    ]);
  };

  const handleDeleteChecklist = () => {
    if (!checklist) return;
    Alert.alert('Remover checklist', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChecklist(db, checklist.id);
            Alert.alert('Checklist removida');
            router.back();
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível remover a checklist.');
            console.error(err);
          }
        },
      },
    ]);
  };

  const openEditItem = (item: ChecklistItem) => {
    setEditingItem({ id: item.id, name: item.name, price: item.price?.toString() ?? '' });
  };

  const handleSaveItemEdit = async () => {
    if (!editingItem) return;
    const name = editingItem.name.trim();
    if (!name) {
      Alert.alert('Informe o nome do item');
      return;
    }

    try {
      await updateItem(db, editingItem.id, {
        name,
        price: parseCurrencyInput(editingItem.price),
      });
      setEditingItem(null);
      await refresh();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o item.');
      console.error(err);
    }
  };

  const handleModeChange = async (nextMode: ChecklistMode) => {
    if (!checklist || checklist.mode === nextMode) {
      return;
    }

    setModeChanging(true);
    try {
      await updateChecklistMode(db, checklist.id, nextMode);
      await refresh();
      if (nextMode === 'text') {
        setTextDraft(itemsToText(checklist.items));
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível alterar o modo da checklist.');
      console.error(err);
    } finally {
      setModeChanging(false);
    }
  };

  const commitSchedule = async (date: Date | null) => {
    if (!checklist) return;
    setUpdatingSchedule(true);
    try {
      await updateChecklistSchedule(db, checklist.id, date ? startOfDay(date).getTime() : null);
      setScheduledDate(date);
      await refresh();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o agendamento.');
      console.error(err);
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const openSchedulePicker = () => {
    const today = startOfDay(new Date());
    const currentDate = scheduledDate ?? today;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'date',
        minimumDate: today,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            void commitSchedule(startOfDay(date));
          }
        },
      });
      return;
    }

    setPickerDate(currentDate);
    setShowDatePicker(true);
  };

  const handleSyncTextItems = async () => {
    if (!checklist) return;

    const lines = textDraft
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      Alert.alert('Informe pelo menos uma linha', 'Escreva o conteúdo da checklist.');
      return;
    }

    setSyncingText(true);
    try {
      await syncItemsFromLines(db, checklistId, checklist.items, lines);
      setTextEditorVisible(false);
      await refresh();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o texto.');
      console.error(err);
    } finally {
      setSyncingText(false);
    }
  };

  if (loading && !checklist) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}
        accessibilityLabel="Carregando checklist">
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !checklist) {
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
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.container}
      accessibilityLabel={`Checklist ${checklist.title}`}>
      <View style={styles.section}>
        <TextField
          label="Título"
          value={titleDraft}
          onChangeText={setTitleDraft}
          onBlur={handleSaveTitle}
          editable={!isSavingTitle}
        />
        <Button label="Salvar título" onPress={handleSaveTitle} loading={isSavingTitle} variant="secondary" />
      </View>

      <View
        style={[styles.statsCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
        accessibilityRole="summary">
        <View style={styles.statsRow}>
          <Stat label="Progresso" value={formatProgress(totals.completedItems, totals.totalItems)} />
          <Stat label="Total" value={formatCurrency(totals.totalAmount)} />
          <Stat label="✓ Somado" value={formatCurrency(totals.completedAmount)} accent={palette.success} />
        </View>
      </View>

      <ScheduleCard
        palette={palette}
        scheduledDate={scheduledDate}
        status={scheduleStatus}
        onEdit={openSchedulePicker}
        onClear={() => void commitSchedule(null)}
        loading={updatingSchedule}
      />

      <View style={[styles.modeSelector, { backgroundColor: palette.surface }]}
        accessibilityRole="radiogroup">
        <ModeToggle
          label="Lista"
          selected={checklist.mode === 'list'}
          onPress={() => handleModeChange('list')}
          palette={palette}
          disabled={modeChanging}
        />
        <ModeToggle
          label="Texto"
          selected={checklist.mode === 'text'}
          onPress={() => handleModeChange('text')}
          palette={palette}
          disabled={modeChanging}
        />
      </View>

      {checklist.mode === 'text' ? (
        <View style={[styles.section, styles.textModeInfo, { borderColor: palette.border }]}>
          <ThemedText style={{ color: palette.textMuted }}>
            Cada linha do texto vira um item marcável. Use o botão abaixo para editar todo o conteúdo.
          </ThemedText>
          <Button label="Editar texto" variant="secondary" onPress={() => setTextEditorVisible(true)} />
        </View>
      ) : null}

      <View style={styles.section}>
        {checklist.items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={() => handleToggleItem(item)}
            onEdit={() => openEditItem(item)}
            onDelete={() => handleDeleteItem(item)}
            mode={checklist.mode}
          />
        ))}
      </View>

      {checklist.mode === 'list' ? (
        <View style={[styles.section, styles.newItemSection, { borderColor: palette.border }]}
          accessibilityLabel="Adicionar novo item">
          <TextField
            label="Novo item"
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Nome do item"
          />
          <TextField
            label="Preço"
            value={newItemPrice}
            onChangeText={setNewItemPrice}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <Button label="Adicionar item" onPress={handleAddItem} loading={savingItem} />
        </View>
      ) : null}

      <Button label="Remover checklist" variant="danger" onPress={handleDeleteChecklist} />

      <Modal transparent visible={Boolean(editingItem)} animationType="slide" onRequestClose={() => setEditingItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]}
            accessibilityLabel="Editar item">
            <TextField
              label="Nome do item"
              value={editingItem?.name ?? ''}
              onChangeText={(value) => setEditingItem((prev) => (prev ? { ...prev, name: value } : prev))}
            />
            <TextField
              label="Preço"
              value={editingItem?.price ?? ''}
              onChangeText={(value) => setEditingItem((prev) => (prev ? { ...prev, price: value } : prev))}
              keyboardType="decimal-pad"
            />
            <View style={styles.modalActions}>
              <Button label="Cancelar" variant="ghost" onPress={() => setEditingItem(null)} />
              <Button label="Salvar" onPress={handleSaveItemEdit} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={textEditorVisible}
        animationType="slide"
        onRequestClose={() => setTextEditorVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]}
            accessibilityLabel="Editar texto da checklist">
            <TextField
              label="Itens (um por linha)"
              value={textDraft}
              onChangeText={setTextDraft}
              multiline
              numberOfLines={10}
              helperText="Linhas vazias serão ignoradas."
            />
            <View style={styles.modalActions}>
              <Button label="Cancelar" variant="ghost" onPress={() => setTextEditorVisible(false)} />
              <Button label="Salvar" onPress={handleSyncTextItems} loading={syncingText} />
            </View>
          </View>
        </View>
      </Modal>

      <SchedulePickerModal
        visible={showDatePicker}
        initialDate={pickerDate}
        onCancel={() => setShowDatePicker(false)}
        onConfirm={async (date) => {
          setShowDatePicker(false);
          await commitSchedule(date);
        }}
        palette={palette}
      />
    </ScrollView>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  return (
    <View style={styles.stat} accessibilityRole="text">
      <View style={[styles.statCard, { backgroundColor: palette.surfaceMuted }]}
        accessibilityHint={label}>
        <ThemedText style={[styles.statLabel, { color: palette.textMuted }]}>{label}</ThemedText>
        <ThemedText type="defaultSemiBold" style={[styles.statValue, accent ? { color: accent } : null]}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function ModeToggle({
  label,
  selected,
  onPress,
  palette,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: (typeof Colors)['light'];
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.modePill,
        {
          backgroundColor: selected ? palette.primary : 'transparent',
          opacity: pressed ? 0.85 : 1,
          borderColor: palette.border,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
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

function ScheduleCard({
  scheduledDate,
  status,
  onEdit,
  onClear,
  palette,
  loading,
}: {
  scheduledDate: Date | null;
  status: { label: string; tone: ScheduleState } | null;
  onEdit: () => void;
  onClear: () => void;
  palette: (typeof Colors)['light'];
  loading: boolean;
}) {
  return (
    <View
      style={[
        styles.scheduleCard,
        {
          borderColor: palette.border,
          backgroundColor: palette.surface,
        },
      ]}
      accessibilityRole="summary">
      <View style={styles.scheduleHeader}>
        <Ionicons name="calendar" size={20} color={palette.primary} />
        <View style={styles.scheduleInfo}>
          <ThemedText type="defaultSemiBold">Agendamento</ThemedText>
          <ThemedText style={{ color: palette.textMuted }}>
            {scheduledDate ? formatFullDate(scheduledDate.getTime()) : 'Nenhuma data definida'}
          </ThemedText>
        </View>
        {status ? <ScheduleBadge status={status} palette={palette} /> : null}
      </View>
      <View style={styles.scheduleActions}>
        <Button label={scheduledDate ? 'Alterar' : 'Agendar'} variant="secondary" onPress={onEdit} loading={loading} />
        {scheduledDate ? (
          <Button label="Remover" variant="ghost" onPress={onClear} disabled={loading} />
        ) : null}
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
  }, [visible, initialDate]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: palette.surface }]}
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
          />
          <View style={styles.modalActions}>
            <Button label="Cancelar" variant="ghost" onPress={onCancel} />
            <Button label="Confirmar" onPress={() => onConfirm(tempDate)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ScheduleBadge({
  status,
  palette,
}: {
  status: { label: string; tone: ScheduleState };
  palette: (typeof Colors)['light'];
}) {
  let backgroundColor = palette.surfaceMuted;
  let textColor = palette.text;

  if (status.tone === 'today') {
    backgroundColor = palette.destructive;
    textColor = palette.primaryForeground;
  } else if (status.tone === 'overdue') {
    backgroundColor = palette.destructive;
    textColor = palette.primaryForeground;
  } else if (status.tone === 'upcoming') {
    backgroundColor = palette.primary;
    textColor = palette.primaryForeground;
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}
      accessibilityRole="text">
      <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
        {status.label}
      </ThemedText>
    </View>
  );
}

async function syncItemsFromLines(
  db: Database,
  checklistId: number,
  currentItems: ChecklistItem[],
  lines: string[],
) {
  const existing = [...currentItems];
  const minLength = Math.min(existing.length, lines.length);

  for (let index = 0; index < minLength; index += 1) {
    const item = existing[index];
    const nextName = lines[index];
    if (item.name !== nextName) {
      await updateItem(db, item.id, { name: nextName });
    }
  }

  if (lines.length < existing.length) {
    for (let index = lines.length; index < existing.length; index += 1) {
      await deleteItem(db, existing[index].id);
    }
  }

  if (lines.length > existing.length) {
    for (let index = existing.length; index < lines.length; index += 1) {
      await createItem(db, { checklistId, name: lines[index], price: null });
    }
  }
}

function itemsToText(items: ChecklistItem[]): string {
  return items.map((item) => item.name).join('\n');
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 16,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
  },
  statCard: {
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
  },
  scheduleCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleInfo: {
    flex: 1,
    gap: 4,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    gap: 8,
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
  textModeInfo: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  newItemSection: {
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
