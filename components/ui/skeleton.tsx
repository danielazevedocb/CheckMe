import { useEffect } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/use-theme-color';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** When false, pulse animation is disabled (e.g. prefers-reduced-motion). */
  animated?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  animated = true,
}: SkeletonProps): JSX.Element {
  const backgroundColor = useThemeColor({}, 'surfaceMuted');
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!animated) {
      cancelAnimation(opacity);
      opacity.value = 1;
      return;
    }

    opacity.value = withRepeat(withTiming(0.45, { duration: 900 }), -1, true);

    return () => {
      cancelAnimation(opacity);
    };
  }, [animated, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, backgroundColor },
        animated ? animatedStyle : null,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
