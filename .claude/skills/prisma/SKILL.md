---
name: prisma
description: >-
  Orienta schema, migrations, Prisma Client, consultas, transações, índices e
  erros comuns. Use quando o usuário trabalhar com Prisma, schema.prisma,
  migrate, seed, @prisma/client, ou modelagem SQL via Prisma em Node/TypeScript.
disable-model-invocation: true
---

# Prisma

## Schema

- Models, campos, relações e enums com **nomes consistentes** e alinhados ao domínio.
- **Integridade**: FKs, `onDelete` / `onUpdate` explícitos quando o comportamento importa.
- **`@unique` e índices** (`@@index`) guiados por consultas reais; avaliar custo em writes.
- Evitar redundância desnecessária; preferir relações a duplicar dados sem motivo.

## Migrations

- Alterar `schema.prisma` e gerar migration **nomeada** em dev (`migrate dev` ou fluxo do time).
- **Não reescrever** migrations já aplicadas em ambientes compartilhados; criar nova migration para correções.
- Antes de merge: revisar SQL gerado e impacto em dados existentes (defaults, NOT NULL, renomeações).

## Client e consultas

- **`select` / `include`** de propósito claro; evitar carregar grafos enormes por padrão (payload e N+1).
- Paginação (`take` / `skip` ou cursor) em listagens que possam crescer.
- Preferir consultas legíveis; extrair helpers quando a mesma composição se repetir.

## Transações

- **`$transaction`** com array de operações ou callback `async (tx) => { ... }` quando várias escritas forem atômicas.
- Manter transações curtas; não misturar I/O externo lento dentro do callback sem necessidade.

## Erros (códigos)

- **`P2002`**: violação de unique → mapear para conflito (ex. HTTP 409) no backend.
- **`P2025`**: registro não encontrado em operação esperada → 404 ou regra de negócio.
- **`P2003`**: FK inválida → 400/409 conforme contexto.
- Centralizar mapeamento no framework (ex.: filters Nest) em vez de repetir `try/catch` idêntico.

## Seeds e dados locais

- `prisma db seed` conforme `package.json` / config do projeto; seeds idempotentes quando possível.

## Testes

- Banco de teste dedicado ou container; aplicar migrations antes da suíte.
- Em testes unitários do domínio, mockar a camada que chama Prisma.

## Frameworks

- Em **NestJS**, encapsular `PrismaClient` em um serviço com ciclo de vida (`connect` / `$disconnect`); ver skill `nestjs` para camadas HTTP e módulos.

## Anti-padrões

- Regras de negócio complexas só dentro de queries gigantes (extrair lógica testável).
- Expor todos os campos do model em API pública sem filtrar dados sensíveis.
- Ignorar versão do Prisma: em dúvida na API, consultar documentação atual (ex.: Context7 / docs oficiais).
