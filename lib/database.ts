import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'checkme.db';

/** Increment when appending new versioned migrations below. */
export const DATABASE_SCHEMA_VERSION = 6;

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    color TEXT NOT NULL DEFAULT '#2563EB',
    icon TEXT NULL,
    type TEXT NOT NULL DEFAULT 'task'
  );`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    description TEXT NULL,
    created_at INTEGER NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NULL
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

      // Ensure v2.0 columns exist for installs that ran older migrations
      await ensureColumn(db, 'checklists', 'icon', 'TEXT NULL');
      await ensureColumn(db, 'checklist_items', 'priority', "TEXT NOT NULL DEFAULT 'MEDIUM'");
      await ensureColumn(db, 'checklist_items', 'description', 'TEXT NULL');
      await ensureColumn(db, 'checklist_items', 'created_at', 'INTEGER NULL');
      // v6 columns — shopping mode
      await ensureColumn(db, 'checklists', 'type', "TEXT NOT NULL DEFAULT 'task'");
      await ensureColumn(db, 'checklist_items', 'quantity', 'INTEGER NOT NULL DEFAULT 1');
      await ensureColumn(db, 'checklist_items', 'price', 'REAL NULL');

      await backfillItemCreatedAt(db);
      await normalizeItemPositions(db);

      await runVersionedMigrations(db);
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

async function getUserVersion(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  return row?.user_version ?? 0;
}

async function setUserVersion(db: Database, version: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

async function runVersionedMigrations(db: Database): Promise<void> {
  let version = await getUserVersion(db);

  if (version < 3) {
    version = 3;
    await setUserVersion(db, 3);
  }

  if (version < 4) {
    await migrateV4ChecklistIcon(db);
    version = 4;
    await setUserVersion(db, 4);
  }

  if (version < 5) {
    await migrateV5CleanupLegacySchema(db);
    await setUserVersion(db, 5);
  }

  if (version < 6) {
    await ensureColumn(db, 'checklists', 'type', "TEXT NOT NULL DEFAULT 'task'");
    await ensureColumn(db, 'checklist_items', 'quantity', 'INTEGER NOT NULL DEFAULT 1');
    await ensureColumn(db, 'checklist_items', 'price', 'REAL NULL');
    await setUserVersion(db, 6);
  }
}

/** V1.3 — adds icon column to installs that had v1.x schema. */
async function migrateV4ChecklistIcon(db: Database): Promise<void> {
  await ensureColumn(db, 'checklists', 'icon', 'TEXT NULL');
}

/** V1.5 — drops planner tables and legacy checklist/item columns from v1.x installs. */
async function migrateV5CleanupLegacySchema(db: Database): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS planner_items;');
  await db.execAsync('DROP TABLE IF EXISTS daily_planners;');

  const checklistColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(checklists);');
  const hasLegacyChecklistColumns = checklistColumns.some(
    (col) => col.name === 'mode' || col.name === 'scheduled_for',
  );

  if (hasLegacyChecklistColumns) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS checklists_v5 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        color TEXT NOT NULL DEFAULT '#2563EB',
        icon TEXT NULL
      );
    `);
    await db.execAsync(`
      INSERT INTO checklists_v5 (id, title, created_at, color, icon)
      SELECT id, title, created_at, color, icon FROM checklists;
    `);
    await db.execAsync('DROP TABLE checklists;');
    await db.execAsync('ALTER TABLE checklists_v5 RENAME TO checklists;');
  }

  const itemColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(checklist_items);');
  const hasLegacyItemColumns = itemColumns.some((col) => col.name === 'color');

  if (hasLegacyItemColumns) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS checklist_items_v5 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        done INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        description TEXT NULL,
        created_at INTEGER NULL
      );
    `);
    await db.execAsync(`
      INSERT INTO checklist_items_v5 (
        id, checklist_id, name, position, done, priority, description, created_at
      )
      SELECT
        id,
        checklist_id,
        name,
        COALESCE(position, 0),
        done,
        COALESCE(priority, 'MEDIUM'),
        description,
        created_at
      FROM checklist_items;
    `);
    await db.execAsync('DROP TABLE checklist_items;');
    await db.execAsync('ALTER TABLE checklist_items_v5 RENAME TO checklist_items;');
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON checklist_items(checklist_id);',
    );
  }
}

async function ensureColumn(db: Database, table: string, column: string, definition: string) {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  const hasColumn = rows.some((row) => row.name === column);

  if (!hasColumn) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

/** Sets `created_at` on legacy rows using the parent checklist `created_at`. */
async function backfillItemCreatedAt(db: Database) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(checklist_items);');
  if (!columns.some((col) => col.name === 'created_at')) {
    return;
  }

  await db.runAsync(`
    UPDATE checklist_items
    SET created_at = (
      SELECT c.created_at FROM checklists c WHERE c.id = checklist_items.checklist_id
    )
    WHERE created_at IS NULL;
  `);
}

async function normalizeItemPositions(db: Database) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(checklist_items);');
  if (!columns.some((col) => col.name === 'position')) {
    return;
  }

  const items = await db.getAllAsync<{ id: number; checklist_id: number }>(
    'SELECT id, checklist_id FROM checklist_items WHERE position IS NULL OR position = 0',
  );

  for (const item of items) {
    const row = await db.getFirstAsync<{ maxPosition: number }>(
      'SELECT COALESCE(MAX(position), 0) AS maxPosition FROM checklist_items WHERE checklist_id = ?',
      [item.checklist_id],
    );
    const newPosition = (row?.maxPosition ?? 0) + 1;
    await db.runAsync('UPDATE checklist_items SET position = ? WHERE id = ?', [newPosition, item.id]);
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
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.withTransactionAsync(async () => {
    await db.execAsync('DROP TABLE IF EXISTS planner_items;');
    await db.execAsync('DROP TABLE IF EXISTS daily_planners;');
    await db.execAsync('DROP TABLE IF EXISTS checklist_items;');
    await db.execAsync('DROP TABLE IF EXISTS checklists;');
    await db.execAsync('PRAGMA user_version = 0;');
  });
  databasePromise = null;
  await openDatabase();
}
