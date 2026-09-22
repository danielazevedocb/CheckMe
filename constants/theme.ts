/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F9F9FF',
    surface: '#F9F9FF',
    surfaceMuted: '#E1E2EC',
    surfaceContainer: '#EDEDF7',
    surfaceContainerHigh: '#E7E7F1',
    text: '#1A1B20',
    textMuted: '#45464F',
    primary: '#3659A8',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#D9E2FF',
    onPrimaryContainer: '#001A43',
    destructive: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    success: '#386A20',
    border: '#C5C6D0',
    outline: '#757780',
    overlay: 'rgba(15, 23, 42, 0.4)',
    tabIconDefault: '#45464F',
    tabIconSelected: '#3659A8',
    priorityHigh: '#BA1A1A',
    priorityMedium: '#765A00',
    priorityLow: '#465D91',
  },
  dark: {
    background: '#111318',
    surface: '#111318',
    surfaceMuted: '#44464F',
    surfaceContainer: '#1D2025',
    surfaceContainerHigh: '#282A30',
    text: '#E2E2E9',
    textMuted: '#C5C6D0',
    primary: '#AFC6FF',
    primaryForeground: '#002D6C',
    primaryContainer: '#1B438F',
    onPrimaryContainer: '#D9E2FF',
    destructive: '#FFB4AB',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    success: '#9DD67D',
    border: '#44464F',
    outline: '#8F9099',
    overlay: 'rgba(2, 6, 23, 0.6)',
    tabIconDefault: '#C5C6D0',
    tabIconSelected: '#AFC6FF',
    priorityHigh: '#FFB4AB',
    priorityMedium: '#E9C349',
    priorityLow: '#AFC6FF',
  },
};

export const Layout = {
  compactBreakpoint: 360,
  mediumBreakpoint: 600,
  expandedBreakpoint: 840,
  maxContentWidth: 840,
  maxFormWidth: 640,
  compactGutter: 16,
  mediumGutter: 24,
} as const;

export const Shapes = {
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 999,
} as const;

export type ColorTheme = typeof Colors;
export type ColorMode = keyof ColorTheme;
export type ColorToken = keyof ColorTheme['light'];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
