# Skill — Multitenant (SaaS)

## Visão Geral

Sistemas SaaS multi-tenant compartilham a mesma infraestrutura entre múltiplos clientes (tenants). O isolamento pode ser feito de três formas:

| Estratégia | Como funciona | Quando usar |
|---|---|---|
| **Schema compartilhado** | Mesmas tabelas, coluna `tenantId` em cada registro | Maioria dos SaaS — simples e escalável |
| **Schema separado** | Um schema PostgreSQL por tenant | Quando há exigências legais de isolamento |
| **Banco separado** | Um banco por tenant | Enterprise com volume muito alto |

Esta skill cobre a estratégia mais comum: **schema compartilhado com `tenantId`**.

---

## 1. Princípio Fundamental

**Nenhuma query ao banco pode ser executada sem filtrar pelo `tenantId`.**

O `tenantId` deve:
- Vir sempre do token autenticado (JWT ou sessão) — nunca do body da requisição
- Ser injetado automaticamente por um guard/middleware global
- Estar presente em todo `create`, `findMany`, `findOne`, `update` e `delete`

---

## 2. Fluxo de Isolamento

```
Request HTTP
      ↓
AuthGuard → valida token e decodifica usuário
      ↓
TenantGuard → extrai tenantId do token e injeta no request
      ↓
Controller → passa tenantId para o service (nunca do body)
      ↓
Service → usa tenantId em toda query ao banco
      ↓
Banco → retorna apenas dados do tenant correto
```

---

## 3. TenantGuard — NestJS

```typescript
// src/common/guards/tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // populado pelo AuthGuard

    if (!user?.tenantId) return false;

    request.tenantId = user.tenantId;
    request.userRole = user.role;
    return true;
  }
}
```

### Registro global (aplica em todas as rotas autenticadas)

```typescript
// src/app.module.ts
providers: [
  { provide: APP_GUARD, useClass: AuthGuard },   // primeiro
  { provide: APP_GUARD, useClass: TenantGuard }, // segundo
]
```

---

## 4. Padrão de Queries com tenantId

### ✅ CORRETO

```typescript
// Listar
findMany({ where: { tenantId } })

// Buscar por id (usar findFirst, não findUnique)
findFirst({ where: { id, tenantId } })

// Criar
create({ data: { ...dto, tenantId } })

// Atualizar
update({ where: { id, tenantId }, data: dto })

// Deletar
delete({ where: { id, tenantId } })
```

### ❌ ERRADO — nunca fazer

```typescript
findMany()                          // retorna dados de todos os tenants
findUnique({ where: { id } })       // outro tenant pode acessar
create({ data: dto })               // registro criado sem dono
update({ where: { id }, data: dto }) // qualquer tenant pode alterar
```

---

## 5. Decorator para Extrair tenantId no Controller

Evita repetir `req['tenantId']` em todo controller.

```typescript
// src/common/decorators/tenant-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().tenantId;
  },
);
```

### Uso no controller

```typescript
@Get()
findAll(@TenantId() tenantId: string) {
  return this.service.findAll(tenantId);
}

@Post()
create(@Body() dto: CreateDto, @TenantId() tenantId: string) {
  return this.service.create(dto, tenantId);
}
```

---

## 6. Acesso Público — Sem JWT (ex: cardápio via slug)

Quando uma rota é pública (sem autenticação), resolva o `tenantId` por outro identificador único do tenant (slug, subdomínio, código).

```typescript
@Get(':slug/products')
async getPublic(@Param('slug') slug: string) {
  const tenant = await this.prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!tenant || tenant.status === 'SUSPENDED') {
    throw new NotFoundException('Não disponível');
  }

  return this.service.findAll(tenant.id); // tenantId resolvido pelo slug
}
```

---

## 7. PlanLimitGuard — Limites por Plano

Em SaaS com planos, alguns recursos têm limite por plano (ex: número de usuários, projetos, produtos). O guard verifica o limite antes de permitir a criação.

```typescript
// src/common/guards/plan-limit.guard.ts
@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<string>('planResource', context.getHandler());
    if (!resource) return true;

    const { tenantId } = context.switchToHttp().getRequest();

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    // Adapte os recursos e limites ao seu projeto
    const count = await this.prisma[resource].count({ where: { tenantId } });
    const max = tenant.plan[`max${capitalize(resource)}`];

    if (count >= max) {
      throw new ForbiddenException(
        `Limite de ${resource} atingido para o plano ${tenant.plan.name}.`,
      );
    }

    return true;
  }
}
```

### Decorator e uso

```typescript
// Decorator
export const PlanResource = (resource: string) =>
  SetMetadata('planResource', resource);

// No controller
@Post()
@UseGuards(PlanLimitGuard)
@PlanResource('products')
create(@Body() dto: CreateDto, @TenantId() tenantId: string) {
  return this.service.create(dto, tenantId);
}
```

---

## 8. JWT Payload Recomendado

O token deve sempre carregar `tenantId` e `role` para que os guards funcionem sem consulta extra ao banco.

```typescript
interface JwtPayload {
  sub: string;       // userId
  email: string;
  tenantId: string;  // isolamento
  role: string;      // RBAC
}
```

---

## 9. Middleware Alternativo (Express)

Para frameworks ou situações onde guard global não é viável:

```typescript
// src/common/middleware/tenant.middleware.ts
export function tenantMiddleware(req, res, next) {
  const user = req.user;
  if (user?.tenantId) {
    req.tenantId = user.tenantId;
  }
  next();
}

// Registro no AppModule
configure(consumer: MiddlewareConsumer) {
  consumer.apply(tenantMiddleware).forRoutes('*');
}
```

---

## 10. Checklist de Validação

Antes de concluir qualquer feature que acessa o banco, verifique:

- [ ] Toda `findMany` tem `where: { tenantId }`?
- [ ] Toda `findFirst`/`findUnique` tem `tenantId` no where?
- [ ] Todo `create` inclui `tenantId` no data?
- [ ] Todo `update`/`delete` tem `tenantId` no where?
- [ ] O `tenantId` vem do request (guard), nunca do body?
- [ ] Rotas públicas resolvem `tenantId` por slug/subdomínio?
- [ ] `PlanLimitGuard` está aplicado onde há limite de plano?
- [ ] O JWT payload contém `tenantId` e `role`?

---

## 11. Erros Comuns

| Erro | Causa | Solução |
|---|---|---|
| Dados de outro tenant aparecem | Query sem `tenantId` | Sempre incluir `where: { tenantId }` |
| Usuário manipula `tenantId` | Pegando do body | Sempre usar o do request (guard) |
| Recurso criado sem dono | `create` sem `tenantId` | Incluir no data obrigatoriamente |
| Tenant suspenso acessível | Não verifica status | Checar `status !== SUSPENDED` em rotas públicas |
| `findUnique` sem tenantId | Busca por PK sem validar dono | Usar `findFirst` com `{ id, tenantId }` |
| Limite de plano não aplicado | Guard ausente | Aplicar `PlanLimitGuard` em rotas de criação |

---

*Skill genérica — aplicável a qualquer projeto SaaS multi-tenant*
*Padrão: schema compartilhado com tenantId · NestJS · Prisma*
