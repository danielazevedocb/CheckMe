import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ChecklistCard } from '@/components/checklist/checklist-card';
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
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [statusFilter, setStatusFilter] = useState<ChecklistStatus>('all');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { data, loading, refresh, error } = useChecklists(statusFilter, debouncedSearch);

  const emptyCopy = useMemo(() => getEmptyCopy(statusFilter), [statusFilter]);

  const openChecklist = useCallback(
    (checklistId: number) => {
      router.push(`/checklist/${checklistId}`);
    },
    [router],
  );

  const goToNewChecklist = useCallback(() => {
    router.push('/(tabs)/nova');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChecklistSummary>) => (
      <ChecklistCard summary={item} onPress={openChecklist} />
    ),
    [openChecklist],
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
      ) : null}

      {!loading && data.length === 0 ? (
        <EmptyState
          title={emptyCopy.title}
          description={emptyCopy.description}
          actionLabel={emptyCopy.showCreate ? 'Nova checklist' : undefined}
          onPressAction={emptyCopy.showCreate ? goToNewChecklist : undefined}
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

      {error ? (
        <View style={styles.errorWrapper}>
          <EmptyState
            title="Falha ao carregar"
            description="Verifique os dados e tente novamente."
            actionLabel="Tentar de novo"
            onPressAction={refresh}
          />
        </View>
      ) : null}

      <FloatingActionButton onPress={goToNewChecklist} accessibilityLabel="Criar nova checklist" />
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
  errorWrapper: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
  },
});
