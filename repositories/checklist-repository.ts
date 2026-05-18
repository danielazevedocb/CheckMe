import type { Database } from '@/lib/database';
import { listTasksByChecklist, type ListTasksOptions } from '@/repositories/item-repository';
import {
  computeChecklistProgressPercent,
  mapChecklistRow,
  type ChecklistMode,
  type ChecklistRecord,
  type ChecklistRow,
  type ChecklistStatus,
  type ChecklistSummary,
  type ChecklistType,
  type ChecklistWithItems,
} from '@/types/checklist';

const SUMMARY_LIST_QUERY = `
  SELECT
    c.id AS id,
    c.title AS title,
    c.created_at AS created_at,
    c.color AS color,
    c.icon AS icon,
    c.type AS type,
    COUNT(i.id) AS total_items,
    SUM(CASE WHEN i.done = 1 THEN 1 ELSE 0 END) AS completed_items
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
    c.color AS color,
    c.icon AS icon,
    c.type AS type,
    COUNT(i.id) AS total_items,
    SUM(CASE WHEN i.done = 1 THEN 1 ELSE 0 END) AS completed_items
  FROM checklists c
  LEFT JOIN checklist_items i ON i.checklist_id = c.id
  WHERE c.id = ?
  GROUP BY c.id
`;

type SummaryRow = ChecklistRow & {
  total_items: number | null;
  completed_items: number | null;
};

export type GetChecklistWithItemsOptions = ListTasksOptions;

export interface CreateChecklistInput {
  title: string;
  color: string;
  icon?: string | null;
  type?: ChecklistType;
}

export async function createChecklist(
  db: Database,
  input: CreateChecklistInput,
): Promise<number> {
  const type = input.type ?? 'task';
  const result = await db.runAsync(
    'INSERT INTO checklists (title, created_at, color, icon, type) VALUES (?, ?, ?, ?, ?);',
    [input.title.trim(), Date.now(), input.color, normalizeIcon(input.icon), type],
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

export async function updateChecklistColor(
  db: Database,
  checklistId: number,
  color: string,
): Promise<void> {
  await db.runAsync('UPDATE checklists SET color = ? WHERE id = ?;', [color, checklistId]);
}

export async function updateChecklistIcon(
  db: Database,
  checklistId: number,
  icon: string | null,
): Promise<void> {
  await db.runAsync('UPDATE checklists SET icon = ? WHERE id = ?;', [normalizeIcon(icon), checklistId]);
}

export async function deleteChecklist(db: Database, checklistId: number): Promise<void> {
  await db.runAsync('DELETE FROM checklists WHERE id = ?;', [checklistId]);
}

/** @deprecated mode column removed in schema v5 — no-op kept for call-site compatibility. */
export async function updateChecklistMode(
  _db: Database,
  _checklistId: number,
  _mode: ChecklistMode,
): Promise<void> {
  return;
}

/** @deprecated scheduled_for column removed in schema v5 — no-op kept for call-site compatibility. */
export async function updateChecklistSchedule(
  _db: Database,
  _checklistId: number,
  _scheduledFor: number | null,
): Promise<void> {
  return;
}

export async function listChecklists(
  db: Database,
  status: ChecklistStatus,
  searchTerm?: string,
): Promise<ChecklistSummary[]> {
  const search = `%${(searchTerm ?? '').trim()}%`;
  const rows = await db.getAllAsync<SummaryRow>(SUMMARY_LIST_QUERY, [search]);
  const summaries = rows.map(mapSummary);

  if (status === 'all') {
    return summaries;
  }

  return summaries.filter((s) => (status === 'completed' ? isCompleted(s) : !isCompleted(s)));
}

export async function getChecklistWithItems(
  db: Database,
  checklistId: number,
  options?: GetChecklistWithItemsOptions,
): Promise<ChecklistWithItems | null> {
  const summaryRow = await db.getFirstAsync<SummaryRow>(SUMMARY_BY_ID_QUERY, [checklistId]);

  if (!summaryRow) {
    return null;
  }

  const summary = mapSummary(summaryRow);
  const items = await listTasksByChecklist(db, checklistId, options);

  return { ...summary, items };
}

export async function getChecklist(db: Database, checklistId: number): Promise<ChecklistRecord | null> {
  const row = await db.getFirstAsync<ChecklistRow>(
    'SELECT id, title, created_at, color, icon, type FROM checklists WHERE id = ?;',
    [checklistId],
  );

  return row ? mapChecklistRow(row) : null;
}

function mapSummary(row: SummaryRow): ChecklistSummary {
  const totalItems = row.total_items ?? 0;
  const completedItems = row.completed_items ?? 0;

  return {
    ...mapChecklistRow(row),
    totalItems,
    completedItems,
    progressPercent: computeChecklistProgressPercent(completedItems, totalItems),
    totalAmount: 0,
    completedAmount: 0,
  };
}

function isCompleted(summary: ChecklistSummary): boolean {
  return summary.totalItems > 0 && summary.totalItems === summary.completedItems;
}

function normalizeIcon(icon: string | null | undefined): string | null {
  if (icon == null) return null;
  const trimmed = icon.trim();
  return trimmed.length > 0 ? trimmed : null;
}
