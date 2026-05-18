import type { Database } from '@/lib/database';
import {
  DEFAULT_TASK_PRIORITY,
  mapTaskFromRow,
  type ChecklistItem,
  type ChecklistItemRow,
  type ChecklistItemUpdate,
  type TaskPriority,
} from '@/types/checklist';

const TASKS_ORDER_BY = `
  done ASC,
  CASE priority
    WHEN 'HIGH' THEN 1
    WHEN 'MEDIUM' THEN 2
    WHEN 'LOW' THEN 3
    ELSE 2
  END ASC,
  position ASC,
  id ASC
`;

const TASK_SELECT_COLUMNS = `
  id, checklist_id, name, position, done, priority, description, created_at, quantity, price
`;

export interface TaskInput {
  checklistId: number;
  /** @deprecated Use `title` */
  name?: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  position?: number | null;
  quantity?: number;
  price?: number | null;
  /** @deprecated Ignored after schema v5 */
  color?: string;
}

/** @deprecated Use `TaskInput` */
export type ItemInput = TaskInput;

export interface ListTasksOptions {
  priority?: TaskPriority;
}

export async function listTasksByChecklist(
  db: Database,
  checklistId: number,
  options?: ListTasksOptions,
): Promise<ChecklistItem[]> {
  const priority = options?.priority;

  const rows = priority
    ? await db.getAllAsync<ChecklistItemRow>(
        `SELECT ${TASK_SELECT_COLUMNS}
         FROM checklist_items
         WHERE checklist_id = ? AND priority = ?
         ORDER BY ${TASKS_ORDER_BY};`,
        [checklistId, priority],
      )
    : await db.getAllAsync<ChecklistItemRow>(
        `SELECT ${TASK_SELECT_COLUMNS}
         FROM checklist_items
         WHERE checklist_id = ?
         ORDER BY ${TASKS_ORDER_BY};`,
        [checklistId],
      );

  return rows.map((row, index) => mapTaskFromRow(row, index + 1));
}

export async function createItem(db: Database, input: TaskInput): Promise<number> {
  const position = input.position ?? (await getNextPosition(db, input.checklistId));
  const title = resolveItemTitle(input);
  const priority = input.priority ?? DEFAULT_TASK_PRIORITY;
  const description = input.description?.trim() || null;
  const quantity = Math.max(1, Math.round(input.quantity ?? 1));
  const price = input.price ?? null;
  const createdAt = Date.now();

  const result = await db.runAsync(
    `INSERT INTO checklist_items (
       checklist_id, name, position, done, priority, description, created_at, quantity, price
     )
     VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?);`,
    [input.checklistId, title, position, priority, description, createdAt, quantity, price],
  );

  return Number(result.lastInsertRowId ?? 0);
}

/** @deprecated Use `createItem` */
export const createTask = createItem;

export async function updateItem(
  db: Database,
  itemId: number,
  updates: ChecklistItemUpdate,
): Promise<void> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  const title = updates.title ?? updates.name;
  if (typeof title === 'string') {
    fields.push('name = ?');
    values.push(title.trim());
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    const description = updates.description;
    values.push(typeof description === 'string' ? description.trim() || null : description);
  }

  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }

  if (updates.position !== undefined) {
    fields.push('position = ?');
    values.push(Math.max(1, Math.floor(Number(updates.position))));
  }

  const completed = updates.completed ?? updates.done;
  if (typeof completed === 'boolean') {
    fields.push('done = ?');
    values.push(completed ? 1 : 0);
  }

  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(Math.max(1, Math.round(Number(updates.quantity))));
  }

  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(itemId);

  await db.runAsync(`UPDATE checklist_items SET ${fields.join(', ')} WHERE id = ?;`, values);
}

/** @deprecated Use `updateItem` */
export const updateTask = updateItem;

export async function setItemDone(db: Database, itemId: number, done: boolean): Promise<void> {
  await db.runAsync('UPDATE checklist_items SET done = ? WHERE id = ?;', [done ? 1 : 0, itemId]);
}

export async function deleteItem(db: Database, itemId: number): Promise<void> {
  await db.runAsync('DELETE FROM checklist_items WHERE id = ?;', [itemId]);
}

export async function deleteItemsByChecklist(db: Database, checklistId: number): Promise<void> {
  await db.runAsync('DELETE FROM checklist_items WHERE checklist_id = ?;', [checklistId]);
}

export async function markAllItemsDone(db: Database, checklistId: number, done: boolean): Promise<void> {
  await db.runAsync('UPDATE checklist_items SET done = ? WHERE checklist_id = ?;', [done ? 1 : 0, checklistId]);
}

export async function reorderItems(db: Database, checklistId: number, orderedIds: number[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const itemId = orderedIds[index];
      await db.runAsync(
        'UPDATE checklist_items SET position = ? WHERE id = ? AND checklist_id = ?;',
        [index + 1, itemId, checklistId],
      );
    }
  });
}

function resolveItemTitle(input: TaskInput): string {
  return (input.title ?? input.name ?? '').trim();
}

async function getNextPosition(db: Database, checklistId: number): Promise<number> {
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM checklist_items WHERE checklist_id = ?;',
    [checklistId],
  );

  return row?.next ?? 1;
}
