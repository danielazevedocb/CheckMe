import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { computeChecklistProgressPercent } from '@/types/checklist';

const FILL_ANIMATION_MS = 320;

interface ProgressBarBaseProps {
  label?: string;
  showPercent?: boolean;
}

interface ProgressBarPercentProps extends ProgressBarBaseProps {
  percent: number;
  completed?: never;
  total?: never;
}

interface ProgressBarCountProps extends ProgressBarBaseProps {
  completed: number;
  total: number;
  percent?: never;
}

export type ProgressBarProps = ProgressBarPercentProps | ProgressBarCountProps;

function resolvePercent(props: ProgressBarProps): number {
  if (props.percent != null) {
    return Math.min(100, Math.max(0, Math.round(props.percent)));
  }
  return computeChecklistProgressPercent(props.completed, props.total);
}

function ProgressBarComponent(props: ProgressBarProps): JSX.Element {
  const { label, showPercent = true } = props;
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const percent = resolvePercent(props);
  const fillProgress = useSharedValue(percent / 100);
  const countLabel =
    props.completed != null && props.total != null
      ? `${props.completed}/${props.total}`
      : null;

  const fillColor = percent === 100 ? palette.success : palette.primary;

  useEffect(() => {
    fillProgress.value = withTiming(percent / 100, { duration: FILL_ANIMATION_MS });
    return () => {
      cancelAnimation(fillProgress);
    };
  }, [fillProgress, percent]);

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fillProgress.value }],
  }));

  return (
    <View style={styles.wrapper} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
      {label || showPercent || countLabel ? (
        <View style={styles.labelRow}>
          {label ? (
            <ThemedText style={[styles.label, { color: palette.textMuted }]}>{label}</ThemedText>
          ) : (
            <View />
          )}
          <View style={styles.meta}>
            {countLabel ? (
              <ThemedText style={[styles.count, { color: palette.textMuted }]}>{countLabel}</ThemedText>
            ) : null}
            {showPercent ? (
              <ThemedText type="defaultSemiBold" style={styles.percent}>
                {percent}%
              </ThemedText>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={[styles.track, { backgroundColor: palette.surfaceMuted }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: fillColor },
            fillAnimatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

export const ProgressBar = memo(ProgressBarComponent);

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  count: {
    fontSize: 13,
  },
  percent: {
    fontSize: 14,
    minWidth: 36,
    textAlign: 'right',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    width: '100%',
    borderRadius: 3,
    transformOrigin: 'left',
  },
});
