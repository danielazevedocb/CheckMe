import type { Database } from '@/lib/database';
import type { ChecklistItem } from '@/types/checklist';

export interface ItemInput {
  checklistId: number;
  name: string;
  price?: number | null;
  quantity?: number | null;
  position?: number | null;
  color?: string;
}

export async function createItem(db: Database, input: ItemInput): Promise<number> {
  const color = input.color ?? '#2563EB';
  const quantity = normalizeQuantity(input.quantity);
  const position = input.position ?? (await getNextPosition(db, input.checklistId));
  const result = await db.runAsync(
    'INSERT INTO checklist_items (checklist_id, name, price, quantity, position, color, done) VALUES (?, ?, ?, ?, ?, ?, 0);',
    [input.checklistId, input.name.trim(), normalizePrice(input.price), quantity, position, color],
  );

  return Number(result.lastInsertRowId ?? 0);
}

export async function updateItem(db: Database, itemId: number, updates: Partial<Omit<ChecklistItem, 'id' | 'checklistId'>>): Promise<void> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (typeof updates.name === 'string') {
    fields.push('name = ?');
    values.push(updates.name.trim());
  }

  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(normalizePrice(updates.price));
  }

  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(normalizeQuantity(updates.quantity));
  }

  if (updates.position !== undefined) {
    fields.push('position = ?');
    values.push(Math.max(1, Math.floor(Number(updates.position))));
  }

  if (typeof updates.color === 'string') {
    fields.push('color = ?');
    values.push(updates.color);
  }

  if (typeof updates.done === 'boolean') {
    fields.push('done = ?');
    values.push(updates.done ? 1 : 0);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(itemId);

  const statement = `UPDATE checklist_items SET ${fields.join(', ')} WHERE id = ?;`;
  await db.runAsync(statement, values);
}

export async function setItemDone(db: Database, itemId: number, done: boolean): Promise<void> {
  await db.runAsync('UPDATE checklist_items SET done = ? WHERE id = ?;', [done ? 1 : 0, itemId]);
}

export async function deleteItem(db: Database, itemId: number): Promise<void> {
  await db.runAsync('DELETE FROM checklist_items WHERE id = ?;', [itemId]);
}

export async function deleteItemsByChecklist(db: Database, checklistId: number): Promise<void> {
  await db.runAsync('DELETE FROM checklist_items WHERE checklist_id = ?;', [checklistId]);
}

export async function reorderItems(db: Database, checklistId: number, orderedIds: number[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const itemId = orderedIds[index];
      await db.runAsync('UPDATE checklist_items SET position = ? WHERE id = ? AND checklist_id = ?;', [
        index + 1,
        itemId,
        checklistId,
      ]);
    }
  });
}

function normalizePrice(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.round(Number(value) * 100) / 100;
}

async function getNextPosition(db: Database, checklistId: number): Promise<number> {
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM checklist_items WHERE checklist_id = ?;',
    [checklistId],
  );

  return row?.next ?? 1;
}

function normalizeQuantity(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 1;
  }

  const parsed = Math.max(1, Math.floor(Number(value)));
  return parsed;
}
