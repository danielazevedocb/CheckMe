import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { CHECKLIST_ICON_OPTIONS } from '@/constants/checklist-icons';
import { CHECKLIST_COLORS } from '@/constants/checklist-colors';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

export interface ChecklistFormValues {
  title: string;
  color: string;
  icon: string | null;
}

interface ChecklistFormProps {
  initialValues: ChecklistFormValues;
  submitLabel: string;
  onSubmit: (values: ChecklistFormValues) => void | Promise<void>;
  loading?: boolean;
}

export function ChecklistForm({
  initialValues,
  submitLabel,
  onSubmit,
  loading = false,
}: ChecklistFormProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const [title, setTitle] = useState(initialValues.title);
  const [color, setColor] = useState(initialValues.color);
  const [icon, setIcon] = useState<string | null>(initialValues.icon);
  const [titleError, setTitleError] = useState<string | undefined>();

  useEffect(() => {
    setTitle(initialValues.title);
    setColor(initialValues.color);
    setIcon(initialValues.icon);
    setTitleError(undefined);
  }, [initialValues.color, initialValues.icon, initialValues.title]);

  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Informe um título para a checklist.');
      return;
    }

    setTitleError(undefined);
    void onSubmit({ title: trimmedTitle, color, icon });
  }, [color, icon, onSubmit, title]);

  return (
    <View style={styles.form} accessibilityLabel="Formulário de checklist">
      <TextField
        label="Título"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          if (titleError && value.trim()) {
            setTitleError(undefined);
          }
        }}
        placeholder="Ex: Estudos, Trabalho, Compras"
        errorMessage={titleError}
        editable={!loading}
        autoFocus
      />

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Cor</ThemedText>
        <View style={styles.colorGrid} accessibilityRole="radiogroup" accessibilityLabel="Escolher cor">
          {CHECKLIST_COLORS.map((option) => {
            const selected = option.value === color;
            return (
              <Pressable
                key={option.id}
                onPress={() => setColor(option.value)}
                disabled={loading}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: loading }}
                accessibilityLabel={`Cor ${option.label}`}
                style={({ pressed }) => [
                  styles.colorSwatch,
                  {
                    backgroundColor: option.value,
                    borderWidth: selected ? 3 : 1,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Ícone (opcional)</ThemedText>
        <View style={styles.iconGrid} accessibilityRole="radiogroup" accessibilityLabel="Escolher ícone">
          <Pressable
            onPress={() => setIcon(null)}
            disabled={loading}
            accessibilityRole="radio"
            accessibilityState={{ selected: icon === null, disabled: loading }}
            accessibilityLabel="Sem ícone"
            style={[
              styles.iconOption,
              {
                backgroundColor: icon === null ? palette.primary : palette.surface,
                borderColor: icon === null ? palette.primary : palette.border,
              },
            ]}>
            <Text
              style={[
                styles.iconOptionLabel,
                { color: icon === null ? palette.primaryForeground : palette.textMuted },
              ]}>
              Nenhum
            </Text>
          </Pressable>
          {CHECKLIST_ICON_OPTIONS.map((option) => {
            const selected = icon === option.emoji;
            return (
              <Pressable
                key={option.id}
                onPress={() => setIcon(option.emoji)}
                disabled={loading}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: loading }}
                accessibilityLabel={option.label}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor: selected ? palette.primary : palette.surface,
                    borderColor: selected ? palette.primary : palette.border,
                  },
                ]}>
                <Text style={styles.iconEmoji}>{option.emoji}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button label={submitLabel} onPress={handleSubmit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: 'rgba(15,23,42,0.2)',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    minWidth: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  iconEmoji: {
    fontSize: 22,
  },
  iconOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
