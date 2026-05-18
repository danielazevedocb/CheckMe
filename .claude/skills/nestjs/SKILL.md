---
name: nestjs
description: >-
  Orienta arquitetura e padrões NestJS (módulos, controllers, services, DTOs,
  pipes, guards, interceptors, filters, testes). Use quando o usuário trabalhar
  com NestJS, @nestjs/core, APIs HTTP, WebSockets, microserviços Nest, ou pedir
  backend Node com estrutura Nest.
disable-model-invocation: true
---

# NestJS

## Arquitetura

- **Módulo por domínio** quando fizer sentido: `*.module.ts`, `*.service.ts`, `*.controller.ts`, pasta `dto/`.
- **Controller fino**: roteamento, status HTTP, delegação ao service; sem regra de negócio pesada.
- **Service coeso**: uma responsabilidade clara; orquestra dependências e persistência (via repositório/ORM injetado).
- **Baixo acoplamento** entre módulos: exportar só o necessário; evitar imports circulares (refatorar ou usar `forwardRef` só quando inevitável).

## DTOs e validação

- DTOs de entrada com `class-validator` / `class-transformer` quando o projeto já usar esse padrão.
- `ValidationPipe` global: considerar `whitelist` e `forbidNonWhitelisted` em APIs públicas.
- Separar DTOs de **criação**, **atualização** (parcial) e **resposta** se os shapes divergirem.

## HTTP e contrato

- Status e corpo consistentes com o restante da API; mensagens claras para o cliente.
- Nomes de rotas, métodos e serviços alinhados ao domínio (recursos, verbos, pluralização do projeto).

## Cross-cutting

- **Pipes**: transformação/validação reutilizável.
- **Guards**: autenticação e autorização; manter regras legíveis e testáveis.
- **Interceptors**: logging, métricas, mapeamento de resposta, timeout quando aplicável.
- **Exception filters**: tratamento padronizado; mapear exceções de domínio/ORM para HTTP de forma centralizada quando possível.

## Configuração

- `ConfigModule` / variáveis de ambiente validadas (ex.: Joi ou schema próprio) em projetos que já adotem isso.
- Não commitar segredos; documentar variáveis necessárias.

## Testes

- **Unit**: mockar dependências do service (persistência, clients HTTP, filas).
- **E2E**: `TestingModule` com app completo ou módulos parciais conforme o caso; banco/Redis reais ou testcontainers se o projeto usar.

## Persistência (ORM)

- Não acoplar controller ao client de banco; injetar service/repositório.
- Com **Prisma**, ver skill `prisma` e integração via serviço dedicado no módulo de infraestrutura.

## Anti-padrões

- Lógica de negócio extensa no controller.
- Módulos "Deus" com dezenas de providers sem fronteira clara.
- Expor entidades internas/DB cruas em respostas públicas sem contrato explícito.
