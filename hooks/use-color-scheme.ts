import { useThemeMode } from '@/contexts/theme-context';

export function useColorScheme(): 'light' | 'dark' {
  const { resolved } = useThemeMode();
  return resolved;
}
