/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceMuted: '#F3F4F6',
    text: '#1F2937',
    textMuted: '#6B7280',
    primary: '#2563EB',
    primaryForeground: '#FFFFFF',
    destructive: '#DC2626',
    success: '#16A34A',
    border: '#E5E7EB',
    overlay: 'rgba(15, 23, 42, 0.4)',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#2563EB',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceMuted: '#111827',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    primary: '#60A5FA',
    primaryForeground: '#0B1120',
    destructive: '#F87171',
    success: '#34D399',
    border: '#334155',
    overlay: 'rgba(2, 6, 23, 0.6)',
    tabIconDefault: '#64748B',
    tabIconSelected: '#60A5FA',
  },
};

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
