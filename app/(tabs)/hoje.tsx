import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { PlannerDayView } from '@/components/planner/planner-day-view';
import { PlannerHistoryList } from '@/components/planner/planner-history-list';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { startOfDay } from '@/utils/format';

export default function HojeScreen(): JSX.Element {
  const router = useRouter();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const today = useMemo(() => startOfDay(new Date()).getTime(), []);
  const [historyVisible, setHistoryVisible] = useState(false);

  const openHistory = useCallback(() => {
    setHistoryVisible(true);
  }, []);

  const closeHistory = useCallback(() => {
    setHistoryVisible(false);
  }, []);

  const handleSelectDate = useCallback(
    (date: number) => {
      setHistoryVisible(false);
      if (date === today) {
        return;
      }
      router.push(`/planner/${date}`);
    },
    [router, today],
  );

  const historyButton = (
    <Pressable
      onPress={openHistory}
      style={({ pressed }) => [
        styles.historyButton,
        { backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.85 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Ver histórico de planners"
      hitSlop={8}
    >
      <Ionicons name="calendar-outline" size={22} color={palette.text} />
    </Pressable>
  );

  return (
    <>
      <PlannerDayView date={today} titlePrefix="Hoje" headerAccessory={historyButton} />

      <Modal
        visible={historyVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeHistory}
      >
        <View style={[styles.modalContainer, { backgroundColor: palette.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="title" style={styles.modalTitle} accessibilityRole="header">
              Histórico
            </ThemedText>
            <Pressable
              onPress={closeHistory}
              style={styles.modalClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar histórico"
              hitSlop={8}
            >
              <Ionicons name="close" size={28} color={palette.text} />
            </Pressable>
          </View>
          <View style={styles.modalBody}>
            <PlannerHistoryList onSelectDate={handleSelectDate} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
  },
  modalClose: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
