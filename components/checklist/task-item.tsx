import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PriorityBadge } from '@/components/checklist/priority-badge';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import type { ChecklistItem, ChecklistMode, Task } from '@/types/checklist';
import { blendWithSurface, getReadableTextColor } from '@/utils/color';

export interface TaskItemProps {
  item: ChecklistItem | Task;
  onToggle: (itemId: number) => void;
  onEdit: (itemId: number) => void;
  onDelete: (itemId: number) => void;
  onSwipeDelete?: (itemId: number) => void;
  accentColor?: string;
  mode?: ChecklistMode;
  swipeEnabled?: boolean;
  onSwipeableWillOpen?: (itemId: number) => void;
  onSwipeableRef?: (itemId: number, ref: SwipeableMethods | null) => void;
  shoppingMode?: boolean;
}

function getTaskTitle(item: ChecklistItem | Task): string {
  return item.title ?? ('name' in item ? item.name : '');
}

function isTaskCompleted(item: ChecklistItem | Task): boolean {
  return item.completed ?? ('done' in item ? Boolean(item.done) : false);
}

const STRIKE_ANIMATION_MS = 280;

interface AnimatedTaskTitleProps {
  title: string;
  completed: boolean;
  activeColor: string;
  completedColor: string;
}

function AnimatedTaskTitle({
  title,
  completed,
  activeColor,
  completedColor,
}: AnimatedTaskTitleProps): JSX.Element {
  const strikeProgress = useSharedValue(completed ? 1 : 0);

  useEffect(() => {
    strikeProgress.value = withTiming(completed ? 1 : 0, { duration: STRIKE_ANIMATION_MS });
    return () => {
      cancelAnimation(strikeProgress);
    };
  }, [completed, strikeProgress]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(strikeProgress.value, [0, 1], [activeColor, completedColor]),
  }));

  const lineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: strikeProgress.value }],
    opacity: strikeProgress.value,
  }));

  return (
    <View style={styles.titleContainer}>
      <Animated.Text style={[styles.title, titleAnimatedStyle]} numberOfLines={2}>
        {title}
      </Animated.Text>
      <Animated.View
        pointerEvents="none"
        style={[styles.strikeLine, { backgroundColor: completedColor }, lineAnimatedStyle]}
      />
    </View>
  );
}

function TaskItemComponent({
  item,
  onToggle,
  onEdit,
  onDelete,
  onSwipeDelete,
  accentColor,
  mode = 'list',
  swipeEnabled = true,
  onSwipeableWillOpen,
  onSwipeableRef,
  shoppingMode = false,
}: TaskItemProps): JSX.Element {
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const completed = isTaskCompleted(item);
  const title = getTaskTitle(item);
  const description = item.description?.trim();
  const iconName = completed ? 'checkmark-circle' : 'ellipse-outline';
  const accent = accentColor ?? palette.primary;
  const backgroundTint = blendWithSurface(accent, resolved === 'dark' ? 0.28 : 0.12);
  const iconColor = completed ? palette.success : accent;
  const primaryTextColor =
    resolved === 'dark' ? getReadableTextColor(accent, palette.text, '#FFFFFF') : palette.text;
  const showActions = mode === 'list';
  const quantity = 'quantity' in item ? (item as ChecklistItem).quantity ?? 1 : 1;
  const price = 'price' in item ? (item as ChecklistItem).price ?? null : null;

  const handleTogglePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(item.id);
  }, [item.id, onToggle]);

  const handleSwipeDeletePress = useCallback(() => {
    swipeableRef.current?.close();
    if (onSwipeDelete) {
      onSwipeDelete(item.id);
    } else {
      onDelete(item.id);
    }
  }, [item.id, onDelete, onSwipeDelete]);

  useEffect(() => {
    return () => {
      onSwipeableRef?.(item.id, null);
    };
  }, [item.id, onSwipeableRef]);

  const handleSwipeableWillOpen = useCallback(() => {
    if (swipeableRef.current) {
      onSwipeableRef?.(item.id, swipeableRef.current);
    }
    onSwipeableWillOpen?.(item.id);
  }, [item.id, onSwipeableRef, onSwipeableWillOpen]);

  const renderRightActions = useCallback(() => {
    return (
      <Pressable
        onPress={handleSwipeDeletePress}
        style={[styles.deleteAction, { backgroundColor: palette.destructive }]}
        accessibilityRole="button"
        accessibilityLabel="Excluir tarefa"
      >
        <Text style={[styles.deleteActionLabel, { color: palette.primaryForeground }]}>Excluir</Text>
      </Pressable>
    );
  }, [handleSwipeDeletePress, palette.destructive, palette.primaryForeground]);

  const rowContent = (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundTint, borderColor: accent },
      ]}
      accessibilityLabel={`Tarefa ${title}`}
    >
      <Pressable style={styles.mainRow} onPress={handleTogglePress}>
        <Ionicons name={iconName} size={26} color={iconColor} />
        <View style={styles.textGroup}>
          <View style={styles.titleRow}>
            <AnimatedTaskTitle
              title={title}
              completed={completed}
              activeColor={primaryTextColor}
              completedColor={palette.textMuted}
            />
            <PriorityBadge priority={item.priority} size="sm" />
          </View>
          {description && !shoppingMode ? (
            <Text
              style={[styles.description, { color: palette.textMuted }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}
          {shoppingMode ? (
            <View style={styles.shoppingRow}>
              <Text style={[styles.shoppingQty, { color: palette.textMuted }]}>
                {quantity}x
              </Text>
              {price != null ? (
                <Text style={[styles.shoppingPrice, { color: palette.textMuted }]}>
                  {'R$ '}{price.toFixed(2)}
                  {quantity > 1 ? ` = R$ ${(quantity * price).toFixed(2)}` : ''}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
      {showActions ? (
        <View style={styles.actions}>
          <Pressable onPress={() => onEdit(item.id)} style={styles.actionButton} accessibilityRole="button">
            <Text style={[styles.actionLabel, { color: accent }]}>Editar</Text>
          </Pressable>
          <Pressable onPress={() => onDelete(item.id)} style={styles.actionButton} accessibilityRole="button">
            <Text style={[styles.actionLabel, { color: palette.destructive }]}>Remover</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  if (!swipeEnabled || mode !== 'list') {
    return rowContent;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      enabled={swipeEnabled}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      onSwipeableWillOpen={handleSwipeableWillOpen}
      renderRightActions={renderRightActions}
      containerStyle={styles.swipeContainer}
    >
      {rowContent}
    </Swipeable>
  );
}

export const TaskItem = memo(TaskItemComponent);

const styles = StyleSheet.create({
  swipeContainer: {},
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textGroup: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  strikeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    marginTop: -0.75,
    transformOrigin: 'left',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  shoppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shoppingQty: {
    fontSize: 13,
    fontWeight: '600',
  },
  shoppingPrice: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    borderRadius: 16,
    marginLeft: 8,
  },
  deleteActionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
