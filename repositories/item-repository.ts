import type { Database } from '@/lib/database';
import type { ChecklistItem } from '@/types/checklist';

export interface ItemInput {
  checklistId: number;
  name: string;
  price?: number | null;
}

export async function createItem(db: Database, input: ItemInput): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO checklist_items (checklist_id, name, price, done) VALUES (?, ?, ?, 0);',
    [input.checklistId, input.name.trim(), normalizePrice(input.price)],
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

function normalizePrice(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.round(Number(value) * 100) / 100;
}
