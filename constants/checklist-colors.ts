export interface ChecklistColorOption {
  id: string;
  label: string;
  value: string;
}

export const CHECKLIST_COLORS: ChecklistColorOption[] = [
  { id: 'blue', label: 'Azul', value: '#2563EB' },
  { id: 'cyan', label: 'Ciano', value: '#0891B2' },
  { id: 'purple', label: 'Roxo', value: '#7C3AED' },
  { id: 'pink', label: 'Rosa', value: '#DB2777' },
  { id: 'orange', label: 'Laranja', value: '#F97316' },
  { id: 'yellow', label: 'Amarelo', value: '#FACC15' },
  { id: 'green', label: 'Verde', value: '#22C55E' },
  { id: 'slate', label: 'Grafite', value: '#64748B' }
];

export const DEFAULT_CHECKLIST_COLOR = CHECKLIST_COLORS[0].value;
