import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'checkme.db';

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    mode TEXT NOT NULL DEFAULT 'list',
    color TEXT NOT NULL DEFAULT '#2563EB',
    scheduled_for INTEGER NULL
  );`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price REAL NULL,
    color TEXT NOT NULL DEFAULT '#2563EB',
    done INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON checklist_items(checklist_id);`,
];

export type Database = SQLite.SQLiteDatabase;

let databasePromise: Promise<Database> | null = null;

export async function openDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = initialize();
  }

  return databasePromise;
}

async function initialize(retries = Platform.OS === 'web' ? 3 : 0): Promise<Database> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.withTransactionAsync(async () => {
      for (const statement of MIGRATIONS) {
        await db.execAsync(statement);
      }

      await ensureColumn(db, 'checklists', 'mode', "TEXT NOT NULL DEFAULT 'list'");
      await ensureColumn(db, 'checklists', 'color', "TEXT NOT NULL DEFAULT '#2563EB'");
      await ensureColumn(db, 'checklists', 'scheduled_for', 'INTEGER NULL');
      await ensureColumn(db, 'checklist_items', 'color', "TEXT NOT NULL DEFAULT '#2563EB'");
    });

    return db;
  } catch (error) {
    if (shouldRetryOpen(error) && retries > 0) {
      await sleep(200);
      return initialize(retries - 1);
    }

    throw error;
  }
}

async function ensureColumn(db: Database, table: string, column: string, definition: string) {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  const hasColumn = rows.some((row) => row.name === column);

  if (!hasColumn) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

function shouldRetryOpen(error: unknown): boolean {
  if (Platform.OS !== 'web') {
    return false;
  }

  if (error instanceof DOMException && error.name === 'NoModificationAllowedError') {
    return true;
  }

  if (error instanceof Error && error.message.includes('createSyncAccessHandle')) {
    return true;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resetDatabase(): Promise<void> {
  const db = await openDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DROP TABLE IF EXISTS checklist_items;');
    await db.execAsync('DROP TABLE IF EXISTS checklists;');
  });
  databasePromise = null;
  await openDatabase();
}
