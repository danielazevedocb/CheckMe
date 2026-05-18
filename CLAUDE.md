# CLAUDE.md — CheckMe (Projeto)

Instruções específicas do projeto CheckMe. Complementam as regras globais em `~/.claude/CLAUDE.md`.

---

## Identidade do projeto

**CheckMe** é um app mobile offline-first (Expo + React Native + TypeScript) para gerenciar **múltiplas checklists**, cada uma com **tarefas priorizadas** (HIGH / MEDIUM / LOW). Sem backend, sem conta, sem nuvem — SQLite local é a única fonte de dados.

**UX:** minimalista, moderna, **dark mode como padrão** na primeira instalação. Cards discretos, poucas bordas, tipografia e espaçamento como hierarquia principal. Inspirado em Todoist/TickTick.

---

## Estado atual (v2.0 — produção)

- Schema SQLite na **versão 5** — limpo, sem colunas legadas
- Tabelas `daily_planners` e `planner_items` **removidas** (migration v5)
- Dark mode como padrão (AsyncStorage sem valor → `'dark'`)
- Todas as funcionalidades core implementadas e funcionando

---

## Arquitetura — camadas

```
app/                    ← rotas Expo Router (só composição, sem lógica)
  (tabs)/
    index.tsx           ← home: lista de checklists com filtros
    nova.tsx            ← criar nova checklist
  checklist/[id].tsx    ← detalhe: tarefas com prioridade
  config.tsx            ← configurações (tema, reset DB)

components/
  ui/                   ← Button, TextField, SearchBar, FAB, EmptyState, Skeleton
  checklist/            ← ChecklistCard, TaskItem, PriorityBadge, ProgressBar,
                           ChecklistCardSkeleton, ChecklistForm, TaskForm,
                           PrioritySelector, ChecklistItemRow (re-export)

contexts/               ← DatabaseContext, ThemeContext
hooks/                  ← useChecklists, useChecklist, useDebouncedValue
lib/                    ← database.ts (SQLite + migrations)
repositories/           ← checklist-repository.ts, item-repository.ts
types/                  ← checklist.ts (Checklist, Task, TaskPriority, mappers)
utils/                  ← color.ts, format.ts
constants/              ← checklist-colors.ts, theme.ts
```

**Regra de ouro:** SQL só em `repositories/`. Estado em `hooks/`. Componentes são visuais. Telas em `app/` apenas compõem.

---

## Modelo de domínio

### Checklist

```ts
interface Checklist {
  id: number;
  title: string;
  color?: string;   // paleta fixa de 8 cores
  icon?: string;    // emoji (ex.: '📘') ou null
  createdAt: number;
}
```

### Task (tabela `checklist_items` no SQLite)

```ts
type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface Task {
  id: number;
  checklistId: number;
  title: string;          // coluna SQLite: `name`
  description?: string | null;
  priority: TaskPriority; // default: 'MEDIUM'
  completed: boolean;     // coluna SQLite: `done`
  position: number;
  createdAt: number;
}
```

**Atenção:** `ChecklistItem` em `types/checklist.ts` é alias legado de `Task` com campos `name`, `done`, `price`, `quantity` marcados como `@deprecated`. Use `Task` em código novo.

### Prioridade visual (tokens em `constants/theme.ts`)

| Valor | Token | Cor dark |
|---|---|---|
| `HIGH` | `Colors.dark.priorityHigh` | `#F87171` (vermelho) |
| `MEDIUM` | `Colors.dark.priorityMedium` | `#FACC15` (amarelo) |
| `LOW` | `Colors.dark.priorityLow` | `#94A3B8` (cinza) |

---

## Padrões de banco de dados

- Instância via `useDatabase()` — nunca abrir SQLite direto em componentes
- Mutations exclusivamente em `repositories/`
- Migrations em `lib/database.ts`: adicionar ao array `MIGRATIONS` (fresh install) E ao `runVersionedMigrations` (upgrade); nunca modificar migrations já aplicadas
- `PRAGMA foreign_keys = ON` já ativo globalmente
- Schema atual após migration v5:

```sql
checklists        (id, title, created_at, color, icon)
checklist_items   (id, checklist_id, name, position, done, priority, description, created_at)
```

---

## Padrões de hooks

```ts
export function useChecklist(id: number) {
  const db = useDatabase();
  const [data, setData] = useState<ChecklistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => { ... }, [db, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { data, loading, error, refresh: load };
}
```

- Retornar sempre `{ data, loading, error, refresh }`
- `useFocusEffect` para refetch ao voltar à tela
- Filtro e ordenação por prioridade no hook/repository, não na View

---

## Componentes — usar, não duplicar

### Domínio checklist

| Componente | Arquivo | Status |
|---|---|---|
| `ChecklistCard` | `components/checklist/checklist-card.tsx` | ✅ v2.0 — título, ícone, cor, `ProgressBar` |
| `TaskItem` | `components/checklist/task-item.tsx` | ✅ — checkbox, título, `PriorityBadge`, swipe, drag |
| `PriorityBadge` | `components/checklist/priority-badge.tsx` | ✅ — pill HIGH/MEDIUM/LOW |
| `ProgressBar` | `components/checklist/progress-bar.tsx` | ✅ — barra animada com % |
| `PrioritySelector` | `components/checklist/priority-selector.tsx` | ✅ — radio group para forms |
| `ChecklistForm` | `components/checklist/checklist-form.tsx` | ✅ — título, cor, ícone |
| `TaskForm` | `components/checklist/task-form.tsx` | ✅ — título, descrição, prioridade |

### UI primitivos

| Componente | Arquivo |
|---|---|
| `Button` | `components/ui/button.tsx` — variantes: `primary`, `secondary`, `ghost`, `danger` |
| `TextField` | `components/ui/text-field.tsx` |
| `SearchBar` | `components/ui/search-bar.tsx` |
| `EmptyState` | `components/ui/empty-state.tsx` |
| `FloatingActionButton` | `components/ui/fab.tsx` |
| `Skeleton` | `components/ui/skeleton.tsx` |
| `ThemedText` / `ThemedView` | `components/themed-*.tsx` |

---

## Sistema de temas

```ts
import { Colors } from '@/constants/theme';
const { resolved } = useThemeMode();   // 'light' | 'dark'
const palette = Colors[resolved];
// palette.surface, palette.text, palette.priorityHigh, etc.
```

- **Nunca** usar hex solto em estilos — sempre via `Colors[resolved]`
- `ThemeContext` default: `'dark'` na primeira instalação
- `toggle()` alterna entre light/dark; `setMode('system')` segue o OS

---

## `createChecklist` — assinatura atual (v2.0)

```ts
import { createChecklist } from '@/repositories/checklist-repository';

const id = await createChecklist(db, {
  title: 'Estudos',
  color: '#2563EB',
  icon: '📘',     // opcional
});
```

---

## Padrões de navegação

- Home: `app/(tabs)/index.tsx`
- Detalhe: `app/checklist/[id].tsx` — validar `parseInt(id)` com fallback
- Config: `app/config.tsx`
- Criar: `app/(tabs)/nova.tsx`
- Usar `router.push()` / `router.back()`

---

## O que NÃO fazer

- Não criar feature de Planner Diário com seções fixas — foi descontinuado
- Não expandir ou recriar `daily_planners` / `planner_items`
- Não criar variações de `Button` — usar as 4 variantes existentes
- Não criar novo Provider sem necessidade clara
- Não adicionar lib nativa sem verificar compatibilidade com EAS Build
- Não usar `ScrollView` para listas longas — usar `FlatList`
- Não colocar SQL em componentes ou telas
- Não usar hex solto em estilos — `Colors[resolved]` sempre
- Não acumular blank lines duplos em arquivos TypeScript
