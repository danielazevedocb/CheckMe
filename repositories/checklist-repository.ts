import type { Database } from '@/lib/database';
import type {
  Checklist,
  ChecklistMode,
  ChecklistStatus,
  ChecklistSummary,
  ChecklistWithItems,
} from '@/types/checklist';

const SUMMARY_LIST_QUERY = `
  SELECT
    c.id AS id,
    c.title AS title,
    c.created_at AS created_at,
    c.mode AS mode,
    c.scheduled_for AS scheduled_for,
    COUNT(i.id) AS total_items,
    SUM(CASE WHEN i.done = 1 THEN 1 ELSE 0 END) AS completed_items,
    SUM(COALESCE(i.price, 0)) AS total_amount,
    SUM(CASE WHEN i.done = 1 THEN COALESCE(i.price, 0) ELSE 0 END) AS completed_amount
  FROM checklists c
  LEFT JOIN checklist_items i ON i.checklist_id = c.id
  WHERE c.title LIKE ?
  GROUP BY c.id
  ORDER BY c.created_at DESC
`;

const SUMMARY_BY_ID_QUERY = `
  SELECT
    c.id AS id,
    c.title AS title,
    c.created_at AS created_at,
    c.mode AS mode,
    c.scheduled_for AS scheduled_for,
    COUNT(i.id) AS total_items,
    SUM(CASE WHEN i.done = 1 THEN 1 ELSE 0 END) AS completed_items,
    SUM(COALESCE(i.price, 0)) AS total_amount,
    SUM(CASE WHEN i.done = 1 THEN COALESCE(i.price, 0) ELSE 0 END) AS completed_amount
  FROM checklists c
  LEFT JOIN checklist_items i ON i.checklist_id = c.id
  WHERE c.id = ?
  GROUP BY c.id
`;

type SummaryRow = {
  id: number;
  title: string;
  created_at: number;
  mode: ChecklistMode;
  scheduled_for: number | null;
  total_items: number | null;
  completed_items: number | null;
  total_amount: number | null;
  completed_amount: number | null;
};

type ItemRow = {
  id: number;
  checklist_id: number;
  name: string;
  price: number | null;
  done: number;
};

export async function createChecklist(
  db: Database,
  title: string,
  mode: ChecklistMode,
  scheduledFor: number | null,
): Promise<number> {
  const createdAt = Date.now();
  const result = await db.runAsync(
    'INSERT INTO checklists (title, created_at, mode, scheduled_for) VALUES (?, ?, ?, ?);',
    [title.trim(), createdAt, mode, scheduledFor],
  );

  return Number(result.lastInsertRowId ?? 0);
}

export async function updateChecklistTitle(
  db: Database,
  checklistId: number,
  title: string,
): Promise<void> {
  await db.runAsync('UPDATE checklists SET title = ? WHERE id = ?;', [title.trim(), checklistId]);
}

export async function deleteChecklist(db: Database, checklistId: number): Promise<void> {
  await db.runAsync('DELETE FROM checklists WHERE id = ?;', [checklistId]);
}

export async function updateChecklistMode(
  db: Database,
  checklistId: number,
  mode: ChecklistMode,
): Promise<void> {
  await db.runAsync('UPDATE checklists SET mode = ? WHERE id = ?;', [mode, checklistId]);
}

export async function updateChecklistSchedule(
  db: Database,
  checklistId: number,
  scheduledFor: number | null,
): Promise<void> {
  await db.runAsync('UPDATE checklists SET scheduled_for = ? WHERE id = ?;', [scheduledFor, checklistId]);
}

export async function listChecklists(
  db: Database,
  status: ChecklistStatus,
  searchTerm?: string,
): Promise<ChecklistSummary[]> {
  const search = `%${(searchTerm ?? '').trim()}%`;
  const rows = await db.getAllAsync<SummaryRow>(SUMMARY_LIST_QUERY, [search]);

  return rows
    .map((row) => mapSummary(row))
    .filter((summary) => (status === 'completed' ? isCompleted(summary) : !isCompleted(summary)));
}

export async function getChecklistWithItems(
  db: Database,
  checklistId: number,
): Promise<ChecklistWithItems | null> {
  const summaryRow = await db.getFirstAsync<SummaryRow>(SUMMARY_BY_ID_QUERY, [checklistId]);

  if (!summaryRow) {
    return null;
  }

  const summary = mapSummary(summaryRow);

  const items = await db.getAllAsync<ItemRow>(
    `SELECT id, checklist_id, name, price, done FROM checklist_items WHERE checklist_id = ? ORDER BY id ASC;`,
    [checklistId],
  );

  return {
    ...summary,
    items: items.map((item) => ({
      id: item.id,
      checklistId: item.checklist_id,
      name: item.name,
      price: item.price,
      done: item.done === 1,
    })),
  };
}

export async function getChecklist(db: Database, checklistId: number): Promise<Checklist | null> {
  const row = await db.getFirstAsync<{
    id: number;
    title: string;
    created_at: number;
    mode: ChecklistMode;
    scheduled_for: number | null;
  }>('SELECT id, title, created_at, mode, scheduled_for FROM checklists WHERE id = ?;', [checklistId]);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    mode: row.mode,
    scheduledFor: row.scheduled_for ?? null,
  };
}

function mapSummary(row: SummaryRow): ChecklistSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    mode: row.mode,
    scheduledFor: row.scheduled_for ?? null,
    totalItems: row.total_items ?? 0,
    completedItems: row.completed_items ?? 0,
    totalAmount: roundCurrency(row.total_amount ?? 0),
    completedAmount: roundCurrency(row.completed_amount ?? 0),
  };
}

function isCompleted(summary: ChecklistSummary): boolean {
  return summary.totalItems > 0 && summary.totalItems === summary.completedItems;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
