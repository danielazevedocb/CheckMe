export type ChecklistStatus = 'open' | 'completed';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export const DEFAULT_TASK_PRIORITY: TaskPriority = 'MEDIUM';

export interface Task {
  id: number;
  checklistId: number;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  completed: boolean;
  position: number;
  createdAt: number;
}

/**
 * @deprecated Use `Task`. Includes legacy field aliases (`name`, `done`, etc.) for incremental migration.
 */
export interface ChecklistItem extends Task {
  /** @deprecated Use `title` */
  name: string;
  /** @deprecated Use `completed` */
  done: boolean;
  /** @deprecated Shopping mode only — removed in v2.0 */
  price: number | null;
  /** @deprecated Shopping mode only — removed in v2.0 */
  quantity: number;
  /** @deprecated Item-level color; prefer checklist color in v2.0 */
  color: string;
}

export interface Checklist {
  id: number;
  title: string;
  createdAt: number;
  color?: string;
  icon?: string;
}

/** @deprecated List vs text modes removed in v2.0 */
export type ChecklistMode = 'list' | 'text';

/** @deprecated Columns still present in SQLite until cleanup migration */
export interface ChecklistLegacyFields {
  /** @deprecated */
  mode: ChecklistMode;
  /** @deprecated */
  scheduledFor: number | null;
}

/**
 * Checklist as read from the current DB schema (legacy columns included).
 * @deprecated Prefer `Checklist` in new code.
 */
export type ChecklistRecord = Checklist &
  ChecklistLegacyFields & {
    color: string;
  };

export interface ChecklistSummary extends ChecklistRecord {
  totalItems: number;
  completedItems: number;
  /** Completion ratio 0–100 from item counts (v2 home). */
  progressPercent: number;
  /** @deprecated Use `progressPercent` on home cards in v2.0 */
  totalAmount: number;
  /** @deprecated Use `progressPercent` on home cards in v2.0 */
  completedAmount: number;
}

export function computeChecklistProgressPercent(totalItems: number, completedItems: number): number {
  if (totalItems <= 0) {
    return 0;
  }

  return Math.round((completedItems / totalItems) * 100);
}

export interface ChecklistWithItems extends ChecklistSummary {
  items: ChecklistItem[];
}

/** @deprecated Use `ChecklistWithItems` */
export type ChecklistWithTasks = ChecklistWithItems;

export type ChecklistRow = {
  id: number;
  title: string;
  created_at: number;
  color: string;
  icon?: string | null;
  /** @deprecated Removed in schema v5 — present only on pre-migration reads */
  mode?: ChecklistMode;
  /** @deprecated Removed in schema v5 */
  scheduled_for?: number | null;
};

export type ChecklistItemRow = {
  id: number;
  checklist_id: number;
  name: string;
  position: number | null;
  done: number;
  priority?: string | null;
  description?: string | null;
  created_at?: number | null;
  /** @deprecated Removed in schema v5 */
  price?: number | null;
  /** @deprecated Removed in schema v5 */
  quantity?: number | null;
  /** @deprecated Removed in schema v5 */
  color?: string;
};

export function parseTaskPriority(value: string | null | undefined): TaskPriority {
  if (value === 'HIGH' || value === 'MEDIUM' || value === 'LOW') {
    return value;
  }
  return DEFAULT_TASK_PRIORITY;
}

/** Maps SQLite `checklists` row to domain checklist (includes legacy fields). */
export function mapChecklistRow(row: ChecklistRow): ChecklistRecord {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    color: row.color,
    icon: row.icon ?? undefined,
    mode: row.mode ?? 'list',
    scheduledFor: row.scheduled_for ?? null,
  };
}

/**
 * Maps SQLite `checklist_items` row to `Task` / `ChecklistItem`.
 * Column `name` → `title`, `done` → `completed`.
 */
export function mapTaskFromRow(row: ChecklistItemRow, fallbackPosition: number): ChecklistItem {
  const title = row.name;
  const completed = row.done === 1;
  const position = row.position ?? fallbackPosition;

  return {
    id: row.id,
    checklistId: row.checklist_id,
    title,
    description: row.description ?? null,
    priority: parseTaskPriority(row.priority),
    completed,
    position,
    createdAt: row.created_at ?? 0,
    name: title,
    done: completed,
    price: row.price ?? null,
    quantity: row.quantity ?? 1,
    color: row.color ?? '#2563EB',
  };
}

/** @deprecated Use `mapTaskFromRow` */
export const mapChecklistItemRow = mapTaskFromRow;

export type TaskUpdate = Partial<Omit<Task, 'id' | 'checklistId'>>;

/** Partial updates accepting v2 (`title`, `completed`) or legacy (`name`, `done`) field names. */
export type ChecklistItemUpdate = TaskUpdate &
  Partial<{
    /** @deprecated Use `title` */
    name: string;
    /** @deprecated Use `completed` */
    done: boolean;
    /** @deprecated */
    price: number | null;
    /** @deprecated */
    quantity: number;
    /** @deprecated */
    color: string;
  }>;
