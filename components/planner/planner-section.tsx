import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { PlannerItemRow } from '@/components/planner/planner-item-row';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { PlannerItem, PlannerSection } from '@/types/planner';
import { SECTION_LABELS, SECTION_LIMITS } from '@/types/planner';
import { formatProgress } from '@/utils/format';

interface PlannerSectionProps {
  section: PlannerSection;
  items: PlannerItem[];
  onAdd: (name: string) => Promise<boolean>;
  onToggle: (itemId: number, done: boolean) => void;
  onDelete: (itemId: number) => void;
}

export function PlannerSectionBlock({
  section,
  items,
  onAdd,
  onToggle,
  onDelete,
}: PlannerSectionProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  const limit = SECTION_LIMITS[section];
  const isAtLimit = limit != null && items.length >= limit;
  const doneCount = items.filter((item) => item.done).length;
  const progressLabel = formatProgress(doneCount, items.length);

  const limitLabel = useMemo(() => {
    if (limit == null) {
      return null;
    }
    return `${items.length}/${limit}`;
  }, [items.length, limit]);

  const handleAdd = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || isAtLimit || adding) {
      return;
    }

    setAdding(true);
    try {
      const success = await onAdd(trimmed);
      if (success) {
        setDraft('');
      }
    } finally {
      setAdding(false);
    }
  }, [adding, draft, isAtLimit, onAdd]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PlannerItem>) => (
      <PlannerItemRow item={item} onToggle={onToggle} onDelete={onDelete} />
    ),
    [onDelete, onToggle],
  );

  const keyExtractor = useCallback((item: PlannerItem) => item.id.toString(), []);

  return (
    <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.header}>
        <ThemedText
          type="defaultSemiBold"
          style={styles.title}
          accessibilityRole="header"
        >
          {SECTION_LABELS[section]}
          {limit != null ? ` (máx. ${limit})` : ''}
        </ThemedText>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: palette.surfaceMuted }]}>
            <ThemedText type="default" style={[styles.badgeText, { color: palette.textMuted }]}>
              {progressLabel}
            </ThemedText>
          </View>
          {limitLabel ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isAtLimit ? palette.border : palette.surfaceMuted,
                },
              ]}
            >
              <ThemedText
                type="default"
                style={[
                  styles.badgeText,
                  { color: isAtLimit ? palette.textMuted : palette.text },
                ]}
              >
                {limitLabel}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          scrollEnabled={false}
          nestedScrollEnabled
          style={styles.list}
        />
      ) : null}

      <View style={styles.addRow}>
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder={isAtLimit ? 'Limite da seção atingido' : 'Adicionar item'}
          editable={!isAtLimit && !adding}
          onSubmitEditing={() => {
            void handleAdd();
          }}
          returnKeyType="done"
          style={styles.addInput}
          accessibilityLabel={`Adicionar item em ${SECTION_LABELS[section]}`}
        />
        <Pressable
          onPress={() => {
            void handleAdd();
          }}
          disabled={isAtLimit || adding || !draft.trim()}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: palette.primary,
              opacity: isAtLimit || !draft.trim() ? 0.4 : pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Adicionar item"
          accessibilityState={{ disabled: isAtLimit || !draft.trim() }}
        >
          <Ionicons name="add" size={24} color={palette.primaryForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
