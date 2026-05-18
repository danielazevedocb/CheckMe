import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';

import { ChecklistCard } from '@/components/checklist/checklist-card';
import { useDatabase } from '@/contexts/database-context';
import { markAllItemsDone } from '@/repositories/item-repository';
import { ChecklistCardSkeleton } from '@/components/checklist/checklist-card-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { FloatingActionButton } from '@/components/ui/fab';
import { SearchBar } from '@/components/ui/search-bar';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { useChecklists } from '@/hooks/use-checklists';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { ChecklistStatus, ChecklistSummary } from '@/types/checklist';

const HOME_FILTERS: { value: ChecklistStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Em aberto' },
  { value: 'completed', label: 'Concluídas' },
];

function ListSeparator(): JSX.Element {
  return <View style={listSeparatorStyles.separator} />;
}

const listSeparatorStyles = StyleSheet.create({
  separator: {
    height: 8,
  },
});

function getEmptyCopy(status: ChecklistStatus): { title: string; description: string; showCreate: boolean } {
  switch (status) {
    case 'completed':
      return {
        title: 'Nenhuma lista concluída',
        description: 'Finalize todos os itens de uma checklist para vê-la aqui.',
        showCreate: false,
      };
    case 'open':
      return {
        title: 'Nenhuma checklist em aberto',
        description: 'Crie uma nova checklist ou conclua tarefas em listas existentes.',
        showCreate: true,
      };
    default:
      return {
        title: 'Nenhuma checklist',
        description: 'Comece criando uma nova checklist para acompanhar suas tarefas.',
        showCreate: true,
      };
  }
}

export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const db = useDatabase();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [statusFilter, setStatusFilter] = useState<ChecklistStatus>('all');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { data, loading, refresh, error } = useChecklists(statusFilter, debouncedSearch);

  const emptyCopy = useMemo(() => {
    if (error) {
      return { title: 'Falha ao carregar', description: 'Toque para tentar novamente.', showCreate: false, isError: true };
    }
    return { ...getEmptyCopy(statusFilter), isError: false };
  }, [statusFilter, error]);

  const openChecklist = useCallback(
    (checklistId: number) => {
      router.push(`/checklist/${checklistId}`);
    },
    [router],
  );

  const [typeModalVisible, setTypeModalVisible] = useState(false);

  const goToNewChecklist = useCallback((type?: 'task' | 'shopping') => {
    setTypeModalVisible(false);
    if (type) {
      router.push(`/(tabs)/nova?type=${type}`);
    } else {
      router.push('/(tabs)/nova');
    }
  }, [router]);

  const handleToggleComplete = useCallback(
    async (checklistId: number, currentlyCompleted: boolean) => {
      try {
        await markAllItemsDone(db, checklistId, !currentlyCompleted);
        await refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [db, refresh],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChecklistSummary>) => (
      <ChecklistCard summary={item} onPress={openChecklist} onToggleComplete={handleToggleComplete} />
    ),
    [openChecklist, handleToggleComplete],
  );

  const keyExtractor = useCallback((item: ChecklistSummary) => item.id.toString(), []);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]} accessibilityLabel="Checklists">
      <SearchBar value={searchInput} onChangeText={setSearchInput} placeholder="Buscar listas" />

      <View style={styles.filterRow} accessibilityRole="tablist">
        {HOME_FILTERS.map((filter) => {
          const selected = statusFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={filter.label}
              onPress={() => setStatusFilter(filter.value)}
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

      {loading && data.length === 0 ? (
        <View style={styles.skeletonList}>
          <ChecklistCardSkeleton />
          <ChecklistCardSkeleton />
          <ChecklistCardSkeleton />
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          title={emptyCopy.title}
          description={emptyCopy.description}
          actionLabel={emptyCopy.isError ? 'Tentar de novo' : emptyCopy.showCreate ? 'Nova checklist' : undefined}
          onPressAction={emptyCopy.isError ? refresh : emptyCopy.showCreate ? () => setTypeModalVisible(true) : undefined}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={palette.text} />}
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}

      <FloatingActionButton onPress={() => setTypeModalVisible(true)} accessibilityLabel="Criar nova checklist" />

      <Modal
        transparent
        visible={typeModalVisible}
        animationType="slide"
        onRequestClose={() => setTypeModalVisible(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: palette.overlay }]} onPress={() => setTypeModalVisible(false)}>
          <Pressable style={[styles.typeSheet, { backgroundColor: palette.surface }]}>
            <ThemedText type="subtitle" style={styles.sheetTitle}>Nova checklist</ThemedText>
            <Pressable
              onPress={() => goToNewChecklist('task')}
              style={[styles.typeOption, { borderColor: palette.border }]}>
              <Text style={styles.typeOptionIcon}>✅</Text>
              <View style={styles.typeOptionText}>
                <ThemedText type="defaultSemiBold">Dia a dia</ThemedText>
                <ThemedText style={{ color: palette.textMuted, fontSize: 13 }}>Tarefas com prioridade (alta / média / baixa)</ThemedText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => goToNewChecklist('shopping')}
              style={[styles.typeOption, { borderColor: palette.border }]}>
              <Text style={styles.typeOptionIcon}>🛒</Text>
              <View style={styles.typeOptionText}>
                <ThemedText type="defaultSemiBold">Lista de mercado</ThemedText>
                <ThemedText style={{ color: palette.textMuted, fontSize: 13 }}>Itens com quantidade, preço e total automático</ThemedText>
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  skeletonList: {
    flex: 1,
    paddingTop: 16,
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  typeSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  sheetTitle: {
    marginBottom: 4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typeOptionIcon: {
    fontSize: 28,
  },
  typeOptionText: {
    flex: 1,
    gap: 2,
  },
});
