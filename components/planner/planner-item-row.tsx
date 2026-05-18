import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { PlannerItem } from '@/types/planner';

interface PlannerItemRowProps {
  item: PlannerItem;
  onToggle: (itemId: number, done: boolean) => void;
  onDelete: (itemId: number) => void;
  onEdit?: (itemId: number) => void;
}

function PlannerItemRowComponent({
  item,
  onToggle,
  onDelete,
  onEdit,
}: PlannerItemRowProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const iconName = item.done ? 'checkmark-circle' : 'ellipse-outline';
  const iconColor = item.done ? palette.success : palette.primary;

  const handleTogglePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(item.id, !item.done);
  }, [item.done, item.id, onToggle]);

  const handleDeletePress = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handleEditPress = useCallback(() => {
    onEdit?.(item.id);
  }, [item.id, onEdit]);

  return (
    <View
      style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }]}
      accessible
      accessibilityRole="none"
    >
      <Pressable
        style={styles.mainRow}
        onPress={handleTogglePress}
        accessibilityRole="button"
        accessibilityState={{ checked: item.done }}
        accessibilityLabel={
          item.done ? `Desmarcar ${item.name}` : `Marcar ${item.name} como concluído`
        }
        hitSlop={4}
      >
        <View style={styles.checkboxHitArea}>
          <Ionicons name={iconName} size={26} color={iconColor} />
        </View>
        <Text
          style={[
            styles.name,
            {
              color: item.done ? palette.textMuted : palette.text,
              textDecorationLine: item.done ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={3}
        >
          {item.name}
        </Text>
      </Pressable>
      <View style={styles.actions}>
        {onEdit ? (
          <Pressable
            onPress={handleEditPress}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${item.name}`}
            hitSlop={8}
          >
            <Text style={[styles.actionLabel, { color: palette.primary }]}>Editar</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleDeletePress}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${item.name}`}
          hitSlop={8}
        >
          <Text style={[styles.actionLabel, { color: palette.destructive }]}>Remover</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const PlannerItemRow = memo(PlannerItemRowComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  checkboxHitArea: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
