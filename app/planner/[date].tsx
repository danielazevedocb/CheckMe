import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PlannerDayView } from '@/components/planner/planner-day-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/contexts/theme-context';
import { formatFullDate, startOfDay } from '@/utils/format';

function parsePlannerDateParam(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return startOfDay(new Date(parsed)).getTime();
}

export default function PlannerDateScreen(): JSX.Element {
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { resolved } = useThemeMode();
  const palette = Colors[resolved];
  const parsedDate = useMemo(() => parsePlannerDateParam(dateParam), [dateParam]);

  useEffect(() => {
    if (parsedDate == null) {
      navigation.setOptions({ title: 'Planner' });
      return;
    }

    navigation.setOptions({ title: formatFullDate(parsedDate) });
  }, [navigation, parsedDate]);

  if (parsedDate == null) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <EmptyState
          title="Data inválida"
          description="Não foi possível abrir o planner para esta data."
          actionLabel="Voltar"
          onPressAction={() => router.back()}
        />
      </View>
    );
  }

  return <PlannerDayView date={parsedDate} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
});
