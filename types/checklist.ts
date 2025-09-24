export type ChecklistStatus = 'open' | 'completed';
export type ChecklistMode = 'list' | 'text';

export interface Checklist {
  id: number;
  title: string;
  createdAt: number;
  mode: ChecklistMode;
  color: string;
  scheduledFor: number | null;
}

export interface ChecklistItem {
  id: number;
  checklistId: number;
  name: string;
  price: number | null;
  done: boolean;
  color: string;
}

export interface ChecklistSummary extends Checklist {
  totalItems: number;
  completedItems: number;
  totalAmount: number;
  completedAmount: number;
}

export interface ChecklistWithItems extends ChecklistSummary {
  items: ChecklistItem[];
}
