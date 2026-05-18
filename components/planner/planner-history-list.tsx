import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { usePlannerSummaries } from '@/hooks/use-planner-summaries';
import type { PlannerDaySummary } from '@/repositories/planner-repository';
import { formatFullDate, startOfDay } from '@/utils/format';

interface PlannerHistoryListProps {
  onSelectDate?: (date: number) => void;
}

export function PlannerHistoryList({ onSelectDate }: PlannerHistoryListProps): JSX.Element {
  const router = useRouter();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const { summaries, loading, error, refresh } = usePlannerSummaries();
  const today = startOfDay(new Date()).getTime();

  const handleSelect = useCallback(
    (date: number) => {
      if (onSelectDate) {
        onSelectDate(date);
        return;
      }
      router.push(`/planner/${date}`);
    },
    [onSelectDate, router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PlannerDaySummary>) => {
      const isToday = item.date === today;
      const progressText =
        item.total === 0
          ? 'Nenhuma tarefa principal'
          : `${item.completed} de ${item.total} concluídas`;

      return (
        <Pressable
          onPress={() => handleSelect(item.date)}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Abrir planner de ${formatFullDate(item.date)}. ${progressText}`}
        >
          <View style={styles.rowText}>
            <ThemedText type="defaultSemiBold" style={styles.rowTitle}>
              {isToday ? 'Hoje' : formatFullDate(item.date)}
            </ThemedText>
            <ThemedText type="default" style={[styles.rowSubtitle, { color: palette.textMuted }]}>
              {progressText}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
        </Pressable>
      );
    },
    [handleSelect, palette.border, palette.surface, palette.textMuted, today],
  );

  const keyExtractor = useCallback((item: PlannerDaySummary) => item.date.toString(), []);

  if (loading && summaries.length === 0) {
    return (
      <View style={styles.centered} accessibilityLabel="Carregando histórico">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (error && summaries.length === 0) {
    return (
      <EmptyState
        title="Falha ao carregar histórico"
        description={error.message}
        actionLabel="Tentar de novo"
        onPressAction={() => {
          void refresh();
        }}
      />
    );
  }

  if (summaries.length === 0) {
    return (
      <EmptyState
        title="Nenhum dia salvo"
        description="Seus planners aparecerão aqui conforme você usar a aba Hoje."
      />
    );
  }

  return (
    <FlatList
      data={summaries}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      accessibilityLabel="Histórico de planners"
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    padding: 24,
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
  rowText: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 16,
  },
  rowSubtitle: {
    fontSize: 14,
  },
});
