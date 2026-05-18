export interface ChecklistIconOption {
  id: string;
  emoji: string;
  label: string;
}

/** Optional emoji icons for checklists (V1.3). */
export const CHECKLIST_ICON_OPTIONS: ChecklistIconOption[] = [
  { id: 'books', emoji: '📚', label: 'Estudos' },
  { id: 'briefcase', emoji: '💼', label: 'Trabalho' },
  { id: 'cart', emoji: '🛒', label: 'Compras' },
  { id: 'home', emoji: '🏠', label: 'Casa' },
  { id: 'fitness', emoji: '💪', label: 'Academia' },
  { id: 'star', emoji: '⭐', label: 'Favorito' },
  { id: 'calendar', emoji: '📅', label: 'Agenda' },
  { id: 'heart', emoji: '❤️', label: 'Pessoal' },
];
