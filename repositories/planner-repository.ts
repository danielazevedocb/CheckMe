import type { Database } from '@/lib/database';
import {
  SECTION_LIMITS,
  type DailyPlanner,
  type DailyPlannerWithItems,
  type PlannerItem,
  type PlannerSection,
} from '@/types/planner';
import { startOfDay } from '@/utils/format';

type PlannerRow = {
  id: number;
  date: number;
  note: string | null;
  created_at: number;
};

type PlannerItemRow = {
  id: number;
  planner_id: number;
  section: PlannerSection;
  name: string;
  done: number;
  position: number | null;
};

export class PlannerSectionFullError extends Error {
  constructor(
    public readonly section: PlannerSection,
    public readonly limit: number,
  ) {
    super(`Section "${section}" is full (max ${limit} items).`);
    this.name = 'PlannerSectionFullError';
  }
}

export async function getOrCreatePlannerForDate(db: Database, date: number): Promise<DailyPlanner> {
  const dayStart = startOfDay(new Date(date)).getTime();
  const createdAt = Date.now();

  await db.runAsync('INSERT OR IGNORE INTO daily_planners (date, note, created_at) VALUES (?, NULL, ?);', [
    dayStart,
    createdAt,
  ]);

  const row = await db.getFirstAsync<PlannerRow>(
    'SELECT id, date, note, created_at FROM daily_planners WHERE date = ?;',
    [dayStart],
  );

  if (!row) {
    throw new Error('Failed to get or create daily planner.');
  }

  return mapPlanner(row);
}

export async function getPlannerWithItems(
  db: Database,
  plannerId: number,
): Promise<DailyPlannerWithItems | null> {
  const row = await db.getFirstAsync<PlannerRow>(
    'SELECT id, date, note, created_at FROM daily_planners WHERE id = ?;',
    [plannerId],
  );

  if (!row) {
    return null;
  }

  const items = await db.getAllAsync<PlannerItemRow>(
    `SELECT id, planner_id, section, name, done, position
     FROM planner_items
     WHERE planner_id = ?
     ORDER BY section ASC, position ASC, id ASC;`,
    [plannerId],
  );

  return {
    ...mapPlanner(row),
    items: items.map((item, index) => mapPlannerItem(item, index)),
  };
}

export async function updatePlannerNote(
  db: Database,
  plannerId: number,
  note: string | null,
): Promise<void> {
  const normalized = note === null || note === undefined ? null : note.trim() || null;
  await db.runAsync('UPDATE daily_planners SET note = ? WHERE id = ?;', [normalized, plannerId]);
}

export interface CreatePlannerItemInput {
  plannerId: number;
  section: PlannerSection;
  name: string;
}

export async function createPlannerItem(db: Database, input: CreatePlannerItemInput): Promise<number> {
  const limit = SECTION_LIMITS[input.section];

  if (limit !== null) {
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM planner_items WHERE planner_id = ? AND section = ?;',
      [input.plannerId, input.section],
    );

    if ((row?.count ?? 0) >= limit) {
      throw new PlannerSectionFullError(input.section, limit);
    }
  }

  const position = await getNextPosition(db, input.plannerId, input.section);
  const result = await db.runAsync(
    'INSERT INTO planner_items (planner_id, section, name, done, position) VALUES (?, ?, ?, 0, ?);',
    [input.plannerId, input.section, input.name.trim(), position],
  );

  return Number(result.lastInsertRowId ?? 0);
}

export async function setPlannerItemDone(db: Database, itemId: number, done: boolean): Promise<void> {
  await db.runAsync('UPDATE planner_items SET done = ? WHERE id = ?;', [done ? 1 : 0, itemId]);
}

export async function updatePlannerItem(db: Database, itemId: number, name: string): Promise<void> {
  await db.runAsync('UPDATE planner_items SET name = ? WHERE id = ?;', [name.trim(), itemId]);
}

export async function deletePlannerItem(db: Database, itemId: number): Promise<void> {
  await db.runAsync('DELETE FROM planner_items WHERE id = ?;', [itemId]);
}

export async function reorderPlannerItems(
  db: Database,
  plannerId: number,
  section: PlannerSection,
  orderedIds: number[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const itemId = orderedIds[index];
      await db.runAsync(
        'UPDATE planner_items SET position = ? WHERE id = ? AND planner_id = ? AND section = ?;',
        [index + 1, itemId, plannerId, section],
      );
    }
  });
}

export async function listPlannerDates(db: Database): Promise<number[]> {
  const rows = await db.getAllAsync<{ date: number }>(
    'SELECT date FROM daily_planners ORDER BY date DESC;',
  );

  return rows.map((row) => row.date);
}

export interface PlannerDaySummary {
  date: number;
  completed: number;
  total: number;
}

export async function listPlannerSummaries(db: Database): Promise<PlannerDaySummary[]> {
  const rows = await db.getAllAsync<{
    date: number;
    completed: number;
    total: number;
  }>(
    `SELECT
       dp.date AS date,
       COALESCE(SUM(CASE WHEN pi.done = 1 THEN 1 ELSE 0 END), 0) AS completed,
       COALESCE(COUNT(pi.id), 0) AS total
     FROM daily_planners dp
     LEFT JOIN planner_items pi
       ON pi.planner_id = dp.id
       AND pi.section IN ('main', 'priorities')
     GROUP BY dp.id
     ORDER BY dp.date DESC;`,
  );

  return rows.map((row) => ({
    date: row.date,
    completed: row.completed,
    total: row.total,
  }));
}

function mapPlanner(row: PlannerRow): DailyPlanner {
  return {
    id: row.id,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapPlannerItem(row: PlannerItemRow, index: number): PlannerItem {
  return {
    id: row.id,
    plannerId: row.planner_id,
    section: row.section,
    name: row.name,
    done: row.done === 1,
    position: row.position ?? index + 1,
  };
}

async function getNextPosition(db: Database, plannerId: number, section: PlannerSection): Promise<number> {
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM planner_items WHERE planner_id = ? AND section = ?;',
    [plannerId, section],
  );

  return row?.next ?? 1;
}
