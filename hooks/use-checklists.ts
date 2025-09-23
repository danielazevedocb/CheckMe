import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/contexts/database-context';
import { listChecklists } from '@/repositories/checklist-repository';
import type { ChecklistStatus, ChecklistSummary } from '@/types/checklist';

export function useChecklists(status: ChecklistStatus, searchTerm: string): {
  data: ChecklistSummary[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const db = useDatabase();
  const [data, setData] = useState<ChecklistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await listChecklists(db, status, searchTerm);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [db, status, searchTerm]);

  useFocusEffect(
    useCallback(() => {
      load();
      // refresh on focus, no cleanup needed
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
