import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { TaskPriority } from '@/types/checklist';

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'LOW', label: 'Baixa' },
];

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

export function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel="Prioridade">
      {PRIORITY_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`Prioridade ${option.label}`}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? palette.primary : palette.surface,
                borderColor: selected ? palette.primary : palette.border,
                opacity: disabled ? 0.6 : 1,
              },
            ]}>
            <Text
              style={[
                styles.label,
                { color: selected ? palette.primaryForeground : palette.text },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
