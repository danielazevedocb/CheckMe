import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/contexts/database-context';
import { getChecklistWithItems } from '@/repositories/checklist-repository';
import type { ChecklistWithItems } from '@/types/checklist';

interface UseChecklistResult {
  checklist: ChecklistWithItems | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useChecklist(checklistId: number): UseChecklistResult {
  const db = useDatabase();
  const [checklist, setChecklist] = useState<ChecklistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getChecklistWithItems(db, checklistId);
      setChecklist(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [db, checklistId]);

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
    checklist,
    loading,
    error,
    refresh: load,
  };
}
