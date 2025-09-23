/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ColorToken } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorToken,
) {
  const { resolved } = useThemeMode();
  const colorFromProps = props[resolved];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[resolved][colorName];
}
