import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { ChecklistSummary } from '@/types/checklist';
import { formatCurrency, formatProgress } from '@/utils/format';

interface ChecklistCardProps {
  summary: ChecklistSummary;
  onPress: () => void;
}

export function ChecklistCard({ summary, onPress }: ChecklistCardProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const isCompleted = summary.totalItems > 0 && summary.totalItems === summary.completedItems;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityHint="Abrir checklist"
      accessibilityLabel={`Checklist ${summary.title}`}
    >
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {summary.title}
        </ThemedText>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={isCompleted ? palette.success : palette.textMuted}
        />
      </View>

      <View style={styles.row}>
        <InfoPill label="Progresso" value={formatProgress(summary.completedItems, summary.totalItems)} />
        <InfoPill label="Total" value={formatCurrency(summary.totalAmount)} />
        <InfoPill
          label="✓ Somado"
          value={formatCurrency(summary.completedAmount)}
          accentColor={palette.success}
        />
      </View>
    </Pressable>
  );
}

interface InfoPillProps {
  label: string;
  value: string;
  accentColor?: string;
}

function InfoPill({ label, value, accentColor }: InfoPillProps) {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  return (
    <View style={[styles.pill, { backgroundColor: palette.surfaceMuted }]}
      accessibilityRole="text"
      accessible>
      <ThemedText style={[styles.pillLabel, { color: palette.textMuted }]}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold" style={[styles.pillValue, accentColor ? { color: accentColor } : null]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  pillLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillValue: {
    fontSize: 14,
  },
});
