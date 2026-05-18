import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

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
  onEdit: (itemId: number) => void;
  onReorder: (orderedIds: number[]) => Promise<void>;
  dragEnabled?: boolean;
}

export function PlannerSectionBlock({
  section,
  items,
  onAdd,
  onToggle,
  onDelete,
  onEdit,
  onReorder,
  dragEnabled = true,
}: PlannerSectionProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [itemsOrder, setItemsOrder] = useState(items);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setItemsOrder(items);
  }, [items]);

  const limit = SECTION_LIMITS[section];
  const isAtLimit = limit != null && items.length >= limit;
  const doneCount = items.filter((item) => item.done).length;
  const progressLabel = formatProgress(doneCount, items.length);
  const canDrag = dragEnabled && itemsOrder.length > 1;

  const limitLabel = useMemo(() => {
    if (limit == null) {
      return null;
    }
    return `${items.length}/${limit}`;
  }, [items.length, limit]);

  const handleAdd = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || adding) {
      return;
    }

    if (isAtLimit) {
      if (limit != null) {
        setLimitMessage(`Limite de ${limit} itens atingido`);
      }
      return;
    }

    setLimitMessage(null);
    setAdding(true);

    try {
      const success = await onAdd(trimmed);
      if (success) {
        setDraft('');
        setLimitMessage(null);
      } else if (limit != null) {
        setLimitMessage(`Limite de ${limit} itens atingido`);
      }
    } finally {
      setAdding(false);
    }
  }, [adding, draft, isAtLimit, limit, onAdd]);

  const handleDragBegin = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    async ({ data }: { data: PlannerItem[] }) => {
      setIsDragging(false);
      const previousOrder = itemsOrder;
      setItemsOrder(data);

      try {
        await onReorder(data.map((entry) => entry.id));
      } catch {
        setItemsOrder(previousOrder);
      }
    },
    [itemsOrder, onReorder],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<PlannerItem>) => (
      <ScaleDecorator activeScale={1.02}>
        <PlannerItemRow
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          dragEnabled={canDrag}
          onDrag={drag}
          isDragging={isActive}
        />
      </ScaleDecorator>
    ),
    [canDrag, onDelete, onEdit, onToggle],
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

      {itemsOrder.length > 0 ? (
        <DraggableFlatList
          data={itemsOrder}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onDragBegin={handleDragBegin}
          onDragEnd={handleDragEnd}
          scrollEnabled={false}
          nestedScrollEnabled
          style={styles.list}
          activationDistance={8}
          extraData={`${section}-${isDragging}`}
        />
      ) : null}

      {isAtLimit || limitMessage ? (
        <ThemedText
          type="default"
          style={[styles.limitMessage, { color: palette.textMuted }]}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {limitMessage ?? (limit != null ? `Limite de ${limit} itens atingido` : '')}
        </ThemedText>
      ) : null}

      <View style={styles.addRow}>
        <TextField
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            if (limitMessage) {
              setLimitMessage(null);
            }
          }}
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
  limitMessage: {
    fontSize: 13,
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
