---
description: Regras para Prisma e modelagem de banco
globs:
  - "prisma/**/*.prisma"
  - "src/**/*.ts"
alwaysApply: false
---

- Use Prisma como camada principal de acesso ao banco.
- Prefira modelagem clara, simples e escalável.
- Use nomes consistentes para models, fields, relações e enums.
- Sempre considere integridade relacional, índices e chaves únicas.
- Evite redundância de dados quando houver relação apropriada.
- Ao alterar o schema, considere impacto em migrations, seeds, queries e serviços existentes.
- Prefira consultas legíveis e bem estruturadas.
- Evite espalhar regras de negócio complexas diretamente nas queries.
- Ao propor mudanças no banco, pense em performance, consistência e manutenção futura.
- Para padrões detalhados Prisma, carregar a skill em `.claude/skills/prisma`; em APIs NestJS, carregar também `.claude/skills/nestjs`.
