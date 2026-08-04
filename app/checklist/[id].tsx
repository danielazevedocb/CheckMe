import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  type ListRenderItemInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ProgressBar } from '@/components/checklist/progress-bar';
import { TaskForm, type TaskFormValues } from '@/components/checklist/task-form';
import { TaskItem } from '@/components/checklist/task-item';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors } from '@/constants/theme';
import { useDatabase } from '@/contexts/database-context';
import { useThemeMode } from '@/contexts/theme-context';
import { useChecklist } from '@/hooks/use-checklist';
import { deleteChecklist } from '@/repositories/checklist-repository';
import { createItem, deleteItem, setItemDone, updateItem } from '@/repositories/item-repository';
import type { ChecklistItem, TaskPriority } from '@/types/checklist';

type PriorityFilter = 'ALL' | TaskPriority;

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'LOW', label: 'Baixa' },
];

type TaskModalState =
  | { mode: 'create' }
  | { mode: 'edit'; item: ChecklistItem };

export default function ChecklistDetailsScreen(): JSX.Element {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const checklistId = useMemo(() => {
    const raw = Array.isArray(idParam) ? idParam[0] : idParam;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [idParam]);
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = 56;
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const priorityOption = priorityFilter === 'ALL' ? undefined : priorityFilter;

  const { data: checklist, loading, error, refresh } = useChecklist(checklistId, {
    priority: priorityOption,
  });

  const [itemsOrder, setItemsOrder] = useState<ChecklistItem[]>([]);
  const [taskModal, setTaskModal] = useState<TaskModalState | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const flatListRef = useRef<ComponentRef<typeof FlatList<ChecklistItem>> | null>(null);
  const itemsOrderRef = useRef(itemsOrder);
  const swipeableRefs = useRef<Record<number, SwipeableMethods | null>>({});
  const taskModalRef = useRef<TaskModalState | null>(null);

  const accentColor = checklist?.color ?? palette.primary;

  useEffect(() => {
    itemsOrderRef.current = itemsOrder;
  }, [itemsOrder]);

  useEffect(() => {
    taskModalRef.current = taskModal;
  }, [taskModal]);

  useEffect(() => {
    navigation.setOptions({
      title: checklist?.title ?? 'Checklist',
      headerRight: () => (
        <Pressable
          onPress={() => router.push(`/checklist/edit/${checklistId}`)}
          accessibilityRole="button"
          accessibilityLabel="Editar checklist"
          style={styles.headerAction}>
          <ThemedText type="link">Editar</ThemedText>
        </Pressable>
      ),
    });
  }, [checklist?.title, checklistId, navigation, router]);

  useEffect(() => {
    if (checklist) {
      setItemsOrder(checklist.items);
    } else {
      setItemsOrder([]);
    }
  }, [checklist]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (taskModalRef.current !== null) return;
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const isShoppingMode = checklist?.type === 'shopping';

  const taskFormInitial = useMemo((): Partial<TaskFormValues> | undefined => {
    if (!taskModal || taskModal.mode === 'create') {
      return undefined;
    }

    return {
      title: taskModal.item.title,
      description: taskModal.item.description ?? '',
      priority: taskModal.item.priority,
      quantity: taskModal.item.quantity ?? 1,
      price: taskModal.item.price ?? null,
    };
  }, [taskModal]);

  const handleToggleItem = useCallback(
    async (itemId: number, currentCompleted: boolean) => {
      const items = itemsOrderRef.current;
      const totalItems = items.length;
      const completedItems = items.filter((entry) => entry.completed).length;
      const markingDone = !currentCompleted;
      const willCompleteAll =
        markingDone && totalItems > 0 && completedItems + 1 === totalItems;

      try {
        await setItemDone(db, itemId, !currentCompleted);
        await refresh();
        if (willCompleteAll) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
        console.error(err);
      }
    },
    [db, refresh],
  );

  const handleDeleteItem = useCallback(
    (itemId: number) => {
      const item = itemsOrderRef.current.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }

      Alert.alert('Remover tarefa', `Deseja remover "${item.title}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(db, itemId);
              await refresh();
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível remover a tarefa.');
              console.error(err);
            }
          },
        },
      ]);
    },
    [db, refresh],
  );

  const handleSwipeDeleteItem = useCallback(
    async (itemId: number) => {
      try {
        await deleteItem(db, itemId);
        delete swipeableRefs.current[itemId];
        await refresh();
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível remover a tarefa.');
        console.error(err);
      }
    },
    [db, refresh],
  );

  const closeOtherSwipeables = useCallback((activeItemId: number) => {
    Object.entries(swipeableRefs.current).forEach(([itemId, ref]) => {
      if (Number(itemId) !== activeItemId) {
        ref?.close();
      }
    });
  }, []);

  const handleSwipeableRef = useCallback((itemId: number, ref: SwipeableMethods | null) => {
    if (ref) {
      swipeableRefs.current[itemId] = ref;
      return;
    }
    delete swipeableRefs.current[itemId];
  }, []);

  const handleDeleteChecklist = () => {
    if (!checklist) {
      return;
    }

    Alert.alert('Remover checklist', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChecklist(db, checklist.id);
            router.back();
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível remover a checklist.');
            console.error(err);
          }
        },
      },
    ]);
  };

  const openEditItem = useCallback((itemId: number) => {
    const item = itemsOrderRef.current.find((entry) => entry.id === itemId);
    if (item) {
      setTaskModal({ mode: 'edit', item });
    }
  }, []);


  const handleTaskSubmit = useCallback(
    async (values: TaskFormValues) => {
      setSavingTask(true);
      try {
        if (taskModal?.mode === 'edit') {
          await updateItem(db, taskModal.item.id, {
            title: values.title,
            description: values.description || null,
            priority: values.priority,
            quantity: values.quantity,
            price: values.price,
          });
        } else {
          await createItem(db, {
            checklistId,
            title: values.title,
            description: values.description || null,
            priority: values.priority,
            quantity: values.quantity,
            price: values.price,
          });
        }

        setTaskModal(null);
        await refresh();
      } catch (err) {
        Alert.alert(
          'Erro',
          taskModal?.mode === 'edit'
            ? 'Não foi possível atualizar a tarefa.'
            : 'Não foi possível adicionar a tarefa.',
        );
        console.error(err);
      } finally {
        setSavingTask(false);
      }
    },
    [checklistId, db, refresh, taskModal],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChecklistItem>) => (
      <TaskItem
        item={item}
        accentColor={accentColor}
        onToggle={handleToggleItem}
        onEdit={openEditItem}
        onDelete={handleDeleteItem}
        onSwipeDelete={handleSwipeDeleteItem}
        swipeEnabled
        onSwipeableWillOpen={closeOtherSwipeables}
        onSwipeableRef={handleSwipeableRef}
        shoppingMode={isShoppingMode}
      />
    ),
    [
      accentColor,
      closeOtherSwipeables,
      handleDeleteItem,
      handleSwipeDeleteItem,
      handleSwipeableRef,
      handleToggleItem,
      isShoppingMode,
      openEditItem,
    ],
  );

  const keyExtractor = useCallback((item: ChecklistItem) => item.id.toString(), []);

  if (!Number.isFinite(checklistId)) {
    return (
      <EmptyState
        title="Checklist inválida"
        description="Não foi possível abrir esta checklist."
        actionLabel="Voltar"
        onPressAction={() => router.back()}
      />
    );
  }

  if (loading && !checklist) {
    return (
      <View
        style={[styles.centered, { backgroundColor: palette.background }]}
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {checklist.icon ? (
          <Text style={styles.checklistIcon} accessibilityElementsHidden importantForAccessibility="no">
            {checklist.icon}
          </Text>
        ) : null}
        <ThemedText type="title" style={styles.checklistTitle} numberOfLines={2}>
          {checklist.title}
        </ThemedText>
      </View>

      <View
        style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
        accessibilityRole="summary">
        <ProgressBar
          label="Progresso"
          completed={checklist.completedItems}
          total={checklist.totalItems}
          showPercent
        />
        {isShoppingMode ? (() => {
          const grandTotal = itemsOrder.reduce((sum, item) => {
            const qty = item.quantity ?? 1;
            const p = item.price ?? null;
            return p != null ? sum + qty * p : sum;
          }, 0);
          const completedTotal = itemsOrder.reduce((sum, item) => {
            if (!item.completed) return sum;
            const qty = item.quantity ?? 1;
            const p = item.price ?? null;
            return p != null ? sum + qty * p : sum;
          }, 0);
          return (
            <>
              {grandTotal > 0 ? (
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: palette.textMuted }]}>Total estimado</ThemedText>
                  <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>
                    R$ {grandTotal.toFixed(2)}
                  </ThemedText>
                </View>
              ) : null}
              {completedTotal > 0 ? (
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: palette.textMuted }]}>Total concluído</ThemedText>
                  <ThemedText type="defaultSemiBold" style={{ color: palette.success }}>
                    R$ {completedTotal.toFixed(2)}
                  </ThemedText>
                </View>
              ) : null}
            </>
          );
        })() : null}
      </View>

      {!isShoppingMode ? (
        <View style={styles.filterRow} accessibilityRole="tablist">
        {PRIORITY_FILTERS.map((filter) => {
          const selected = priorityFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={filter.label}
              onPress={() => setPriorityFilter(filter.value)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? palette.primary : palette.surface,
                  borderColor: selected ? palette.primary : palette.border,
                },
              ]}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: selected ? palette.primaryForeground : palette.text },
                ]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      ) : null}

    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Button
        label={isShoppingMode ? 'Adicionar item' : 'Adicionar tarefa'}
        icon={<Ionicons name="add" size={18} color={palette.primaryForeground} />}
        onPress={() => setTaskModal({ mode: 'create' })}
      />
      <View style={styles.footerActions}>
        <Button
          label="Editar"
          variant="secondary"
          icon={<Ionicons name="pencil-outline" size={16} color={palette.text} />}
          style={styles.footerActionBtn}
          onPress={() => router.push(`/checklist/edit/${checklistId}`)}
        />
        <Button
          label="Remover"
          variant="danger"
          icon={<Ionicons name="trash-outline" size={16} color={palette.primaryForeground} />}
          style={styles.footerActionBtn}
          onPress={handleDeleteChecklist}
        />
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isShoppingMode) {
      return (
        <EmptyState
          title="Nenhum item ainda"
          description="Adicione o primeiro item à sua lista de mercado."
        />
      );
    }
    return priorityFilter === 'ALL' ? (
      <EmptyState
        title="Nenhuma tarefa ainda"
        description="Adicione a primeira tarefa para começar."
      />
    ) : (
      <EmptyState
        title="Nenhuma tarefa neste filtro"
        description='Altere o filtro para "Todas" ou crie uma tarefa com esta prioridade.'
      />
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
        <FlatList
          ref={flatListRef}
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          accessibilityLabel={`Checklist ${checklist.title}`}
          showsVerticalScrollIndicator={false}
          data={itemsOrder}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={taskModal !== null}
        animationType="slide"
        onRequestClose={() => setTaskModal(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior="padding">
          <Pressable style={styles.modalBackdrop} onPress={() => setTaskModal(null)} />
          <View
            style={[styles.modalSheet, { backgroundColor: palette.surface }]}
            accessibilityLabel={taskModal?.mode === 'edit' ? 'Editar tarefa' : 'Nova tarefa'}>
            <View style={styles.sheetHandle} />
            <View style={[styles.sheetHeader, { borderBottomColor: palette.border }]}>
              <ThemedText type="subtitle" style={styles.sheetTitle}>
                {taskModal?.mode === 'edit'
                  ? isShoppingMode
                    ? 'Editar item'
                    : 'Editar tarefa'
                  : isShoppingMode
                    ? 'Novo item'
                    : 'Nova tarefa'}
              </ThemedText>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <TaskForm
                key={taskModal?.mode === 'edit' ? taskModal.item.id : 'create'}
                initialValues={taskFormInitial}
                submitLabel={taskModal?.mode === 'edit' ? 'Salvar alterações' : isShoppingMode ? 'Adicionar item' : 'Adicionar tarefa'}
                onSubmit={handleTaskSubmit}
                onCancel={() => setTaskModal(null)}
                loading={savingTask}
                shoppingMode={isShoppingMode}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
    paddingTop: 16,
    gap: 16,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistIcon: {
    fontSize: 28,
  },
  checklistTitle: {
    flex: 1,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    gap: 10,
    marginTop: 8,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  footerActionBtn: {
    flex: 1,
  },
  headerAction: {
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 18,
  },
  sheetScroll: {
    flexShrink: 1,
  },
  sheetScrollContent: {
    padding: 20,
  },
});
