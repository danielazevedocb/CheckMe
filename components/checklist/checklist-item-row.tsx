import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { ChecklistItem, ChecklistMode } from '@/types/checklist';
import { formatCurrency } from '@/utils/format';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  mode?: ChecklistMode;
}

export function ChecklistItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
  mode = 'list',
}: ChecklistItemRowProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const iconName = item.done ? 'checkmark-circle' : 'ellipse-outline';
  const iconColor = item.done ? palette.success : palette.textMuted;
  const showActions = mode === 'list';
  const showPrice = mode === 'list' && item.price != null;

  return (
    <View
      style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Item ${item.name}`}
      accessibilityHint="Toque para alternar o status"
    >
      <Pressable style={styles.mainRow} onPress={onToggle}>
        <Ionicons name={iconName} size={26} color={iconColor} />
        <View style={styles.textGroup}>
          <Text
            style={[
              styles.name,
              {
                color: item.done ? palette.textMuted : palette.text,
                textDecorationLine: item.done ? 'line-through' : 'none',
              },
            ]}
          >
            {item.name}
          </Text>
          {showPrice ? (
            <Text
              style={[
                styles.price,
                {
                  color: item.done ? palette.success : palette.text,
                  textDecorationLine: item.done ? 'line-through' : 'none',
                },
              ]}
            >
              {formatCurrency(item.price)}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {showActions ? (
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={styles.actionButton} accessibilityRole="button">
            <Text style={[styles.actionLabel, { color: palette.primary }]}>Editar</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.actionButton} accessibilityRole="button">
            <Text style={[styles.actionLabel, { color: palette.destructive }]}>Remover</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

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
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
