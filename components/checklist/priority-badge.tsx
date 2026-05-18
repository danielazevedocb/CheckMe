import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { TaskPriority } from '@/types/checklist';

export type PriorityBadgeSize = 'sm' | 'md';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: PriorityBadgeSize;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

const PRIORITY_TOKEN: Record<TaskPriority, 'priorityHigh' | 'priorityMedium' | 'priorityLow'> = {
  HIGH: 'priorityHigh',
  MEDIUM: 'priorityMedium',
  LOW: 'priorityLow',
};

function PriorityBadgeComponent({ priority, size = 'md' }: PriorityBadgeProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const accent = palette[PRIORITY_TOKEN[priority]];
  const label = PRIORITY_LABELS[priority];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.pill,
        isSmall ? styles.pillSm : styles.pillMd,
        { backgroundColor: palette.surfaceMuted, borderColor: accent },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Prioridade ${label}`}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text
        style={[
          styles.label,
          isSmall ? styles.labelSm : styles.labelMd,
          { color: accent },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export const PriorityBadge = memo(PriorityBadgeComponent);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  pillSm: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  pillMd: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelSm: {
    fontSize: 10,
  },
  labelMd: {
    fontSize: 11,
  },
});
