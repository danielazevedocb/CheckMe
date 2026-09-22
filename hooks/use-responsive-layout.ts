import { useWindowDimensions } from 'react-native';

import { Layout } from '@/constants/theme';

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const isNarrow = width < Layout.compactBreakpoint || fontScale > 1.3;
  const isMedium = width >= Layout.mediumBreakpoint;

  return {
    width,
    height,
    fontScale,
    isNarrow,
    isMedium,
    gutter: isMedium ? Layout.mediumGutter : Layout.compactGutter,
    contentWidth: Math.min(width, Layout.maxContentWidth),
  };
}
