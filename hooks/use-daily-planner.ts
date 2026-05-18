import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/contexts/database-context';
import {
  createPlannerItem,
  deletePlannerItem,
  getOrCreatePlannerForDate,
  getPlannerWithItems,
  PlannerSectionFullError,
  reorderPlannerItems,
  setPlannerItemDone,
  updatePlannerItem,
  updatePlannerNote,
} from '@/repositories/planner-repository';
import type { DailyPlannerWithItems, PlannerSection } from '@/types/planner';
import { startOfDay } from '@/utils/format';

const NOTE_DEBOUNCE_MS = 800;

export interface UseDailyPlannerResult {
  planner: DailyPlannerWithItems | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  addItem: (section: PlannerSection, name: string) => Promise<boolean>;
  toggleItem: (itemId: number, done: boolean) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  editItem: (itemId: number, name: string) => Promise<void>;
  reorderSection: (section: PlannerSection, orderedIds: number[]) => Promise<void>;
  updateNote: (note: string) => void;
}

export function useDailyPlanner(date?: number): UseDailyPlannerResult {
  const db = useDatabase();
  const dayStart = useMemo(
    () => startOfDay(new Date(date ?? Date.now())).getTime(),
    [date],
  );

  const [planner, setPlanner] = useState<DailyPlannerWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNoteRef = useRef<string | null>(null);
  const plannerRef = useRef(planner);

  useEffect(() => {
    plannerRef.current = planner;
  }, [planner]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const dailyPlanner = await getOrCreatePlannerForDate(db, dayStart);
      const result = await getPlannerWithItems(db, dailyPlanner.id);
      setPlanner(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [db, dayStart]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => undefined;
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (noteDebounceRef.current) {
        clearTimeout(noteDebounceRef.current);
        noteDebounceRef.current = null;
      }

      const pendingNote = pendingNoteRef.current;
      const current = plannerRef.current;

      if (pendingNote !== null && current) {
        void updatePlannerNote(db, current.id, pendingNote).catch(() => {});
      }
    };
  }, [db]);

  const addItem = useCallback(
    async (section: PlannerSection, name: string): Promise<boolean> => {
      const trimmed = name.trim();
      const current = plannerRef.current;

      if (!trimmed || !current) {
        return false;
      }

      try {
        await createPlannerItem(db, {
          plannerId: current.id,
          section,
          name: trimmed,
        });
        await load();
        return true;
      } catch (err) {
        if (err instanceof PlannerSectionFullError) {
          return false;
        }
        setError(err as Error);
        throw err;
      }
    },
    [db, load],
  );

  const toggleItem = useCallback(
    async (itemId: number, done: boolean) => {
      try {
        await setPlannerItemDone(db, itemId, done);
        await load();
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [db, load],
  );

  const editItem = useCallback(
    async (itemId: number, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      try {
        await updatePlannerItem(db, itemId, trimmed);
        await load();
        setError(null);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [db, load],
  );

  const reorderSection = useCallback(
    async (section: PlannerSection, orderedIds: number[]) => {
      const current = plannerRef.current;
      if (!current || orderedIds.length === 0) {
        return;
      }

      try {
        await reorderPlannerItems(db, current.id, section, orderedIds);
        await load();
        setError(null);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [db, load],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      const current = plannerRef.current;
      if (!current) {
        return;
      }

      const previousItems = current.items;
      const itemExists = previousItems.some((item) => item.id === itemId);

      if (!itemExists) {
        return;
      }

      setPlanner((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((item) => item.id !== itemId),
            }
          : prev,
      );

      try {
        await deletePlannerItem(db, itemId);
        setError(null);
      } catch (err) {
        setPlanner((prev) => (prev ? { ...prev, items: previousItems } : prev));
        setError(err as Error);
        throw err;
      }
    },
    [db],
  );

  const updateNote = useCallback(
    (note: string) => {
      pendingNoteRef.current = note;
      setPlanner((prev) => (prev ? { ...prev, note } : prev));

      if (noteDebounceRef.current) {
        clearTimeout(noteDebounceRef.current);
      }

      noteDebounceRef.current = setTimeout(() => {
        noteDebounceRef.current = null;
        pendingNoteRef.current = null;

        void (async () => {
          const current = plannerRef.current;
          if (!current) {
            return;
          }

          try {
            await updatePlannerNote(db, current.id, note);
            setError(null);
          } catch (err) {
            setError(err as Error);
          }
        })();
      }, NOTE_DEBOUNCE_MS);
    },
    [db],
  );

  return {
    planner,
    loading,
    error,
    refresh: load,
    addItem,
    toggleItem,
    removeItem,
    editItem,
    reorderSection,
    updateNote,
  };
}
