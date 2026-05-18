---
description: Expo (TS) — data/state (React Query/Zustand) + forms (RHF) + validação (Zod)
globs:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "hooks/**/*.ts"
  - "services/**/*.ts"
  - "store/**/*.ts"
alwaysApply: false
---

- **Separação de camadas**:
  - UI (telas/componentes) não deve conter regra de negócio ou HTTP direto.
  - Rede e contratos ficam em `services/` (client + endpoints) com tipagem explícita.
  - Regras reutilizáveis vão para hooks/helpers, não duplicadas em telas.

- **Tratamento de estados**:
  - Sempre tratar `loading`, `error`, `empty` e `success` em telas com dados assíncronos.
  - Erros devem ser “acionáveis” para o usuário (mensagem clara + ação de retry quando fizer sentido).

- **React Query (quando usado)**:
  - Keys consistentes e preferencialmente centralizadas (evitar strings soltas espalhadas).
  - Mutations devem invalidar/refetch **de forma intencional** (evitar “invalidate tudo”).
  - Normalizar erro (ex.: `ApiError`) para não vazar detalhes internos e manter UX consistente.

- **Zustand (quando usado)**:
  - Stores por domínio; preferir selectors para evitar re-render desnecessário.
  - Persistência só quando necessária.
  - Não persistir credenciais/PII em storage inseguro (alinha com `security.md`).

- **Forms (react-hook-form)**:
  - Um schema Zod por form (ou por passo), usando `zodResolver` quando aplicável.
  - UX de submit: estado `submitting`, CTA desabilitado, evitar double submit.
  - Mensagens de erro específicas (o que está errado + como corrigir).

- **Validação e segurança**:
  - Validação no client é UX, não segurança: o servidor deve validar novamente (alinha com `security.md`).
  - Nunca colocar secrets em env público/bundle do app; se precisar, mover para backend/endpoint server-side.

- **Offline e rede**:
  - Sempre prever: ausência de internet, timeout, retry/backoff e botão “tentar novamente” quando apropriado.
  - Quando o app for offline-first, pensar em persistência de cache e resolução de conflitos antes de “apenas salvar local”.

- Antes de propor detalhes de API/config de React Query/Zustand/RHF/Zod, consulte documentação atual via Context7 (conforme `01-geral.mdc`).
