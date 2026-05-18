export type PlannerSection = 'main' | 'priorities' | 'tomorrow' | 'dont_forget';

export interface DailyPlanner {
  id: number;
  date: number;
  note: string | null;
  createdAt: number;
}

export interface PlannerItem {
  id: number;
  plannerId: number;
  section: PlannerSection;
  name: string;
  done: boolean;
  position: number;
}

export interface DailyPlannerWithItems extends DailyPlanner {
  items: PlannerItem[];
}

export const SECTION_LIMITS: Record<PlannerSection, number | null> = {
  priorities: 3,
  main: null,
  tomorrow: 5,
  dont_forget: 5,
};

export const SECTION_LABELS: Record<PlannerSection, string> = {
  priorities: 'Prioridades',
  main: 'Lista do Dia',
  tomorrow: 'Para Amanhã',
  dont_forget: 'Não Esquecer',
};

export const PLANNER_SECTIONS: PlannerSection[] = [
  'priorities',
  'main',
  'tomorrow',
  'dont_forget',
];
