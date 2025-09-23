import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChecklistCard } from '@/components/checklist/checklist-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FloatingActionButton } from '@/components/ui/fab';
import { SearchBar } from '@/components/ui/search-bar';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { useChecklists } from '@/hooks/use-checklists';

export default function AbertasScreen(): JSX.Element {
  const router = useRouter();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [search, setSearch] = useState('');
  const { data, loading, refresh, error } = useChecklists('open', search);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]} accessibilityLabel="Listas em aberto">
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar listas" />

      {loading && data.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : null}

      {!loading && data.length === 0 ? (
        <EmptyState
          title="Nenhuma checklist"
          description="Comece criando uma nova checklist para acompanhar suas tarefas."
          actionLabel="Nova checklist"
          onPressAction={() => router.push('/(tabs)/nova')}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChecklistCard summary={item} onPress={() => router.push(`/checklist/${item.id}`)} />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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

      <FloatingActionButton
        onPress={() => router.push('/(tabs)/nova')}
        accessibilityLabel="Criar nova checklist"
      />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrapper: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
  },
});
