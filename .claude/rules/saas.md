---
description: Regras para projetos SaaS multi-tenant com planos e assinaturas
globs:
  - "src/**/*.ts"
alwaysApply: false
---

## Multi-tenancy
- Todo acesso ao banco deve ser filtrado por `tenantId` — nunca retorne dados sem esse filtro.
- O `tenantId` vem sempre do token autenticado (guard), nunca do body da requisição.
- Use `TenantGuard` global para injetar `tenantId` no request após o `AuthGuard`.
- Prefira `findFirst({ where: { id, tenantId } })` a `findUnique({ where: { id } })`.
- Ao criar registros, sempre inclua `tenantId` no `data`.

## Planos e limites
- Aplique `PlanLimitGuard` em toda rota de criação de recurso com limite por plano.
- Nunca deixe a validação de limite apenas no frontend — sempre enforçar no backend.
- Mensagens de limite atingido devem indicar o plano atual e sugerir upgrade.
- Ao consultar limites, inclua o plano do tenant na query (evite queries extras desnecessárias).

## Status do tenant
- Respeite o ciclo de status: `TRIAL → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED`.
- Tenants com status `SUSPENDED` ou `CANCELLED` não devem acessar recursos protegidos.
- Bloqueio de trial expirado deve ser automático — nunca depender de ação manual.
- Ao verificar acesso, cheque `tenant.status` antes de processar a requisição.

## Autenticação e RBAC
- O JWT deve sempre conter `tenantId`, `role` e `userId` no payload.
- Use guards de role para proteger rotas por perfil (OWNER, MANAGER, WAITER, COOK, SUPER_ADMIN).
- Separe claramente rotas públicas (sem auth) de rotas autenticadas.
- Rotas do Super Admin devem verificar `role === SUPER_ADMIN` independente do tenant.

## Webhooks de pagamento
- Sempre valide a assinatura do webhook antes de processar (ex: `constructEvent` do Stripe).
- Processe webhooks de forma idempotente — o mesmo evento pode chegar mais de uma vez.
- Mapeie eventos do gateway para status internos (`ACTIVE`, `PAST_DUE`, `CANCELLED`).
- Nunca confie apenas no body do webhook sem validar a origem.

## Onboarding
- O fluxo de cadastro deve criar tenant e usuário owner em uma única operação atômica.
- Trial deve ser ativado automaticamente com data de expiração definida na criação.
- E-mails transacionais (boas-vindas, lembrete de trial, suspensão) devem ser disparados por eventos, não por chamadas diretas no fluxo principal.

## Regras gerais
- Isole lógica de billing, tenant e plano em módulos separados — não misture com domínio de negócio.
- Para padrões detalhados de multi-tenancy, carregar a skill em `.claude/skills/multitenant`.
- Para integração com pagamentos, carregar a skill em `.claude/skills/pagamento`.
