import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/contexts/database-context';
import {
  listPlannerSummaries,
  type PlannerDaySummary,
} from '@/repositories/planner-repository';

export interface UsePlannerSummariesResult {
  summaries: PlannerDaySummary[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function usePlannerSummaries(): UsePlannerSummariesResult {
  const db = useDatabase();
  const [summaries, setSummaries] = useState<PlannerDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await listPlannerSummaries(db);
      setSummaries(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => undefined;
    }, [load]),
  );

  return {
    summaries,
    loading,
    error,
    refresh: load,
  };
}
