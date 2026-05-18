---
description: Expo (TS) — qualidade (lint/format), testes RN, E2E, performance, a11y, observabilidade
globs:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "e2e/**/*"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "jest.config.*"
  - "detox.config.*"
alwaysApply: false
---

- **Lint/format e tipos**:
  - Seguir ESLint/Prettier do repo; não introduzir estilo novo sem necessidade.
  - Evitar `any`; preferir tipos inferidos/estritos e validação em runtime quando necessário (Zod).

- **Testes (React Native)**:
  - Preferir testes de comportamento com `@testing-library/react-native` (render + interação + asserts).
  - Mockar rede e tempo de forma previsível; evitar testes frágeis acoplados à implementação.
  - Dar nomes e describe/it que expressem comportamento do usuário.

- **E2E**:
  - Para mobile nativo, preferir **Detox** quando o repo já usa/aceita (Playwright é mais para web).
  - Cobrir fluxos críticos: login, navegação principal, erro de rede/offline, ação principal do produto.

- **Performance**:
  - Listas grandes: preferir `FlatList` e ajustar quando necessário; evitar `ScrollView` com muitos itens.
  - Imagens: cuidado com tamanhos e re-render; não carregar assets gigantes sem necessidade.
  - Memoização (`useMemo`, `useCallback`, `React.memo`) só quando houver ganho real e mensurável.

- **Acessibilidade (React Native)**:
  - Usar `accessibilityRole`, `accessibilityLabel` e `accessibilityHint` quando aplicável.
  - Garantir alvos de toque confortáveis, contraste e feedback claro para estados (loading/disabled/error).
  - Respeitar preferências do sistema quando suportado (tamanho de fonte/reduced motion).

- **Observabilidade (quando existir no projeto)**:
  - Padronizar nomes de eventos e evitar PII em analytics/logs.
  - Erros em produção: mensagem amigável + log estruturado (sem secrets).

- Antes de propor setup/config de Jest/Detox/analytics/crash reporting, consulte documentação atual via Context7 (conforme `01-geral.mdc`).
