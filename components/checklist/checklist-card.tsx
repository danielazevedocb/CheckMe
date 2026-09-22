import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/checklist/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { Colors, Shapes } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { ChecklistSummary } from '@/types/checklist';
import { blendWithSurface } from '@/utils/color';

interface ChecklistCardProps {
  summary: ChecklistSummary;
  onPress: (checklistId: number) => void;
  onToggleComplete?: (checklistId: number, currentlyCompleted: boolean) => void;
}

function ChecklistCardComponent({ summary, onPress, onToggleComplete }: ChecklistCardProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const isCompleted =
    summary.totalItems > 0 && summary.totalItems === summary.completedItems;
  const accentColor = summary.color;
  const containerBackground = blendWithSurface(accentColor, resolved === 'dark' ? 0.12 : 0.08);

  return (
    <Pressable
      onPress={() => onPress(summary.id)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: containerBackground,
          borderColor: accentColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityHint="Abrir checklist"
      accessibilityLabel={`Checklist ${summary.title}, ${summary.progressPercent} por cento concluído`}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          {summary.icon ? (
            <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
              {summary.icon}
            </Text>
          ) : null}
          <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
            {summary.title}
          </ThemedText>
        </View>
        {onToggleComplete && summary.totalItems > 0 ? (
          <Pressable
            onPress={() => onToggleComplete(summary.id, isCompleted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCompleted }}
            accessibilityLabel={isCompleted ? 'Marcar como incompleto' : 'Marcar como concluído'}
            hitSlop={8}
            style={styles.completeButton}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={isCompleted ? palette.success : palette.textMuted}
            />
          </Pressable>
        ) : (
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={isCompleted ? palette.success : palette.textMuted}
          />
        )}
      </View>

      <ProgressBar
        completed={summary.completedItems}
        total={summary.totalItems}
        showPercent
      />
    </Pressable>
  );
}

export const ChecklistCard = memo(ChecklistCardComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: Shapes.medium,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  title: {
    fontSize: 18,
    flex: 1,
  },
  completeButton: {
    width: 48,
    height: 48,
    marginHorizontal: -12,
    marginVertical: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
