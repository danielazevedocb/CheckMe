# PRD — CheckMe

**Versão**: 2.0  
**Data**: 2026-05-18  
**Autor**: Daniel Azevedo  
**Status**: Redefinição de produto — implementação v2.0 em andamento (código ainda parcialmente em modelo v1.x; ver TASKS.md)

---

## 1. Visão Geral

CheckMe é um aplicativo mobile de **checklists com tarefas priorizadas**, focado em uso **offline-first** e totalmente local. O usuário organiza a vida em múltiplas listas (Estudos, Trabalho, Academia, Compras, Casa…) e, dentro de cada uma, gerencia tarefas com prioridade individual — sem cadastro, sem nuvem, sem internet.

A estética é **minimalista e moderna**, com **dark mode como padrão**: fundo escuro, cards discretos, bordas suaves, tipografia limpa e espaçamento confortável — inspirado em planners físicos, mas com a clareza de apps como Todoist e TickTick.

**Fora da visão atual:** o antigo “Planner Diário” com seções fixas (Prioridades, Para Amanhã, Não Esquecer) não faz mais parte do produto. Prioridade passa a ser atributo de cada **tarefa**, não de uma seção do dia.

---

## 2. Problema

Usuários precisam de uma ferramenta simples para:

1. **Separar contextos da vida** — estudo, trabalho, compras, casa — em listas distintas, sem misturar tudo numa inbox gigante.
2. **Priorizar o que importa** — saber de relance o que é urgente (alta), o que pode esperar (baixa) e o que está no meio.
3. **Acompanhar progresso** — ver quanto falta em cada lista sem abrir cada tarefa.

Apps existentes costumam exigir conta, sincronização obrigatória ou interfaces carregadas. CheckMe resolve isso com listas locais, prioridade por tarefa e UX enxuta no celular.

---

## 3. Objetivos

| Objetivo | Métrica de Sucesso |
|---|---|
| Criação rápida de checklist | < 20 segundos do zero até a primeira lista salva |
| Criação rápida de tarefa | < 10 segundos para adicionar tarefa com prioridade |
| Clareza de prioridade | Usuário identifica prioridade de qualquer tarefa em < 1s (badge de cor) |
| Progresso visível na home | Cada card de checklist exibe % de conclusão atualizado em tempo real |
| Persistência local confiável | Zero perda de dados entre sessões |
| Experiência polida | Dark-first, feedback visual/háptico, sem poluição visual |

---

## 4. Público-Alvo

- **Perfil primário**: Pessoas que organizam rotina, estudos, trabalho e compras em listas separadas e querem priorizar sem complexidade.
- **Perfil secundário**: Usuários que migraram de planner de papel ou de apps pesados e buscam algo leve e offline.
- **Plataformas**: Android (principal), iOS (suportado), Web (fallback).
- **Conectividade**: Uso predominantemente offline.

---

## 5. Modelo de Produto

### 5.1 Entidades

**Checklist** — container de tarefas com identidade visual opcional.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | number (SQLite) | sim | Identificador |
| `title` | string | sim | Nome da lista (ex.: Estudos, Trabalho) |
| `color` | string | não | Cor do card (paleta fixa do app) |
| `icon` | string | não | Ícone opcional (emoji ou nome Ionicons) |
| `createdAt` | timestamp | sim | Data de criação |

**Task (tarefa)** — item dentro de uma checklist. No domínio v2.0; no SQLite permanece a tabela `checklist_items` (coluna `name` hoje → mapear para `title` no TypeScript).

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | number | sim | Identificador |
| `checklistId` | number | sim | FK para checklist |
| `title` | string | sim | Nome da tarefa (coluna `name` no SQLite até rename opcional) |
| `description` | string | não | Detalhes opcionais |
| `priority` | `HIGH` \| `MEDIUM` \| `LOW` | sim | Prioridade individual (default: `MEDIUM`) |
| `completed` | boolean | sim | Concluída ou pendente (coluna `done`) |
| `createdAt` | timestamp | sim | Data de criação |
| `position` | number | sim | Ordem na lista (drag & drop) |

### 5.2 Prioridade visual

| Prioridade | Cor semântica | Uso na UI |
|---|---|---|
| `HIGH` | Vermelho | Badge ao lado da linha da tarefa |
| `MEDIUM` | Amarelo | Badge ao lado da linha da tarefa |
| `LOW` | Azul / cinza | Badge ao lado da linha da tarefa |

Cores via tokens em `constants/theme.ts` (`Colors.dark.priorityHigh`, etc.) — nunca hex solto em componentes.

### 5.3 Tela principal (Home)

Lista de checklists. Cada card exibe:

- Nome da checklist
- Contagem de tarefas (ex.: `12 tarefas`)
- Progresso em % (tarefas concluídas / total)
- Cor e ícone opcionais

**Exemplo de exibição:**

```
📘 Estudos — 70%
💼 Trabalho — 45%
🏋️ Academia — 20%
🛒 Compras — 0%
```

Ações: tocar no card abre a checklist; FAB cria nova checklist.

### 5.4 Tela de checklist (detalhe)

- Lista de tarefas com `TaskItem` + `PriorityBadge`
- Ordenação por prioridade (alta → média → baixa) e filtro por prioridade
- Marcar concluída, editar, excluir, alterar prioridade
- Barra de progresso da lista (`ProgressBar`)
- FAB ou campo inline para nova tarefa

---

## 6. Requisitos Funcionais

### 6.1 Checklists

| ID | Requisito |
|---|---|
| C1 | Criar checklist com título; cor e ícone opcionais |
| C2 | Editar título, cor e ícone |
| C3 | Excluir checklist com confirmação (cascade nas tarefas) |
| C4 | Listar todas as checklists na tela principal |
| C5 | Exibir em cada card: nome, contagem de tarefas, % de progresso |

### 6.2 Tarefas

| ID | Requisito |
|---|---|
| T1 | Criar tarefa com título; descrição e prioridade opcionais (default `MEDIUM`) |
| T2 | Editar título, descrição e prioridade |
| T3 | Marcar tarefa como concluída / reabrir |
| T4 | Excluir tarefa |
| T5 | Alterar prioridade (HIGH / MEDIUM / LOW) |
| T6 | Ordenar lista por prioridade (HIGH primeiro) |
| T7 | Filtrar tarefas por prioridade |
| T8 | Persistir ordem manual (position) via drag & drop |

### 6.3 Navegação e configurações

| ID | Requisito |
|---|---|
| N1 | Home = lista de checklists |
| N2 | Rota `/checklist/[id]` para detalhe |
| N3 | Tela de configurações: tema (dark padrão, light opcional), reset de banco |
| N4 | Busca por nome de checklist na home (debounce) |

### 6.4 UX mobile

| ID | Requisito | Estado |
|---|---|---|
| U1 | Swipe para excluir tarefa | **Base v1.1** em `ChecklistItemRow` — adaptar para `TaskItem` v2.0 |
| U2 | Drag & drop para reordenar tarefas | **Base v1.1** — adaptar após modelo Task |
| U3 | Animações suaves de conclusão (strikethrough, progresso) | **Planejado** v2.0 |
| U4 | Feedback háptico ao concluir tarefa | **Base v1.1** — manter em `TaskItem` |
| U5 | Skeleton na home durante loading | **Base v1.1** — manter na home v2.0 |

---

## 7. Modelo de Dados (SQLite)

### 7.1 Estado alvo (v2.0)

```sql
checklists
  id            INTEGER PK AUTOINCREMENT
  title         TEXT NOT NULL
  color         TEXT NULL          -- hex da paleta
  icon          TEXT NULL          -- emoji ou identificador de ícone
  created_at    INTEGER NOT NULL

checklist_items   -- evolução: "tasks" no domínio
  id            INTEGER PK AUTOINCREMENT
  checklist_id  INTEGER FK → checklists(id) ON DELETE CASCADE
  title         TEXT NOT NULL      -- era "name"; migration renomeia ou mapeia
  description   TEXT NULL
  priority      TEXT NOT NULL DEFAULT 'MEDIUM'  -- 'HIGH' | 'MEDIUM' | 'LOW'
  done          INTEGER NOT NULL DEFAULT 0
  position      INTEGER NOT NULL DEFAULT 0
  created_at    INTEGER NOT NULL
```

> **Nota de migração:** campos legados (`mode`, `scheduled_for`, `price`, `quantity` em itens) podem ser removidos ou mantidos como deprecated até migration de limpeza — ver TASKS.md.

### 7.2 Legado — fora do escopo v2.0

Tabelas do Planner Diário (`daily_planners`, `planner_items` com seções `priorities` / `tomorrow` / `dont_forget`) devem ser **removidas** após migração de dados relevantes (se houver) ou drop direto. Não documentar como feature ativa.

---

## 8. Arquitetura Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo |
| Linguagem | TypeScript |
| Navegação | Expo Router (file-based) |
| Banco de dados | Expo SQLite (local, migrations automáticas) |
| Persistência auxiliar | AsyncStorage (tema) |
| Animações | React Native Reanimated |
| Gestos | React Native Gesture Handler |
| Ícones | Expo Vector Icons (Ionicons) |
| Build | EAS Build |

**Padrão de código:** lógica em `repositories/` e `hooks/`; telas em `app/` só compõem; componentes visuais em `components/`.

---

## 9. Componentes de UI (first-class)

| Componente | Responsabilidade |
|---|---|
| `ChecklistCard` | Card na home: nome, ícone, cor, contagem, `ProgressBar` |
| `TaskItem` | Linha de tarefa: checkbox, título, descrição truncada, `PriorityBadge` |
| `PriorityBadge` | Pill colorida por prioridade (HIGH / MEDIUM / LOW) |
| `ProgressBar` | Barra horizontal de % de conclusão |
| `FloatingAddButton` | FAB global — mapeia para `components/ui/fab.tsx` |

Primitivos existentes: `Button`, `TextField`, `SearchBar`, `EmptyState`, `ThemedText`, `ThemedView`.

---

## 10. Design e UX

### 10.1 Princípios

- **Mobile-first** — layouts e touch targets pensados para polegar.
- **Dark-first** — tema escuro como padrão na primeira abertura; light disponível nas configurações.
- **Minimalismo** — poucos divisores; hierarquia por espaçamento e tipografia, não por bordas excessivas.
- **Sem clutter** — um CTA primário por contexto; cards com borda suave ou elevação mínima.
- **Velocidade** — criar checklist ou tarefa em poucos toques.

### 10.2 Tokens e tema

Usar `Colors` de `constants/theme.ts` e `useThemeMode()`. Paleta dark-first:

- Fundo: `background` escuro
- Superfície de card: `surface` com contraste sutil
- Texto: `text` / `textMuted`
- Prioridades: tokens semânticos (`priorityHigh`, `priorityMedium`, `priorityLow`) — **a adicionar** em v2.0
- **Hoje:** tema padrão ainda é `system` no `ThemeContext`; v2.0 deve preferir `dark` na primeira instalação

### 10.3 Paleta de cores das checklists

8 cores fixas em `constants/checklist-colors.ts` (inalterado no conceito).

---

## 11. Fluxos Principais

### 11.1 Primeiro uso

```
Abre app (dark) → Home vazia → EmptyState + FAB
  → Cria checklist "Estudos" com cor azul
  → Abre checklist → Adiciona tarefas com prioridades
  → Volta à Home → Card mostra "Estudos — 0%" → marca tarefas → "70%"
```

### 11.2 Priorizar e filtrar

```
/checklist/[id]
  → Lista ordenada por HIGH → MEDIUM → LOW
  → Filtra "Só alta" → vê apenas urgentes
  → Altera prioridade de uma tarefa → badge atualiza
```

### 11.3 Concluir tarefa

```
TaskItem → toggle → háptico leve → strikethrough
  → ProgressBar e % na Home atualizam ao voltar (useFocusEffect)
```

---

## 12. Fora do Escopo (v2.0)

| Funcionalidade | Justificativa |
|---|---|
| Planner Diário com seções (Prioridades, Amanhã, Não Esquecer) | Substituído por prioridade por tarefa em checklists |
| Modo texto livre / preço × quantidade (v1.0) | Simplificação do modelo de tarefa |
| Agendamento de checklist por data | Fora do MVP v2.0 |
| Sincronização cloud | Requer conta — aumenta fricção |
| Compartilhamento de listas | Dependência de serviço externo |
| Subtarefas / hierarquia | Sem validação de demanda |
| Notificações push | v2.x+ |
| Widget de tela inicial | Alta complexidade nativa |
| Testes E2E automatizados | Após estabilização |

---

## 13. Requisitos Não-Funcionais

| Requisito | Especificação |
|---|---|
| Performance | `FlatList` + `React.memo` em listas longas |
| Offline | 100% funcional sem conexão |
| Integridade | `PRAGMA foreign_keys = ON`; `ON DELETE CASCADE` |
| Compatibilidade | Android 7+ (API 24), iOS 16+, Web (fallback) |
| Tema | Dark padrão; light/system opcional |
| Acessibilidade | Touch targets ≥ 44px; labels em checkboxes e FAB |
| Segurança | Sem rede; sem autenticação; dados só no dispositivo |

---

## 14. Métricas de Qualidade

- [ ] Crash-free nos fluxos: criar checklist → adicionar tarefas → priorizar → concluir → excluir
- [ ] Abertura do app < 2s em device médio
- [ ] Home atualiza % sem precisar reiniciar app
- [ ] Migration v2.0 não perde checklists existentes (itens ganham `priority = MEDIUM`)

---

## 15. Roadmap

### v1.0 — Legado (entregue)
Checklists com modo lista/texto, preço, agendamento, abas Abertas/Concluídas.

### v1.1 — Legado (entregue, a descontinuar)
Melhorias de UX (drag, háptico, skeleton, swipe) + Planner Diário com seções — **remover na v2.0**.

### v2.0 — Visão atual (em implementação)
- Modelo checklist + tarefas com prioridade (`Task`, `TaskPriority`)
- Home unificada com cards (`ChecklistCard` + `ProgressBar`) — substituir abas Abertas/Concluídas por lista única com %
- `TaskItem`, `PriorityBadge`, filtro e ordenação por prioridade
- Tema dark-first; tokens de prioridade em `Colors`
- Remoção do Planner Diário (seções Prioridades / Amanhã / Não Esquecer) e simplificação do schema
- Reaproveitar UX v1.1: háptico, skeleton, swipe, drag — adaptados ao novo modelo

### v2.1+ — Futuro
- Notificações locais
- Backup/export JSON
- Animações de conclusão refinadas
- Widget Android

### v3.0 — Longo prazo
- Sync cloud opcional
- Compartilhamento de checklist

---

## 16. Glossário

| Termo | Definição |
|---|---|
| Checklist | Lista nomeada que agrupa tarefas (ex.: Estudos, Trabalho) |
| Task / Tarefa | Item dentro de uma checklist com título, prioridade e estado concluído |
| Prioridade | Nível HIGH, MEDIUM ou LOW atribuído a cada tarefa individualmente |
| Progresso | Percentual de tarefas concluídas em uma checklist |
| PriorityBadge | Componente visual que indica a prioridade de uma tarefa |
| Home | Tela principal com todos os cards de checklist |
