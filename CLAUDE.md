# CLAUDE.md — CheckMe (Projeto)

Instruções específicas do projeto CheckMe. Complementam as regras globais em `~/.claude/CLAUDE.md`.

---

## Identidade do projeto

**CheckMe** é um app mobile offline-first (Expo + React Native + TypeScript) para gerenciar checklists e planejamento diário. Sem backend, sem conta, sem nuvem — SQLite local é a única fonte de dados.

---

## Arquitetura — camadas existentes

```
app/              ← rotas Expo Router (só composição, sem lógica)
components/
  ui/             ← primitivos (Button, TextField, SearchBar, FAB, EmptyState)
  checklist/      ← componentes do domínio checklist
  planner/        ← componentes do domínio planner
contexts/         ← DatabaseContext, ThemeContext
hooks/            ← useChecklists, useChecklist, useDailyPlanner
lib/              ← database.ts (abertura SQLite + migrations)
repositories/     ← checklist-repository.ts, item-repository.ts, planner-repository.ts
types/            ← checklist.ts, planner.ts
utils/            ← color.ts, format.ts
constants/        ← checklist-colors.ts, theme.ts
```

**Regra de ouro**: lógica de negócio fica em `repositories/` e `hooks/`. Componentes são visuais. Telas em `app/` só compõem.

---

## Padrões de banco de dados

- Usar sempre a instância do `useDatabase()` (vem do `DatabaseContext`)
- Toda operação de escrita vai para um arquivo em `repositories/`
- Migrations ficam em `lib/database.ts` — adicionar nova migration no array existente, nunca alterar migrations existentes
- Foreign keys sempre com `ON DELETE CASCADE`
- `PRAGMA foreign_keys = ON` já está ativo globalmente

### Adicionar migration nova

```ts
// lib/database.ts — adicionar ao array de migrations
{ version: N, up: (db) => { db.execSync('ALTER TABLE ...'); } }
```

---

## Padrões de hooks de dados

Seguir o padrão dos hooks existentes:

```ts
// hooks/use-checklist.ts — referência de padrão
export function useChecklist(id: number) {
  const db = useDatabase();
  const [checklist, setChecklist] = useState<ChecklistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => { ... }, [db, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { checklist, loading, error, refresh: load };
}
```

Sempre retornar `{ data, loading, error, refresh }`.  
Sempre usar `useFocusEffect` para refetch ao entrar na tela.

---

## Padrões de componentes

### Componentes UI existentes — usar, não duplicar

| Componente | Arquivo | Uso |
|---|---|---|
| `Button` | `components/ui/button.tsx` | Variantes: `primary`, `secondary`, `ghost`, `danger` |
| `TextField` | `components/ui/text-field.tsx` | Inputs com label e helperText |
| `SearchBar` | `components/ui/search-bar.tsx` | Busca com ícone |
| `FAB` | `components/ui/fab.tsx` | Floating action button |
| `EmptyState` | `components/ui/empty-state.tsx` | Estado vazio com CTA |
| `ThemedText` | `components/themed-text.tsx` | Texto que respeita tema |
| `ThemedView` | `components/themed-view.tsx` | View que respeita tema |

### Tokens de tema — usar sempre via `useThemeColor` ou constante

```ts
import { THEME } from '@/constants/theme';
// THEME.light.primary, THEME.dark.surface, etc.
```

Nunca usar valores hex soltos em estilos — sempre buscar do tema.

### Cores de checklist

8 cores fixas em `constants/checklist-colors.ts`. Para calcular contraste de texto sobre cor: `getReadableTextColor()` de `utils/color.ts`.

---

## Padrões de navegação

- Grupos de tabs em `app/(tabs)/`
- Rota dinâmica: `app/checklist/[id].tsx`, `app/planner/[date].tsx`
- Configurações: `app/config.tsx`
- Usar `router.back()` para voltar, `router.push()` para navegar com estado
- Validar params de rota antes de usar (ex.: `parseInt(id)` com fallback)

---

## Sistema de temas

- `ThemeContext` fornece `useThemeMode()` → `{ mode, resolved, setMode }`
- `resolved` é sempre `'light'` ou `'dark'` (nunca `'system'`)
- Persistência em `AsyncStorage` com chave `@checkme:theme-mode`
- Ao criar nova tela, usar `useThemeMode()` e consumir `THEME[resolved]`

---

## Feature: Planner Diário (nova — v1.1)

### Conceito

Um planejador diário inspirado em planner físico. Cada dia tem:
- **Lista principal** (`main`): checklist livre do dia
- **Prioridades** (`priorities`): até 3 itens com checkbox
- **Para Amanhã** (`tomorrow`): até 5 itens com checkbox
- **Não Esquecer** (`dont_forget`): até 5 itens com checkbox
- **Anotações** (`note`): texto livre

### Modelo de dados

```sql
daily_planners
  id         INTEGER PK AUTOINCREMENT
  date       INTEGER NOT NULL UNIQUE  -- startOfDay(timestamp)
  note       TEXT NULL
  created_at INTEGER NOT NULL

planner_items
  id         INTEGER PK AUTOINCREMENT
  planner_id INTEGER FK → daily_planners(id) ON DELETE CASCADE
  section    TEXT NOT NULL  -- 'main' | 'priorities' | 'tomorrow' | 'dont_forget'
  name       TEXT NOT NULL
  done       INTEGER DEFAULT 0
  position   INTEGER DEFAULT 0
```

### Arquivos principais

```
types/planner.ts
repositories/planner-repository.ts
hooks/use-daily-planner.ts
components/planner/planner-section.tsx
components/planner/planner-item-row.tsx
components/planner/planner-day-view.tsx
components/planner/planner-note.tsx
components/planner/planner-history-list.tsx
app/(tabs)/hoje.tsx
app/planner/[date].tsx
```

### Limites de seção

| Seção | Máx. itens | Checkbox |
|---|---|---|
| main | ilimitado | sim |
| priorities | 3 | sim |
| tomorrow | 5 | sim |
| dont_forget | 5 | sim |

### Comportamento de data

- Ao abrir a aba "Hoje", carrega ou cria o planner para `startOfDay(Date.now())`
- Dias anteriores ficam em histórico acessível por `/planner/[date]`
- A aba principal sempre mostra o dia atual

---

## Melhorias v1.1 (concluídas)

1. **Drag & drop** — checklists em `app/checklist/[id].tsx`; planner por seção em `components/planner/planner-section.tsx`
2. **Memoização** — `React.memo` em `ChecklistItemRow` e `ChecklistCard` (e `PlannerItemRow`)
3. **Skeleton loading** — `ChecklistCardSkeleton` nas abas de listas
4. **Feedback háptico** — `expo-haptics` ao marcar item em checklist e planner
5. **Swipe to delete** — `Swipeable` em `ChecklistItemRow`
6. **Busca sticky com debounce** — abas Abertas/Concluídas
7. **Histórico do planner** — modal em Hoje + rota `/planner/[date]`

---

## Convenções de código

- Nomes de arquivos: `kebab-case.tsx`
- Nomes de componentes: `PascalCase`
- Nomes de hooks: `useCamelCase`
- Props com tipos explícitos (sem `any`)
- Estilos: `StyleSheet.create()` no final do arquivo, nomeados de forma descritiva
- Imports: caminho absoluto com `@/` quando disponível

---

## O que NÃO fazer

- Não criar variações de `Button` — usar as 4 variantes existentes (`primary`, `secondary`, `ghost`, `danger`)
- Não criar novo provider sem discussão — já temos `DatabaseContext` e `ThemeContext`
- Não adicionar lib nativa sem verificar compatibilidade com EAS Build
- Não usar `ScrollView` com muitos itens — preferir `FlatList`
- Não colocar lógica de banco diretamente em componentes ou telas
- Não usar valores de cor hex soltos — sempre via tema ou `checklist-colors.ts`
