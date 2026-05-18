# PRD — CheckMe

**Versão**: 1.1  
**Data**: 2026-05-18  
**Autor**: Daniel Azevedo  
**Status**: v1.1 implementada — validação Android e release pendentes

---

## 1. Visão Geral

CheckMe é um aplicativo mobile de gerenciamento de checklists e planejamento diário, focado em uso **offline-first** e totalmente local. O usuário cria, organiza e acompanha suas listas e seu dia diretamente no dispositivo, sem necessidade de conta ou conexão com internet.

Os diferenciais são: flexibilidade nos modos de entrada (lista estruturada ou texto livre), rastreamento financeiro por item (preço × quantidade), agendamento de datas por lista, e um **Planner Diário** inspirado em planners físicos — com seções de prioridades, lembretes, tarefas do dia e anotações livres.

---

## 2. Problema

Usuários precisam de dois tipos de ferramenta que hoje vivem em apps separados:

1. **Checklists funcionais** — para compras, tarefas pontuais, rotinas — sem fricção de cadastro e com controle de valor total.
2. **Planejador diário** — para estruturar o dia com prioridades, lembretes e anotações, como um planner de papel mas sempre no celular.

Apps existentes são complexos demais, exigem conta, ou não combinam os dois fluxos em uma experiência coesa e offline.

---

## 3. Objetivos

| Objetivo | Métrica de Sucesso |
|---|---|
| Criação de checklist rápida | < 30 segundos do zero até a primeira lista salva |
| Rastreamento financeiro | Soma preço × quantidade exibida em tempo real |
| Organização por status | Separação clara entre abertas e concluídas |
| Planner do dia | Usuário preenche prioridades, tarefas e anotações do dia em < 60s |
| Persistência local confiável | Zero perda de dados entre sessões |
| Experiência polida | Tema light/dark, feedback visual e háptico consistentes |

---

## 4. Público-Alvo

- **Perfil primário A**: Pessoas que fazem compras de mercado e querem controle de valor total — sem internet no mercado.
- **Perfil primário B**: Pessoas que usam planner de papel para organizar o dia e querem a experiência no celular.
- **Perfil secundário**: Usuários que gerenciam tarefas ou rotinas e precisam de checklists simples.
- **Plataformas**: Android (principal), iOS (suportado), Web (fallback).
- **Conectividade**: Uso predominantemente offline.

---

## 5. Escopo — v1.0 (Entregue)

### 5.1 Funcionalidades

#### Checklists
- Criar com título, dois modos (lista estruturada / texto livre), paleta de 8 cores e agendamento opcional
- Conversão bidirecional entre modos com preservação de dados
- Editar título, cor, modo e agendamento a qualquer momento
- Excluir com confirmação

#### Itens
- Adicionar com nome, preço (opcional) e quantidade (default 1)
- Editar via modal, marcar como feito, excluir, reordenar (posição persistida)

#### Estatísticas
- Progresso `concluídos / total`, total geral e total concluído (preço × quantidade)

#### Navegação
- Aba Abertas, aba Concluídas, aba Nova, busca por título, pull-to-refresh, FAB

#### Agendamento
- Badge dinâmico: "Hoje" / "Em X dias" / "X dias em atraso"

#### Configurações
- Tema light/dark/system com persistência, reset de banco

### 5.2 Arquitetura

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Linguagem | TypeScript 5.9 |
| Navegação | Expo Router 6 (file-based) |
| Banco de dados | Expo SQLite 16 (local, migrations automáticas) |
| Persistência auxiliar | AsyncStorage (tema) |
| Animações | React Native Reanimated 4 |
| Gestos | React Native Gesture Handler 2 |
| Ícones | Expo Vector Icons (Ionicons) |
| Build | EAS Build (APK / AAB) |

### 5.3 Modelo de Dados — v1.0

```
checklists
  id            INTEGER PK AUTOINCREMENT
  title         TEXT NOT NULL
  created_at    INTEGER NOT NULL
  mode          TEXT ('list' | 'text')
  color         TEXT (hex)
  scheduled_for INTEGER NULL

checklist_items
  id            INTEGER PK AUTOINCREMENT
  checklist_id  INTEGER FK → checklists(id) ON DELETE CASCADE
  name          TEXT NOT NULL
  price         REAL NULL
  quantity      INTEGER DEFAULT 1
  position      INTEGER DEFAULT 0
  color         TEXT (hex)
  done          INTEGER (0 | 1)
```

---

## 6. Escopo — v1.1 (Em desenvolvimento)

### 6.1 Melhorias nas Checklists Existentes

#### M1 — Drag & drop para reordenar itens
- `react-native-draggable-flatlist` já instalado; ativar na tela `/checklist/[id]`
- Substituir botões ↑/↓ por handle de arrastar
- Persistir ordem no banco via `reorderItems()`

#### M2 — Feedback háptico ao marcar item
- Vibração leve (`expo-haptics` `ImpactFeedbackStyle.Light`) ao fazer toggle done/undone
- Vibração de sucesso (`NotificationFeedbackType.Success`) ao completar 100% da checklist

#### M3 — Skeleton loading nas listas
- Substituir spinner por skeleton cards (3 placeholders animados) nas abas Abertas e Concluídas
- Preserva layout durante carregamento — sem "pulo" de conteúdo

#### M4 — Swipe to delete em itens
- Swipe para esquerda no `ChecklistItemRow` revela botão "Excluir" (vermelho)
- Substitui o ícone de lixeira sempre visível — interface mais limpa

#### M5 — Memoização de componentes de lista
- `React.memo` em `ChecklistCard` e `ChecklistItemRow`
- `useCallback` nos handlers passados como props
- Reduz re-renders desnecessários em listas longas

#### M6 — Campo de busca persistente na aba Abertas
- Busca já existe; tornar o campo sticky (não some no scroll)
- Debounce de 300ms na query

### 6.2 Nova Feature — Planner Diário

Inspirado em planners físicos (estilo "Hoje"), o Planner Diário oferece uma visão estruturada do dia corrente com seções fixas.

#### Conceito visual (referência da imagem)

```
┌─────────────────────────────────┐
│  HOJE  •  18 de maio de 2026    │
├─────────────────────────────────┤
│ PRIORIDADES (máx. 3)            │
│  ☑ Ler                         │
│  ☑ Estudar                     │
│  ☐ Treinar                     │
├─────────────────────────────────┤
│ LISTA DO DIA                    │
│  ☑ Fazer café da manhã         │
│  ☐ Alimentar os gatos          │
│  ☑ Ir para o crossfit          │
│  ☐ Meditar                     │
│  + Adicionar                    │
├─────────────────────────────────┤
│ PARA AMANHÃ (máx. 5)           │
│  ☐ Aula de dança               │
│  ☐ Corrida no parque           │
├─────────────────────────────────┤
│ NÃO ESQUECER (máx. 5)          │
│  ☐ Levar o Toby para passear   │
│  ☐ Levar o carro para lavar    │
├─────────────────────────────────┤
│ ANOTAÇÕES                       │
│ [área de texto livre]           │
└─────────────────────────────────┘
```

#### Comportamento

- A aba **"Hoje"** sempre abre o planner do dia atual
- Se não existe planner para hoje, cria automaticamente ao abrir
- Dias anteriores ficam acessíveis via histórico (`/planner/[date]`)
- Itens das seções Prioridades, Para Amanhã e Não Esquecer têm limite por seção (sem preço/quantidade — foco é na tarefa)
- Lista do Dia é ilimitada e funciona como uma checklist comum do dia
- Anotações é um campo de texto livre, salvo automaticamente (debounce 800ms)

#### Modelo de Dados — v1.1

```
daily_planners
  id         INTEGER PK AUTOINCREMENT
  date       INTEGER NOT NULL UNIQUE   -- startOfDay(timestamp)
  note       TEXT NULL                 -- anotações livres
  created_at INTEGER NOT NULL

planner_items
  id         INTEGER PK AUTOINCREMENT
  planner_id INTEGER FK → daily_planners(id) ON DELETE CASCADE
  section    TEXT NOT NULL             -- 'main' | 'priorities' | 'tomorrow' | 'dont_forget'
  name       TEXT NOT NULL
  done       INTEGER DEFAULT 0
  position   INTEGER DEFAULT 0
```

#### Limites por seção

| Seção | Label | Máx. itens | Tem checkbox |
|---|---|---|---|
| `priorities` | Prioridades | 3 | sim |
| `main` | Lista do Dia | ilimitado | sim |
| `tomorrow` | Para Amanhã | 5 | sim |
| `dont_forget` | Não Esquecer | 5 | sim |

#### Novos arquivos

```
types/planner.ts
repositories/planner-repository.ts
hooks/use-daily-planner.ts
components/planner/planner-section.tsx
components/planner/planner-item-row.tsx
components/planner/planner-note.tsx
app/(tabs)/hoje.tsx
app/planner/[date].tsx
```

#### Navegação — nova aba

Substituir a aba "Nova" por "Hoje" no layout principal. A criação de checklist passa a ser iniciada via FAB nas abas Abertas/Concluídas:

```
(tabs)/
  abertas.tsx    ← Abertas (ícone: list)
  hoje.tsx       ← Hoje — Planner Diário (ícone: calendar-today)
  nova.tsx       ← Nova Checklist (ícone: add-circle)
  concluidas.tsx ← Concluídas (ícone: checkmark-circle)
```

---

## 7. Fora do Escopo (v1.0 e v1.1)

| Funcionalidade | Justificativa |
|---|---|
| Notificações push na data agendada | Complexidade de permissões e background tasks |
| Sincronização cloud | Requer autenticação — aumenta fricção inicial |
| Compartilhamento de checklists | Dependência de serviço externo |
| Subtarefas / hierarquia | Sem validação de demanda no MVP |
| Categorias / tags | Cores + busca já resolvem organização no MVP |
| Backup / exportação | Nice-to-have para v1.2+ |
| Widget de tela inicial | Alta complexidade nativa |
| Testes automatizados (Detox) | Após estabilização das telas |
| Recorrência de planner | Planner "modelo" para repetir dias — v1.2+ |

---

## 8. Fluxos Principais

### 8.1 Criar e usar Checklist

```
Aba "Abertas" → FAB → Aba "Nova"
  → Preenche título, modo, cor, itens, agendamento opcional
  → Salva → Alert com "Abrir" → /checklist/[id]
  → Marca itens como feitos → 100% → some de Abertas → aparece em Concluídas
```

### 8.2 Planner Diário — Happy Path

```
Aba "Hoje"
  → Carrega (ou cria) planner do dia atual
  → Vê seções: Prioridades, Lista do Dia, Para Amanhã, Não Esquecer, Anotações
  → Adiciona item em qualquer seção → salva imediatamente no banco
  → Marca item como feito → toggle com háptico
  → Escreve na área de Anotações → salvo automaticamente após 800ms de pausa
  → Barra de progresso no header mostra % do dia concluído (main + priorities)
```

### 8.3 Histórico do Planner

```
Aba "Hoje" → botão "Ver histórico" (header)
  → Lista de datas com planner salvo
  → Toca data → /planner/[date] (edição igual à aba Hoje)
```

### 8.4 Reordenar Itens (após M1)

```
/checklist/[id]
  → Segura handle do item
  → Arrasta para nova posição
  → Solta → ordem salva no banco via reorderItems()
```

---

## 9. Requisitos Não-Funcionais

| Requisito | Especificação |
|---|---|
| Performance | FlatList com `React.memo`, `useCallback`, `getItemLayout` onde altura é fixa |
| Offline | 100% funcional sem conexão |
| Integridade | `PRAGMA foreign_keys = ON`; CASCADE em deletes |
| Compatibilidade | Android 7+ (API 24), iOS 16+, Web (fallback) |
| Tema | Light/Dark/System com persistência |
| Acessibilidade | Touch targets ≥ 44px; `accessibilityRole`, `accessibilityLabel` em interativos |
| Hápticos | Feedback em ações de marcar feito e conclusão de lista |
| Segurança | Sem dados sensíveis; sem rede; sem autenticação |

---

## 10. Design e UX

### Princípios
- **Velocidade de criação**: chegar à primeira entrada (checklist ou planner) em < 30 segundos
- **Hierarquia visual intencional**: 1 CTA primário por seção; espaçamento e tipografia como separadores
- **Feedback consistente**: háptico + visual em ações; loading preserva layout (skeleton)
- **Sem cara de IA**: microcopy específico, densidade uniforme, sem gradientes decorativos

### Paleta de Cores das Checklists
| Nome | Hex |
|---|---|
| Azul | `#2563EB` |
| Ciano | `#0891B2` |
| Roxo | `#7C3AED` |
| Rosa | `#DB2777` |
| Laranja | `#F97316` |
| Amarelo | `#FACC15` |
| Verde | `#22C55E` |
| Grafite | `#64748B` |

### Cores do Planner (tema fixo, não personalizável na v1.1)
- Seção Prioridades: accent primário do tema (`primary`)
- Seção Lista do Dia: neutro (surface)
- Seção Para Amanhã: success do tema (`success`)
- Seção Não Esquecer: warning (a definir nos tokens)
- Anotações: surface com borda sutil

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Drag & drop instável no Android | Média | Testar em device físico antes de ativar; fallback para botões ↑/↓ |
| Planner duplicado no mesmo dia | Baixa | Constraint `UNIQUE` em `date`; upsert na abertura da aba |
| Performance com lista do dia longa | Baixa | FlatList + React.memo por seção |
| Swipe conflict com scroll vertical | Média | Usar threshold de swipe adequado no Gesture Handler |
| Divergência modo texto ↔ lista | Média | `syncItemsFromLines()` já implementado com reconciliação |

---

## 12. Métricas de Qualidade

- [ ] Crash-free: zero erros não tratados que travem o app
- [ ] Abertura do app < 2s em device médio
- [ ] Criação de checklist com 5 itens em < 60s
- [ ] Planner do dia criado e preenchido em < 90s
- [ ] Banco íntegro após ciclo: criar → editar → concluir → reabrir

---

## 13. Roadmap

### v1.0 — Concluído
- Checklists com dois modos, cores, agendamento, estatísticas financeiras
- Tema light/dark, SQLite local com migrations

### v1.1 — Implementado (validação Android pendente)
- **M1** Drag & drop para reordenar itens de checklist e planner
- **M2** Feedback háptico ao marcar item feito
- **M3** Skeleton loading nas listas
- **M4** Swipe to delete em itens
- **M5** Memoização de componentes de lista
- **M6** Campo de busca sticky com debounce
- **F1** Planner Diário — aba "Hoje" com seções, anotações, progresso e histórico (`/planner/[date]`)

### v1.2 — Planejado
- Notificações locais na data agendada (`expo-notifications`)
- Exportação/backup do banco (JSON ou SQLite export)

### v2.0 — Longo prazo (requer validação)
- Sincronização cloud opcional
- Widget de tela inicial (Android)
- Planner "modelo" para repetir estrutura de dias
- Compartilhamento de checklist

---

## 14. Glossário

| Termo | Definição |
|---|---|
| Checklist | Lista de itens com título, cor, modo e agendamento opcional |
| Item | Entrada de checklist com nome, preço, quantidade e estado done/pendente |
| Modo Lista | Campos estruturados por item (nome, preço, quantidade) |
| Modo Texto | Área livre — cada linha vira um item |
| Aberta | Checklist com pelo menos um item pendente |
| Concluída | Checklist com todos os itens marcados como feitos |
| Total Geral | Soma de `preço × quantidade` de todos os itens |
| Total Concluído | Soma de `preço × quantidade` apenas dos itens feitos |
| Planner Diário | Visão do dia com seções fixas: Prioridades, Lista do Dia, Para Amanhã, Não Esquecer e Anotações |
| Seção | Grupo temático dentro do Planner Diário |
| Planner de um dia | Registro vinculado a uma data (startOfDay), com itens e anotações |
