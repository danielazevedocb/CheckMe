---
description: Validar implementação da task atual contra critérios de aceite do PRD e tasks.md
---

Leia @docs/tasks.md e @docs/PRD.md.

Revise a TASK mais recente em andamento e confirme:

**API (se aplicável):**
1. Toda query Prisma inclui `tenantId`?
2. Critério de aceite do `tasks.md` atendido?
3. Endpoints alinhados com §10 do PRD?
4. `PlanLimitGuard` aplicado (apenas se >= TASK-022)?
5. Guards corretos: `TenantGuard`, RBAC?

**Web (se aplicável):**
1. Design segue referência do Figma?
2. Componentes base são shadcn/ui?
3. Magic UI usado apenas onde o guia especifica?
4. Tela consome a API implementada (sem dados mockados)?
5. Critério de aceite do `tasks.md` atendido?

**Ambos:**
- Segredos fora do git?
- Estados de loading, vazio e erro tratados?
- Lint passa nos workspaces alterados?

Aponte desvios com arquivo e linha quando possível.
