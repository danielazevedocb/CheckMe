import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useThemeColor } from '@/hooks/use-theme-color';

function ChecklistCardSkeletonComponent(): JSX.Element {
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'surface');
  const reduceMotion = useReducedMotion();
  const animated = !reduceMotion;

  return (
    <View style={[styles.container, { borderColor, backgroundColor }]}>
      <View style={styles.header}>
        <Skeleton animated={animated} height={20} borderRadius={6} style={styles.title} />
        <Skeleton animated={animated} width={20} height={20} borderRadius={10} />
      </View>

      <View style={styles.row}>
        <Skeleton animated={animated} height={52} borderRadius={12} style={styles.pill} />
        <Skeleton animated={animated} height={52} borderRadius={12} style={styles.pill} />
        <Skeleton animated={animated} height={52} borderRadius={12} style={styles.pill} />
      </View>
    </View>
  );
}

export const ChecklistCardSkeleton = memo(ChecklistCardSkeletonComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flex: 1,
  },
});
