import { useCallback, useState } from 'react';
import { FlatList, type ListRenderItemInfo, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChecklistCard } from '@/components/checklist/checklist-card';
import { ChecklistCardSkeleton } from '@/components/checklist/checklist-card-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchBar } from '@/components/ui/search-bar';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { useChecklists } from '@/hooks/use-checklists';
import type { ChecklistSummary } from '@/types/checklist';

function ListSeparator(): JSX.Element {
  return <View style={listSeparatorStyles.separator} />;
}

const listSeparatorStyles = StyleSheet.create({
  separator: {
    height: 8,
  },
});

export default function ConcluidasScreen(): JSX.Element {
  const router = useRouter();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [search, setSearch] = useState('');
  const { data, loading, refresh, error } = useChecklists('completed', search);

  const openChecklist = useCallback(
    (checklistId: number) => {
      router.push(`/checklist/${checklistId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChecklistSummary>) => (
      <ChecklistCard summary={item} onPress={openChecklist} />
    ),
    [openChecklist],
  );

  const keyExtractor = useCallback((item: ChecklistSummary) => item.id.toString(), []);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]} accessibilityLabel="Listas concluídas">
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar listas" />

      {loading && data.length === 0 ? (
        <View style={styles.skeletonList}>
          <ChecklistCardSkeleton />
          <ChecklistCardSkeleton />
          <ChecklistCardSkeleton />
        </View>
      ) : null}

      {!loading && data.length === 0 ? (
        <EmptyState
          title="Nenhuma lista concluída"
          description="Finalize todos os itens de uma checklist para vê-la aqui."
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={palette.text} />}
          ListFooterComponent={<View style={{ height: 48 }} />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  separator: {
    height: 8,
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
