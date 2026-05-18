# TASKS — CheckMe v2.0

Tarefas de implementação da visão **múltiplas checklists + tarefas com prioridade individual**. O Planner Diário (seções Prioridades / Para Amanhã / Não Esquecer) está **descontinuado** — ver Grupo L (remoção).

**Referência de produto:** `PRD.md` · **Guia para agentes:** `CLAUDE.md`

---

## Como usar este arquivo

- Marcar concluída: `[ ]` → `[x]`
- Cada task: descrição, arquivos, critério de aceite
- Ordem dentro do grupo importa (dependências)
- **Legado v1.1:** Grupo A e Grupo B (planner) descrevem o que já foi entregue; v2.0 reaproveita UX do Grupo A e remove o Grupo B

---

## Estado do código (baseline)

| Área | Situação |
|---|---|
| Tipos `Task` / `TaskPriority` | Sim — `types/checklist.ts` com mappers e aliases legados |
| Colunas `priority`, `description`, `created_at` | Sim — migration v3 em `lib/database.ts` |
| Coluna `icon` em checklists | Sim — migration v4 |
| Limpeza planner + colunas legadas | Sim — migration v5 |
| `TaskItem`, `PriorityBadge`, `ProgressBar` | Sim — `components/checklist/*`; `ChecklistItemRow` reexporta `TaskItem` |
| Home v2.0 (lista única + % + ícone) | Sim — `app/(tabs)/index.tsx` com chips Todas / Em aberto / Concluídas |
| Planner (`hoje`, `planner/[date]`) | Removido (Grupo L) |
| UX v1.1 (háptico, skeleton, swipe, drag, busca) | **Implementado** em `TaskItem` / `abertas` |

---

## Grupo V1 — Modelo de dados e migrations

### V1.1 — Tipos TypeScript v2.0
**Prioridade**: Bloqueante  
**Esforço**: Pequeno (~1h)

- [x] Adicionar em `types/checklist.ts` (ou `types/task.ts`):
  - `TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'`
  - `Task` com `id`, `checklistId`, `title`, `description?`, `priority`, `completed`, `position`, `createdAt`
  - `Checklist` v2: `icon?` opcional; remover ou marcar deprecated `mode`, `scheduledFor`, `price`/`quantity` em itens
- [x] Mappers DB ↔ domínio: `name` → `title`, `done` → `completed`
- [x] Manter aliases temporários `ChecklistItem` → `Task` se necessário para migração incremental

**Arquivos**: `types/checklist.ts`

**Critério de aceite**: `tsc --noEmit` sem erros; repositórios passam a usar `Task`.

---

### V1.2 — Migration SQLite: prioridade e metadados de tarefa
**Prioridade**: Bloqueante  
**Esforço**: Pequeno (~1h)

- [x] Nova migration em `lib/database.ts` (incrementar `DATABASE_SCHEMA_VERSION` → **3**):
  ```sql
  ALTER TABLE checklist_items ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM';
  ALTER TABLE checklist_items ADD COLUMN description TEXT NULL;
  ALTER TABLE checklist_items ADD COLUMN created_at INTEGER;
  ```
- [x] Backfill `created_at` para itens existentes (ex.: `Date.now()` ou data da checklist)
- [x] Validar `PRAGMA foreign_keys = ON`

**Arquivos**: `lib/database.ts`

**Critério de aceite**: App abre sem erro; itens legados têm `priority = MEDIUM`.

---

### V1.3 — Migration opcional: ícone na checklist
**Prioridade**: Baixa  
**Esforço**: Pequeno (~30min)

- [x] `ALTER TABLE checklists ADD COLUMN icon TEXT NULL;`
- [x] Atualizar `checklist-repository` create/update

**Arquivos**: `lib/database.ts`, `repositories/checklist-repository.ts`

---

### V1.4 — Repositories e hooks
**Prioridade**: Alta  
**Esforço**: Médio (~3h)

- [x] `item-repository.ts`: CRUD com `title`, `description`, `priority`; remover ou deprecar `price`/`quantity` nos fluxos v2
- [x] Funções `listTasksByChecklist` ordenadas por prioridade (HIGH → MEDIUM → LOW) e `position`
- [x] Filtro por prioridade no repository ou hook
- [x] `use-checklist.ts` / `use-checklists.ts`: expor `Task`, progresso % (sem totais monetários na home v2)

**Arquivos**: `repositories/item-repository.ts`, `repositories/checklist-repository.ts`, `hooks/use-checklist.ts`, `hooks/use-checklists.ts`

**Critério de aceite**: Criar tarefa com prioridade persiste e recarrega corretamente.

---

### V1.5 — Migration de limpeza (após estabilizar v2)
**Prioridade**: Baixa  
**Esforço**: Médio

- [x] Drop `daily_planners`, `planner_items` (ver Grupo L)
- [x] Remover colunas legadas se aprovado: `checklists.mode`, `scheduled_for`, `checklist_items.price`, `quantity`, `color` (item)

**Arquivos**: `lib/database.ts`

---

## Grupo V2 — Componentes v2.0

### V2.1 — Tokens de prioridade e dark-first
**Prioridade**: Alta  
**Esforço**: Pequeno (~1h)

- [x] Adicionar em `constants/theme.ts`: `priorityHigh`, `priorityMedium`, `priorityLow` (light + dark)
- [x] `ThemeContext`: primeira instalação → preferir `dark` (AsyncStorage vazio)

**Arquivos**: `constants/theme.ts`, `contexts/theme-context.tsx`

---

### V2.2 — PriorityBadge
**Prioridade**: Alta  
**Esforço**: Pequeno (~1h)

- [x] Criar `components/checklist/priority-badge.tsx`
- [x] Props: `priority: TaskPriority`; pill com cor do token; label acessível (Alta / Média / Baixa)

**Critério de aceite**: Três variantes visuais distintas; contraste adequado em dark mode.

---

### V2.3 — ProgressBar
**Prioridade**: Alta  
**Esforço**: Pequeno (~1h)

- [x] Criar `components/checklist/progress-bar.tsx`
- [x] Props: `completed`, `total` ou `percent`; barra horizontal minimalista
- [x] Usar em `ChecklistCard` e header de `app/checklist/[id].tsx`

---

### V2.4 — TaskItem
**Prioridade**: Alta  
**Esforço**: Médio (~3h)

- [x] Criar `components/checklist/task-item.tsx` (evoluir de `checklist-item-row.tsx`)
- [x] Checkbox, título, descrição truncada, `PriorityBadge`
- [x] Reaproveitar: háptico (A2), swipe delete (A5), handle drag (A4)
- [x] Sem UI de preço/quantidade

**Arquivos**: `components/checklist/task-item.tsx`, deprecar `checklist-item-row.tsx` quando migrado

---

### V2.5 — ChecklistCard (home v2)
**Prioridade**: Alta  
**Esforço**: Médio (~2h)

- [x] Refatorar `checklist-card.tsx`: nome, ícone/cor opcionais, contagem de tarefas, `ProgressBar` + % (ex.: `Estudos — 70%`)
- [x] Remover pills de valor monetário (`Total`, `Somado`)
- [x] `React.memo` mantido

**Critério de aceite**: Card alinhado ao PRD §5.3; toque abre `/checklist/[id]`.

---

## Grupo V3 — Telas e navegação

### V3.1 — Home unificada
**Prioridade**: Alta  
**Esforço**: Médio (~3h)

- [x] Refatorar `app/(tabs)/index.tsx` → home única de checklists (substitui `abertas` / `concluidas`)
- [x] Lista todas as checklists com busca debounce (reaproveitar A6)
- [x] `EmptyState` + `FloatingAddButton` (`components/ui/fab.tsx`)
- [x] Skeleton (`ChecklistCardSkeleton`) no loading
- [x] Aba `concluidas` removida — filtro por chips na mesma tela (Todas / Em aberto / Concluídas)

**Arquivos**: `app/(tabs)/index.tsx`, `app/(tabs)/_layout.tsx`, `types/checklist.ts`, `repositories/checklist-repository.ts`

---

### V3.2 — Detalhe da checklist
**Prioridade**: Alta  
**Esforço**: Grande (~4h)

- [ ] `app/checklist/[id].tsx`: lista `TaskItem`, ordenação por prioridade
- [ ] Filtro por prioridade (chips ou menu: Todas / Alta / Média / Baixa)
- [ ] Criar/editar tarefa com seletor de prioridade (default MEDIUM)
- [ ] `DraggableFlatList` + `reorderItems` (adaptar A4)
- [ ] Header com `ProgressBar` da lista

---

### V3.3 — Criar/editar checklist
**Prioridade**: Média  
**Esforço**: Médio (~2h)

- [ ] `app/(tabs)/nova.tsx`: título, cor, ícone opcional; sem modo texto/compras v1
- [ ] Edição de checklist no detalhe ou modal

---

### V3.4 — Formulários de tarefa
**Prioridade**: Média  
**Esforço**: Médio (~2h)

- [ ] Campos: título, descrição opcional, prioridade
- [ ] Validação `trim()` em título

---

## Grupo V4 — UX polimento (planejado / adaptar legado)

### V4.1 — Animações de conclusão
**Prioridade**: Baixa  
**Esforço**: Médio

- [ ] Strikethrough animado ao marcar `TaskItem` (Reanimated)
- [ ] `ProgressBar` com `withTiming` ao atualizar %

---

### V4.2 — Adaptar melhorias v1.1 ao TaskItem
**Prioridade**: Média  
**Esforço**: Pequeno (revisão)

- [x] Háptico no toggle (origem A2) — **revalidar** em `TaskItem`
- [x] Swipe to delete (origem A5) — **revalidar** em `TaskItem`
- [x] Drag & drop (origem A4) — **revalidar** em detalhe v2
- [x] Memoização (origem A1) — **revalidar** em `TaskItem` / `ChecklistCard`
- [x] Skeleton home (origem A3) — **revalidar** na home v2
- [x] Busca debounce (origem A6) — **revalidar** na home v2

---

## Grupo L — Remoção do Planner Diário (legado v1.1)

> **Não expandir.** Planner com seções `priorities` / `tomorrow` / `dont_forget` foi descontinuado na v2.0.

### L1 — Remover rotas e aba
- [x] Remover `app/(tabs)/hoje.tsx` e entrada na tab bar
- [x] Remover `app/planner/[date].tsx`
- [x] Atualizar `app/(tabs)/_layout.tsx`

### L2 — Remover código
- [x] Deletar `components/planner/`
- [x] Deletar `repositories/planner-repository.ts`, `hooks/use-daily-planner.ts`, `hooks/use-planner-summaries.ts`
- [x] Deletar `types/planner.ts`

### L3 — Remover tabelas
- [x] Migration: `DROP TABLE planner_items; DROP TABLE daily_planners;`
- [x] Atualizar `resetDatabase()` se necessário

**Critério de aceite**: App compila; nenhuma referência a planner no bundle; fluxo checklist intacto.

---

## Grupo A — Melhorias v1.1 (legado entregue)

> Base UX já implementada. Na v2.0, **adaptar** para `TaskItem` / home nova — não duplicar do zero.

| Task | Status | Nota v2.0 |
|---|---|---|
| A1 Memoização | [x] | Revalidar em `TaskItem`, `ChecklistCard` |
| A2 Háptico | [x] | Mover para `TaskItem` |
| A3 Skeleton | [x] | Manter na home v2 |
| A4 Drag & drop | [x] | Manter no detalhe; desabilitar modo texto (removido) |
| A5 Swipe delete | [x] | Mover para `TaskItem` |
| A6 Busca debounce | [x] | Manter na home v2 |

Detalhes históricos (arquivos, critérios): ver histórico git do Grupo A se necessário.

---

## Grupo B — Planner Diário (legado entregue — **remover**)

> Tasks B1–B8 foram concluídas na v1.1. **Não implementar features novas.** Substituídas pelo Grupo L.

| Task | Status |
|---|---|
| B1 Tipos planner | [x] → remover com L2 |
| B2 Migration planner | [x] → revert com L3 |
| B3 Repository | [x] → remover com L2 |
| B4 Hook useDailyPlanner | [x] → remover com L2 |
| B5 Componentes planner | [x] → remover com L2 |
| B6 Aba Hoje | [x] → remover com L1 |
| B7 Progresso do dia | [x] → substituído por progresso por checklist |
| B8 Histórico | [x] → remover com L1 |

---

## Ordem de implementação recomendada (v2.0)

```
Fase 1 — Fundação
  V1.1 → V1.2 → V1.4 → V2.1

Fase 2 — UI núcleo
  V2.2 → V2.3 → V2.4 → V2.5

Fase 3 — Telas
  V3.1 → V3.2 → V3.3 → V3.4

Fase 4 — Limpeza
  L1 → L2 → L3 → V1.5 (opcional)

Fase 5 — Polimento
  V4.1 → V4.2
```

---

## Checklist de entrega v2.0

- [x] Tipos `Task` / `TaskPriority` e migration de prioridade aplicada
- [x] `PriorityBadge`, `ProgressBar`, `TaskItem`, `ChecklistCard` v2 na home
- [x] CRUD checklist + tarefa com prioridade; filtro e ordenação por prioridade
- [ ] Planner Diário removido (rotas, código, tabelas)
- [ ] Dark mode padrão na primeira instalação; tokens de prioridade no tema (tokens: [x])
- [ ] `tsc --noEmit` sem erros
- [ ] Fluxo manual: criar checklist → tarefas com prioridades → concluir → % na home atualiza
- [x] PRD.md e CLAUDE.md alinhados à visão v2.0

---

## Checklist de entrega v1.1 (arquivado)

- [x] Grupo A (A1–A6)
- [x] Grupo B (B1–B8) — **a desfazer na v2.0**
- [x] C1 e C2 (planner a11y / edge cases)
- [x] `tsc --noEmit`
- [ ] Validação manual Android *(pendente)*
