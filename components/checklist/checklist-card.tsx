import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { ChecklistSummary } from '@/types/checklist';
import { differenceInDays, formatCurrency, formatFullDate, formatProgress } from '@/utils/format';
import { blendWithSurface, getReadableTextColor } from '@/utils/color';

interface ChecklistCardProps {
  summary: ChecklistSummary;
  onPress: () => void;
}

export function ChecklistCard({ summary, onPress }: ChecklistCardProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const isCompleted = summary.totalItems > 0 && summary.totalItems === summary.completedItems;
  const schedule = getScheduleState(summary.scheduledFor ?? null);
  const accentColor = summary.color;
  const containerBackground = getContainerBackgroundColor(resolved, palette, accentColor, schedule?.tone);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: containerBackground,
          borderColor: accentColor,
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

      {schedule ? (
        <View style={[styles.scheduleRow, scheduleStyle(schedule.tone, palette, accentColor)]}
          accessibilityRole="text">
          <Ionicons name="calendar" size={16} color={scheduleTextColor(schedule.tone, palette, accentColor)} />
          <View style={styles.scheduleInfo}>
            <Text style={[styles.scheduleLabel, { color: scheduleTextColor(schedule.tone, palette, accentColor) }]}>
              {schedule.label}
            </Text>
            <Text style={[styles.scheduleDate, { color: scheduleTextColor(schedule.tone, palette, accentColor) }]}>
              {formatFullDate(summary.scheduledFor!)}
            </Text>
          </View>
        </View>
      ) : null}
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
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scheduleDate: {
    fontSize: 14,
  },
});

function getScheduleState(
  timestamp: number | null,
): { label: string; tone: 'today' | 'upcoming' | 'overdue' } | null {
  if (!timestamp) {
    return null;
  }

  const diff = differenceInDays(Date.now(), timestamp);

  if (diff === 0) {
    return { label: 'Agendado para hoje', tone: 'today' };
  }

  if (diff > 0) {
    const label = diff === 1 ? 'Agendado para amanhã' : `Agendado em ${diff} dias`;
    return { label, tone: 'upcoming' };
  }

  const overdue = Math.abs(diff);
  const label = overdue === 1 ? 'Atrasado há 1 dia' : `Atrasado há ${overdue} dias`;
  return { label, tone: 'overdue' };
}

function scheduleStyle(
  tone: 'today' | 'upcoming' | 'overdue',
  palette: (typeof Colors)['light'],
  color: string,
) {
  switch (tone) {
    case 'today':
    case 'overdue':
    case 'upcoming':
      return { backgroundColor: blendWithSurface(color, 0.2) };
    default:
      return { backgroundColor: palette.surfaceMuted };
  }
}

function scheduleTextColor(
  tone: 'today' | 'upcoming' | 'overdue',
  palette: (typeof Colors)['light'],
  color: string,
) {
  if (tone === 'upcoming' || tone === 'today' || tone === 'overdue') {
    return getReadableTextColor(color, '#0F172A', '#FFFFFF');
  }
  return palette.text;
}

function getContainerBackgroundColor(
  theme: 'light' | 'dark',
  palette: (typeof Colors)['light'],
  color: string,
  tone?: 'today' | 'upcoming' | 'overdue' | null,
) {
  if (!tone) {
    const alpha = theme === 'dark' ? 0.12 : 0.08;
    return blendWithSurface(color, alpha);
  }

  const alpha = tone === 'overdue' ? 0.25 : 0.18;
  return blendWithSurface(color, alpha);
}
