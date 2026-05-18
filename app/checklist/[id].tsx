import * as Haptics from 'expo-haptics';
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ProgressBar } from '@/components/checklist/progress-bar';
import { TaskForm, type TaskFormValues } from '@/components/checklist/task-form';
import { TaskItem } from '@/components/checklist/task-item';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FloatingActionButton } from '@/components/ui/fab';
import { Colors } from '@/constants/theme';
import { useDatabase } from '@/contexts/database-context';
import { useThemeMode } from '@/contexts/theme-context';
import { useChecklist } from '@/hooks/use-checklist';
import { deleteChecklist } from '@/repositories/checklist-repository';
import { createItem, deleteItem, reorderItems, setItemDone, updateItem } from '@/repositories/item-repository';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const checklistId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const priorityOption = priorityFilter === 'ALL' ? undefined : priorityFilter;

  const { data: checklist, loading, error, refresh } = useChecklist(checklistId, {
    priority: priorityOption,
  });

  const [itemsOrder, setItemsOrder] = useState<ChecklistItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [taskModal, setTaskModal] = useState<TaskModalState | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const draggableListRef = useRef<ComponentRef<typeof DraggableFlatList<ChecklistItem>> | null>(null);
  const itemsOrderRef = useRef(itemsOrder);
  const swipeableRefs = useRef<Record<number, SwipeableMethods | null>>({});

  const accentColor = checklist?.color ?? palette.primary;
  const dragEnabled = priorityFilter === 'ALL' && taskModal === null;

  useEffect(() => {
    itemsOrderRef.current = itemsOrder;
  }, [itemsOrder]);

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
      setRefreshKey((prev) => prev + 1);
    } else {
      setItemsOrder([]);
    }
  }, [checklist]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        draggableListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const taskFormInitial = useMemo((): Partial<TaskFormValues> | undefined => {
    if (!taskModal || taskModal.mode === 'create') {
      return undefined;
    }

    return {
      title: taskModal.item.title,
      description: taskModal.item.description ?? '',
      priority: taskModal.item.priority,
    };
  }, [taskModal]);

  const handleToggleItem = useCallback(
    async (itemId: number) => {
      const items = itemsOrderRef.current;
      const item = items.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }

      const totalItems = items.length;
      const completedItems = items.filter((entry) => entry.completed).length;
      const markingDone = !item.completed;
      const willCompleteAll =
        markingDone && totalItems > 0 && completedItems + 1 === totalItems;

      try {
        await setItemDone(db, itemId, !item.completed);
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

  const handleDragBegin = useCallback(() => {
    setIsDragging(true);
    Object.values(swipeableRefs.current).forEach((ref) => {
      ref?.close();
    });
  }, []);

  const handleDragEnd = useCallback(
    async ({ data }: { data: ChecklistItem[] }) => {
      setIsDragging(false);
      const previousOrder = itemsOrderRef.current;
      setItemsOrder(data);

      try {
        await reorderItems(
          db,
          checklistId,
          data.map((entry) => entry.id),
        );
        await refresh();
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível reordenar as tarefas.');
        console.error(err);
        setItemsOrder(previousOrder);
      }
    },
    [checklistId, db, refresh],
  );

  const handleTaskSubmit = useCallback(
    async (values: TaskFormValues) => {
      setSavingTask(true);
      try {
        if (taskModal?.mode === 'edit') {
          await updateItem(db, taskModal.item.id, {
            title: values.title,
            description: values.description || null,
            priority: values.priority,
          });
        } else {
          await createItem(db, {
            checklistId,
            title: values.title,
            description: values.description || null,
            priority: values.priority,
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

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ChecklistItem>) => (
      <ScaleDecorator activeScale={1.02}>
        <TaskItem
          item={item}
          accentColor={accentColor}
          onToggle={handleToggleItem}
          onEdit={openEditItem}
          onDelete={handleDeleteItem}
          onSwipeDelete={handleSwipeDeleteItem}
          dragEnabled={dragEnabled}
          onDrag={drag}
          isDragging={isActive}
          swipeEnabled={dragEnabled && !isDragging && !isActive}
          onSwipeableWillOpen={closeOtherSwipeables}
          onSwipeableRef={handleSwipeableRef}
        />
      </ScaleDecorator>
    ),
    [
      accentColor,
      closeOtherSwipeables,
      dragEnabled,
      handleDeleteItem,
      handleSwipeDeleteItem,
      handleSwipeableRef,
      handleToggleItem,
      isDragging,
      openEditItem,
    ],
  );

  const keyExtractor = useCallback((item: ChecklistItem) => item.id.toString(), []);

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
      </View>

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

      {priorityFilter !== 'ALL' ? (
        <ThemedText style={[styles.filterHint, { color: palette.textMuted }]}>
          Reordenar tarefas está disponível com o filtro &quot;Todas&quot;.
        </ThemedText>
      ) : null}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Button label="Adicionar tarefa" onPress={() => setTaskModal({ mode: 'create' })} />
      <Button
        label="Editar checklist"
        variant="secondary"
        onPress={() => router.push(`/checklist/edit/${checklistId}`)}
      />
      <Button label="Remover checklist" variant="danger" onPress={handleDeleteChecklist} />
    </View>
  );

  const listEmptyComponent =
    priorityFilter === 'ALL' ? (
      <EmptyState
        title="Nenhuma tarefa ainda"
        description="Adicione a primeira tarefa para começar."
        actionLabel="Adicionar tarefa"
        onPressAction={() => setTaskModal({ mode: 'create' })}
      />
    ) : (
      <EmptyState
        title="Nenhuma tarefa neste filtro"
        description='Altere o filtro para "Todas" ou crie uma tarefa com esta prioridade.'
      />
    );

  const listContentStyle = [
    styles.listContent,
    itemsOrder.length === 0 ? styles.listContentEmpty : null,
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      // Android/web: behavior "height" collapses the list body to zero when the keyboard is hidden.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
      <DraggableFlatList
        ref={draggableListRef}
        style={styles.flex}
        contentContainerStyle={listContentStyle}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={listEmptyComponent}
        accessibilityLabel={`Checklist ${checklist.title}`}
        showsVerticalScrollIndicator={false}
        data={itemsOrder}
        extraData={`${refreshKey}-${priorityFilter}-${isDragging}`}
        keyExtractor={keyExtractor}
        renderItem={renderDraggableItem}
        onDragBegin={dragEnabled ? handleDragBegin : undefined}
        onDragEnd={dragEnabled ? handleDragEnd : undefined}
        activationDistance={dragEnabled ? 8 : 9999}
      />

      {taskModal === null ? (
        <FloatingActionButton
          accessibilityLabel="Adicionar tarefa"
          onPress={() => setTaskModal({ mode: 'create' })}
        />
      ) : null}

      <Modal
        transparent
        visible={taskModal !== null}
        animationType="slide"
        onRequestClose={() => setTaskModal(null)}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: palette.surface }]}
            accessibilityLabel={taskModal?.mode === 'edit' ? 'Editar tarefa' : 'Nova tarefa'}>
            <ThemedText type="subtitle">
              {taskModal?.mode === 'edit' ? 'Editar tarefa' : 'Nova tarefa'}
            </ThemedText>
            <TaskForm
              key={taskModal?.mode === 'edit' ? taskModal.item.id : 'create'}
              initialValues={taskFormInitial}
              submitLabel={taskModal?.mode === 'edit' ? 'Salvar alterações' : 'Adicionar tarefa'}
              onSubmit={handleTaskSubmit}
              onCancel={() => setTaskModal(null)}
              loading={savingTask}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  },
  listContentEmpty: {
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
  filterHint: {
    fontSize: 13,
  },
  footer: {
    gap: 12,
    marginTop: 8,
  },
  headerAction: {
    paddingHorizontal: 16,
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
    maxHeight: '90%',
  },
});
