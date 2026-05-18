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
  type ChecklistWithItems,
} from '@/types/checklist';

const SUMMARY_LIST_QUERY = `
  SELECT
    c.id AS id,
    c.title AS title,
    c.created_at AS created_at,
    c.color AS color,
    c.icon AS icon,
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
}

export async function createChecklist(
  db: Database,
  title: string,
  modeOrColor: ChecklistMode | string,
  colorOrScheduled: string | number | null,
  scheduledForOrIcon?: number | string | null,
  icon?: string | null,
): Promise<number> {
  const createdAt = Date.now();

  let color: string;
  let resolvedIcon: string | null = null;

  if (modeOrColor === 'list' || modeOrColor === 'text') {
    color = String(colorOrScheduled);
    const maybeIcon = typeof scheduledForOrIcon === 'string' ? scheduledForOrIcon : icon;
    resolvedIcon = normalizeIcon(maybeIcon);
  } else {
    color = modeOrColor;
    const maybeIcon =
      typeof colorOrScheduled === 'string'
        ? colorOrScheduled
        : typeof scheduledForOrIcon === 'string'
          ? scheduledForOrIcon
          : icon;
    resolvedIcon = normalizeIcon(maybeIcon);
  }

  const result = await db.runAsync(
    'INSERT INTO checklists (title, created_at, color, icon) VALUES (?, ?, ?, ?);',
    [title.trim(), createdAt, color, resolvedIcon],
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

/** @deprecated Mode column removed in schema v5 — no-op for UI compatibility. */
export async function updateChecklistMode(
  _db: Database,
  _checklistId: number,
  _mode: ChecklistMode,
): Promise<void> {
  return;
}

export async function updateChecklistColor(
  db: Database,
  checklistId: number,
  color: string,
): Promise<void> {
  await db.runAsync('UPDATE checklists SET color = ? WHERE id = ?;', [color, checklistId]);
}

/** @deprecated scheduled_for column removed in schema v5 — no-op for UI compatibility. */
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

  return rows
    .map((row) => mapSummary(row))
    .filter((summary) => (status === 'completed' ? isCompleted(summary) : !isCompleted(summary)));
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

  return {
    ...summary,
    items,
  };
}

export async function getChecklist(db: Database, checklistId: number): Promise<ChecklistRecord | null> {
  const row = await db.getFirstAsync<ChecklistRow>(
    'SELECT id, title, created_at, color, icon FROM checklists WHERE id = ?;',
    [checklistId],
  );

  if (!row) {
    return null;
  }

  return mapChecklistRow(row);
}

function mapSummary(row: SummaryRow): ChecklistSummary {
  const totalItems = row.total_items ?? 0;
  const completedItems = row.completed_items ?? 0;

  return {
    ...mapChecklistRow(row),
    totalItems,
    completedItems,
    progressPercent: computeChecklistProgressPercent(totalItems, completedItems),
    totalAmount: 0,
    completedAmount: 0,
  };
}

function isCompleted(summary: ChecklistSummary): boolean {
  return summary.totalItems > 0 && summary.totalItems === summary.completedItems;
}

function normalizeIcon(icon: string | null | undefined): string | null {
  if (icon == null) {
    return null;
  }

  const trimmed = icon.trim();
  return trimmed.length > 0 ? trimmed : null;
}
