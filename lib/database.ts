import * as SQLite from 'expo-sqlite';

const DB_NAME = 'checkme.db';

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price REAL NULL,
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

async function initialize(): Promise<Database> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.withTransactionAsync(async () => {
    for (const statement of MIGRATIONS) {
      await db.execAsync(statement);
    }
  });

  return db;
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
