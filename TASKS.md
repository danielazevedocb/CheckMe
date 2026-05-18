# TASKS — CheckMe v1.1

Tarefas de implementação organizadas por prioridade e dependência. Cada task é independente dentro do seu grupo.

---

## Como usar este arquivo

- Marcar tarefa concluída: `[ ]` → `[x]`
- Cada task tem: descrição, arquivos afetados, critério de aceite
- Ordem dentro de cada grupo importa (dependências)

---

## Grupo A — Melhorias nas Checklists (Quick Wins)

### A1 — Memoização de componentes de lista
**Prioridade**: Alta (impacta performance imediatamente)  
**Esforço**: Pequeno (~1h)

- [x] Envolver `ChecklistCard` em `React.memo`
- [x] Envolver `ChecklistItemRow` em `React.memo`
- [x] Garantir que handlers passados como props usem `useCallback` nos componentes pai
- [x] Verificar que `keyExtractor` retorna string estável em todas as FlatLists

**Arquivos**: `components/checklist/checklist-card.tsx`, `components/checklist/checklist-item-row.tsx`, `app/(tabs)/abertas.tsx`, `app/(tabs)/concluidas.tsx`

**Critério de aceite**: Re-render de um item ao marcar outro como feito não re-renderiza toda a lista.

---

### A2 — Feedback háptico ao marcar item feito
**Prioridade**: Alta (melhora percepção de qualidade)  
**Esforço**: Pequeno (~30min)

- [x] Importar `Haptics` de `expo-haptics` em `ChecklistItemRow`
- [x] Chamar `Haptics.impactAsync(ImpactFeedbackStyle.Light)` no toggle done/undone
- [x] Chamar `Haptics.notificationAsync(NotificationFeedbackType.Success)` quando `completedItems === totalItems` após toggle
- [x] Lógica de 100% deve vir do hook/callback do pai, não recalcular no componente

**Arquivos**: `components/checklist/checklist-item-row.tsx`, `app/checklist/[id].tsx`

**Critério de aceite**: Vibração leve ao marcar/desmarcar; vibração de sucesso ao completar 100%.

---

### A3 — Skeleton loading nas listas
**Prioridade**: Média  
**Esforço**: Médio (~2h)

- [x] Criar componente `components/ui/skeleton.tsx` com animação de pulso (Reanimated)
- [x] Criar `components/checklist/checklist-card-skeleton.tsx` que imita a estrutura do `ChecklistCard`
- [x] Substituir o indicador de loading em `abertas.tsx` por 3 `ChecklistCardSkeleton` em sequência
- [x] Fazer o mesmo em `concluidas.tsx`
- [x] Respeitar `prefers-reduced-motion` (sem animação se sistema pedir)

**Arquivos**: `components/ui/skeleton.tsx` (novo), `components/checklist/checklist-card-skeleton.tsx` (novo), `app/(tabs)/abertas.tsx`, `app/(tabs)/concluidas.tsx`

**Critério de aceite**: Ao entrar nas abas, 3 cards placeholder aparecem antes dos dados reais, sem pulo de layout.

---

### A4 — Drag & drop para reordenar itens
**Prioridade**: Média  
**Esforço**: Médio (~3h)

- [ ] Ativar `DraggableFlatList` no lugar da `FlatList` em `app/checklist/[id].tsx`
- [ ] Adicionar handle visual (ícone `reorder-three-outline`) à direita de cada `ChecklistItemRow`
- [ ] Handle só visível quando não há item sendo editado
- [ ] Chamar `reorderItems(db, checklistId, newOrder)` no `onDragEnd`
- [ ] Chamar `refresh()` após reordenação para sincronizar estado
- [ ] Garantir que drag está desabilitado em checklists no modo texto

**Arquivos**: `app/checklist/[id].tsx`, `components/checklist/checklist-item-row.tsx`

**Critério de aceite**: Arrastar item muda sua posição; após soltar, ordem persiste ao fechar e reabrir a tela.

---

### A5 — Swipe to delete em itens
**Prioridade**: Baixa  
**Esforço**: Médio (~2h)

- [ ] Usar `Swipeable` do `react-native-gesture-handler` em `ChecklistItemRow`
- [ ] Swipe para esquerda revela botão "Excluir" com fundo vermelho (`destructive` do tema)
- [ ] Botão confirma e chama `deleteItem()` sem modal de confirmação (swipe já é intencional)
- [ ] Fechar swipe automaticamente se usuário abre outro item
- [ ] Garantir que swipe e drag & drop (A4) coexistam sem conflito (desativar swipe durante drag)

**Arquivos**: `components/checklist/checklist-item-row.tsx`

**Critério de aceite**: Swipe para esquerda exibe botão vermelho; toque no botão remove item da lista em tempo real.

---

### A6 — Campo de busca sticky com debounce
**Prioridade**: Baixa  
**Esforço**: Pequeno (~1h)

- [ ] Mover `SearchBar` para fora da `FlatList` (antes do `ListHeaderComponent`) para ficar sticky
- [ ] Adicionar debounce de 300ms no `setSearchTerm` usando `useCallback` + `setTimeout`/`useEffect`
- [ ] Garantir que a barra não suma durante scroll da lista

**Arquivos**: `app/(tabs)/abertas.tsx`, `app/(tabs)/concluidas.tsx`, `hooks/use-checklists.ts`

**Critério de aceite**: Campo de busca permanece visível durante scroll; query não dispara a cada tecla.

---

## Grupo B — Planner Diário (Feature Nova)

As tasks deste grupo têm dependências sequenciais. Implementar na ordem indicada.

---

### B1 — Tipos TypeScript do Planner
**Prioridade**: Bloqueante para B2+  
**Esforço**: Pequeno (~30min)

- [x] Criar `types/planner.ts` com:
  ```ts
  type PlannerSection = 'main' | 'priorities' | 'tomorrow' | 'dont_forget';

  interface DailyPlanner {
    id: number;
    date: number;        // startOfDay timestamp
    note: string | null;
    createdAt: number;
  }

  interface PlannerItem {
    id: number;
    plannerId: number;
    section: PlannerSection;
    name: string;
    done: boolean;
    position: number;
  }

  interface DailyPlannerWithItems extends DailyPlanner {
    items: PlannerItem[];
  }

  const SECTION_LIMITS: Record<PlannerSection, number | null> = {
    priorities: 3,
    main: null,
    tomorrow: 5,
    dont_forget: 5,
  };

  const SECTION_LABELS: Record<PlannerSection, string> = {
    priorities: 'Prioridades',
    main: 'Lista do Dia',
    tomorrow: 'Para Amanhã',
    dont_forget: 'Não Esquecer',
  };
  ```

**Arquivos**: `types/planner.ts` (novo)

**Critério de aceite**: Arquivo compila sem erros; tipos exportados corretamente.

---

### B2 — Migration do banco de dados
**Prioridade**: Bloqueante para B3+  
**Esforço**: Pequeno (~30min)

- [x] Adicionar nova migration em `lib/database.ts`:
  ```sql
  CREATE TABLE IF NOT EXISTS daily_planners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date INTEGER NOT NULL UNIQUE,
    note TEXT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS planner_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    planner_id INTEGER NOT NULL REFERENCES daily_planners(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    name TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_planner_items_planner_id
    ON planner_items(planner_id);
  ```
- [x] Verificar que `PRAGMA foreign_keys = ON` já está ativo (está — só confirmar)
- [x] Incrementar número da versão da migration

**Arquivos**: `lib/database.ts`

**Critério de aceite**: App abre sem erro; tabelas `daily_planners` e `planner_items` existem no banco.

---

### B3 — Repository do Planner
**Prioridade**: Bloqueante para B4+  
**Esforço**: Médio (~2h)

- [x] Criar `repositories/planner-repository.ts` com as funções:
  - `getOrCreatePlannerForDate(db, date): DailyPlanner` — busca ou cria (INSERT OR IGNORE + SELECT)
  - `getPlannerWithItems(db, plannerId): DailyPlannerWithItems | null`
  - `updatePlannerNote(db, plannerId, note)`
  - `createPlannerItem(db, { plannerId, section, name }): number` — valida limite da seção
  - `setPlannerItemDone(db, itemId, done)`
  - `updatePlannerItem(db, itemId, name)`
  - `deletePlannerItem(db, itemId)`
  - `reorderPlannerItems(db, plannerId, section, orderedIds)` — igual ao de checklist
  - `listPlannerDates(db): number[]` — datas com planner salvo, desc

**Arquivos**: `repositories/planner-repository.ts` (novo)

**Critério de aceite**: Todas as funções executam sem erro em runtime; limites de seção respeitados (erro ou silent ignore ao exceder).

---

### B4 — Hook useDailyPlanner
**Prioridade**: Bloqueante para B5+  
**Esforço**: Médio (~1.5h)

- [x] Criar `hooks/use-daily-planner.ts`:
  ```ts
  export function useDailyPlanner(date: number) {
    // date = startOfDay(Date.now()) para "hoje"
    const db = useDatabase();
    const [planner, setPlanner] = useState<DailyPlannerWithItems | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    // load: getOrCreatePlannerForDate → getPlannerWithItems
    // useFocusEffect para refetch
    return { planner, loading, error, refresh };
  }
  ```
- [x] Funções de mutação expostas via retorno do hook (ou hooks auxiliares separados):
  - `addItem(section, name)`
  - `toggleItem(itemId, done)`
  - `removeItem(itemId)`
  - `updateNote(note)` — com debounce interno de 800ms

**Arquivos**: `hooks/use-daily-planner.ts` (novo)

**Critério de aceite**: Hook carrega planner do dia, cria se não existir, expõe dados e mutações tipados.

---

### B5 — Componentes do Planner
**Prioridade**: Bloqueante para B6  
**Esforço**: Grande (~4h)

#### B5a — PlannerItemRow
- [ ] Criar `components/planner/planner-item-row.tsx`
- [ ] Props: `item: PlannerItem`, `onToggle`, `onDelete`, `onEdit`
- [ ] Checkbox + nome com strikethrough se done
- [ ] Sem preço/quantidade (planner não tem)
- [ ] Feedback háptico no toggle (igual A2)
- [ ] Touch target mínimo 44px

#### B5b — PlannerSection
- [ ] Criar `components/planner/planner-section.tsx`
- [ ] Props: `section: PlannerSection`, `items: PlannerItem[]`, `onAdd`, `onToggle`, `onDelete`
- [ ] Header da seção: label + badge de progresso (ex.: "2/3")
- [ ] Se seção tem limite, exibir badge cinza quando no limite e desabilitar campo de adição
- [ ] FlatList de `PlannerItemRow` dentro da seção
- [ ] Campo de adição rápida no rodapé da seção (TextField + botão "+" ou Enter)

#### B5c — PlannerNote
- [ ] Criar `components/planner/planner-note.tsx`
- [ ] TextInput multiline para anotações livres
- [ ] Salvo automaticamente (debounce 800ms) via `onChangeText` → `updateNote`
- [ ] Indicador visual sutil "Salvo" após persistir

**Arquivos**: `components/planner/planner-item-row.tsx` (novo), `components/planner/planner-section.tsx` (novo), `components/planner/planner-note.tsx` (novo)

**Critério de aceite**: Componentes renderizam sem erro; interações de toggle e adição funcionam com dados mockados.

---

### B6 — Tela principal: Aba "Hoje"
**Prioridade**: Alta (entrega visível da feature)  
**Esforço**: Grande (~4h)

- [ ] Criar `app/(tabs)/hoje.tsx`
- [ ] Usar `useDailyPlanner(startOfDay(Date.now()))`
- [ ] Layout em `ScrollView` (não FlatList — seções têm altura variável):
  1. Header: "Hoje • 18 de maio de 2026" + barra de progresso geral
  2. Seção Prioridades (`PlannerSection`)
  3. Seção Lista do Dia (`PlannerSection`)
  4. Seção Para Amanhã (`PlannerSection`)
  5. Seção Não Esquecer (`PlannerSection`)
  6. Seção Anotações (`PlannerNote`)
- [ ] Estados: loading (skeleton), error (mensagem + retry), empty (planner vazio criado com seções vazias)
- [ ] Skeleton: placeholders de seção durante loading inicial
- [ ] Atualizar `app/(tabs)/_layout.tsx` para incluir a nova aba com ícone `today-outline`

**Arquivos**: `app/(tabs)/hoje.tsx` (novo), `app/(tabs)/_layout.tsx`

**Critério de aceite**: Aba "Hoje" aparece no menu; planner do dia carrega (ou é criado); é possível adicionar e marcar itens em todas as seções.

---

### B7 — Progresso do dia no header
**Prioridade**: Média  
**Esforço**: Pequeno (~1h)

- [ ] Calcular `completedMain + completedPriorities` / `totalMain + totalPriorities`
- [ ] Exibir barra de progresso horizontal no header da tela "Hoje"
- [ ] Barra usa a cor `primary` do tema
- [ ] Texto: "X de Y tarefas concluídas"
- [ ] Animação suave da barra ao marcar item (Reanimated `withTiming`)

**Arquivos**: `app/(tabs)/hoje.tsx`

**Critério de aceite**: Barra atualiza em tempo real ao marcar/desmarcar itens.

---

### B8 — Histórico de planners
**Prioridade**: Baixa (v1.2 pode entrar)  
**Esforço**: Médio (~2h)

- [ ] Criar `app/planner/[date].tsx` — tela de planner de um dia específico
- [ ] Carregar com `useDailyPlanner(parsedDate)` onde `parsedDate` vem do param
- [ ] Modo leitura/edição igual à tela principal (sem restrição de data)
- [ ] Botão no header de "Hoje" → lista de datas disponíveis → navega para `/planner/[date]`
- [ ] Criar `components/planner/planner-history-list.tsx` — lista de dias com progresso

**Arquivos**: `app/planner/[date].tsx` (novo), `components/planner/planner-history-list.tsx` (novo)

**Critério de aceite**: Navegar para um dia anterior mostra o planner daquele dia com seus itens.

---

## Grupo C — Qualidade e Polimento

### C1 — Revisar acessibilidade do Planner
**Prioridade**: Média  
**Esforço**: Pequeno (~1h)

- [ ] `accessibilityRole="button"` em todos os checkboxes do Planner
- [ ] `accessibilityLabel` descritivo: "Marcar [nome do item] como concluído"
- [ ] `accessibilityState={{ checked: done }}` nos checkboxes
- [ ] `accessibilityRole="header"` nos títulos de seção
- [ ] Touch targets ≥ 44px em todos os elementos interativos

**Arquivos**: `components/planner/planner-item-row.tsx`, `components/planner/planner-section.tsx`

---

### C2 — Validação e edge cases do Planner
**Prioridade**: Média  
**Esforço**: Pequeno (~1h)

- [ ] Impedir adição de item vazio (validar `name.trim()` antes de chamar `addItem`)
- [ ] Exibir mensagem quando seção está no limite: "Limite de X itens atingido"
- [ ] Ao excluir item, remover imediatamente da UI (optimistic update) e reverter em erro
- [ ] Testar abertura do app sem nenhum planner criado ainda

---

### C3 — Consistência visual entre Checklist e Planner
**Prioridade**: Baixa  
**Esforço**: Pequeno (~1h)

- [ ] Verificar que `PlannerItemRow` e `ChecklistItemRow` têm altura e padding consistentes
- [ ] Verificar que fontes, cores de texto e ícones seguem os mesmos tokens do tema
- [ ] Verificar que estados de loading/error/empty têm aparência coerente nas duas features

---

## Ordem de implementação recomendada

```
Semana 1:
  A1 (memoização) → A2 (háptico) → A3 (skeleton)
  B1 (tipos) → B2 (migration) → B3 (repository)

Semana 2:
  B4 (hook) → B5a (PlannerItemRow) → B5b (PlannerSection) → B5c (PlannerNote)
  A4 (drag & drop)

Semana 3:
  B6 (tela Hoje) → B7 (progresso) → C1 (a11y) → C2 (edge cases)

Semana 4:
  A5 (swipe to delete) → A6 (busca sticky) → C3 (consistência visual) → B8 (histórico)
```

---

## Checklist de entrega da v1.1

- [ ] Todos os itens do Grupo A (A1–A6) concluídos
- [ ] Todos os itens B1–B7 do Planner Diário concluídos
- [ ] C1 e C2 concluídos
- [ ] App compila sem erros TypeScript (`tsc --noEmit`)
- [ ] App roda no Android sem crashes nos fluxos principais
- [ ] PRD.md e CLAUDE.md atualizados se houver mudanças de escopo
