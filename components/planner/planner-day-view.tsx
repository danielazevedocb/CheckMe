import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PlannerNote } from '@/components/planner/planner-note';
import { PlannerSectionBlock } from '@/components/planner/planner-section';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { useDailyPlanner } from '@/hooks/use-daily-planner';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { PlannerItem, PlannerSection } from '@/types/planner';
import { PLANNER_SECTIONS } from '@/types/planner';
import { formatFullDate } from '@/utils/format';

function getItemsBySection(items: PlannerItem[], section: PlannerSection): PlannerItem[] {
  return items
    .filter((item) => item.section === section)
    .sort((a, b) => a.position - b.position);
}

function getDayProgress(items: PlannerItem[]): {
  completed: number;
  total: number;
  ratio: number;
} {
  const relevant = items.filter(
    (item) => item.section === 'main' || item.section === 'priorities',
  );
  const total = relevant.length;
  const completed = relevant.filter((item) => item.done).length;
  return {
    completed,
    total,
    ratio: total === 0 ? 0 : completed / total,
  };
}

function DayProgressBar({
  completed,
  total,
  ratio,
}: {
  completed: number;
  total: number;
  ratio: number;
}): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(ratio);
  const progressLabel = `${completed} de ${total} tarefas concluídas`;

  useEffect(() => {
    progress.value = reduceMotion ? ratio : withTiming(ratio, { duration: 300 });
  }, [progress, ratio, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progress.value * 100))}%`,
  }));

  return (
    <View
      style={styles.progressBlock}
      accessibilityRole="progressbar"
      accessibilityLabel={progressLabel}
      accessibilityValue={{
        min: 0,
        max: Math.max(total, 1),
        now: completed,
        text: progressLabel,
      }}
    >
      <ThemedText type="default" style={[styles.progressText, { color: palette.textMuted }]}>
        {progressLabel}
      </ThemedText>
      <View style={[styles.progressTrack, { backgroundColor: palette.border }]}>
        <Animated.View
          style={[styles.progressFill, { backgroundColor: palette.primary }, fillStyle]}
        />
      </View>
    </View>
  );
}

function PlannerSectionSkeleton(): JSX.Element {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.sectionSkeleton}>
      <Skeleton height={18} width="45%" animated={!reduceMotion} />
      <Skeleton height={44} animated={!reduceMotion} />
      <Skeleton height={44} animated={!reduceMotion} />
      <Skeleton height={48} animated={!reduceMotion} />
    </View>
  );
}

export interface PlannerDayViewProps {
  date: number;
  titlePrefix?: string;
  headerAccessory?: ReactNode;
}

export function PlannerDayView({
  date,
  titlePrefix,
  headerAccessory,
}: PlannerDayViewProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const insets = useSafeAreaInsets();
  const {
    planner,
    loading,
    error,
    refresh,
    addItem,
    toggleItem,
    removeItem,
    updateNote,
  } = useDailyPlanner(date);

  const items = planner?.items ?? [];
  const dayProgress = useMemo(() => getDayProgress(items), [items]);
  const noteValue = planner?.note ?? '';
  const headerDate = formatFullDate(date);
  const pageTitle = titlePrefix ? `${titlePrefix} • ${headerDate}` : headerDate;

  const handleAdd = useCallback(
    (section: PlannerSection) => (name: string) => addItem(section, name),
    [addItem],
  );

  const handleToggle = useCallback(
    (itemId: number, done: boolean) => {
      void toggleItem(itemId, done);
    },
    [toggleItem],
  );

  const handleDelete = useCallback(
    (itemId: number) => {
      void removeItem(itemId);
    },
    [removeItem],
  );

  if (loading && !planner) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: palette.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 16 + insets.top }]}
        accessibilityLabel="Carregando planner do dia"
      >
        <View style={styles.pageHeader}>
          <ThemedText type="title" style={styles.pageTitle} accessibilityRole="header">
            {pageTitle}
          </ThemedText>
          <Skeleton height={8} borderRadius={4} />
          <Skeleton height={14} width="60%" style={{ marginTop: 8 }} />
        </View>
        <PlannerSectionSkeleton />
        <PlannerSectionSkeleton />
        <PlannerSectionSkeleton />
      </ScrollView>
    );
  }

  if (error && !planner) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: palette.background }]}>
        <EmptyState
          title="Falha ao carregar"
          description={error.message || 'Não foi possível carregar o planner deste dia.'}
          actionLabel="Tentar de novo"
          onPressAction={() => {
            void refresh();
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingTop: 16 + insets.top }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={palette.text} />
      }
      accessibilityLabel="Planner do dia"
    >
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <ThemedText
            type="title"
            style={styles.pageTitle}
            accessibilityRole="header"
            accessibilityLabel={pageTitle}
          >
            {pageTitle}
          </ThemedText>
          {headerAccessory}
        </View>
        <DayProgressBar
          completed={dayProgress.completed}
          total={dayProgress.total}
          ratio={dayProgress.ratio}
        />
      </View>

      {error ? (
        <ThemedText type="default" style={[styles.inlineError, { color: palette.destructive }]}>
          {error.message}
        </ThemedText>
      ) : null}

      {PLANNER_SECTIONS.map((section) => (
        <PlannerSectionBlock
          key={section}
          section={section}
          items={getItemsBySection(items, section)}
          onAdd={handleAdd(section)}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}

      <PlannerNote value={noteValue} onChangeText={updateNote} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    padding: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pageHeader: {
    marginBottom: 20,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  pageTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
  },
  progressBlock: {
    gap: 8,
  },
  progressText: {
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionSkeleton: {
    gap: 10,
    marginBottom: 20,
    padding: 16,
  },
  inlineError: {
    marginBottom: 12,
    fontSize: 14,
  },
});
