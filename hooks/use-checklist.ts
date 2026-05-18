import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/contexts/database-context';
import { getChecklistWithItems, type GetChecklistWithItemsOptions } from '@/repositories/checklist-repository';
import type { ChecklistWithItems } from '@/types/checklist';

export type UseChecklistOptions = GetChecklistWithItemsOptions;

export function useChecklist(
  checklistId: number,
  options?: UseChecklistOptions,
): {
  data: ChecklistWithItems | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const db = useDatabase();
  const priorityFilter = options?.priority;
  const [data, setData] = useState<ChecklistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getChecklistWithItems(db, checklistId, {
        priority: priorityFilter,
      });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [db, checklistId, priorityFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => undefined;
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refresh: load,
  };
}
