---
description: Expo (TS) — padrões de navegação (expo-router) e estrutura
globs:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "expo-env.d.ts"
  - "app.json"
  - "app.config.*"
alwaysApply: false
---

- **Expo Router como padrão** quando o projeto usa rotas por arquivos (`app/`).
- **Preserve a estrutura atual** do repositório antes de criar novos grupos/pastas.

- **Estrutura recomendada (quando fizer sentido no projeto)**:
  - `app/_layout.tsx` para providers e config global de navegação.
  - `app/(tabs)/...` para áreas com tabs.
  - `app/(auth)/...` para fluxos de autenticação.
  - `app/(modals)/...` para modais (não misturar com push “normal” sem motivo).

- **Rotas e nomes**:
  - Arquivos/rotas em padrão consistente (ex.: kebab-case) e componentes em PascalCase.
  - Parametrização explícita: `[id].tsx`, `[...rest].tsx`. Não invente params implícitos.

- **Tipagem e validação de params**:
  - Tipar params de rota e **validar antes de usar** (ex.: parse com Zod).
  - Se params estiverem inválidos/ausentes, fazer fallback seguro (ex.: mostrar erro e voltar/redirect consistente).

- **Gating (auth/onboarding)**:
  - Evite espalhar redirects em várias telas.
  - Centralize gating no layout do group (ex.: `(auth)` vs rotas protegidas), deixando explícito o fluxo de navegação.

- **Deep links**:
  - Ao mexer com deep links, considerar cold start, rotas suportadas e validação de params.

- **Headers, stacks e modais**:
  - Padronizar quando usar `push`, `replace` e modal.
  - Fluxos destrutivos sempre com confirmação e feedback claro.

- Antes de propor detalhes de API do `expo-router`, consulte documentação atual via Context7 (conforme `01-geral.mdc`).
