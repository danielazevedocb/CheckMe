import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

interface SearchBarProps {
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
}

export function SearchBar({ value, placeholder = 'Buscar', onChangeText }: SearchBarProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];

  return (
    <View style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }]}
      accessible
      accessibilityRole="search">
      <Ionicons name="search" size={20} color={palette.textMuted} />
      <TextInput
        style={[styles.input, { color: palette.text }]}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
});
