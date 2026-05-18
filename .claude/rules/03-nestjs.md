---
description: Regras para projetos NestJS
globs:
  - "src/**/*.ts"
alwaysApply: false
---

- Use arquitetura modular por domínio sempre que fizer sentido.
- Separe controller, service, dto e module.
- Não coloque regra de negócio no controller.
- Prefira services coesos, pequenos e focados em uma responsabilidade clara.
- Use DTOs para entrada e saída quando fizer sentido.
- Valide payloads e parâmetros.
- Use pipes, guards, interceptors e filters de forma organizada e reutilizável.
- Mantenha nomes de rotas, endpoints, serviços e métodos consistentes.
- Trate exceções de forma padronizada.
- Evite acoplamento excessivo entre módulos.
- Ao criar endpoints, considere status HTTP corretos, mensagens claras e contrato consistente.
- Para padrões detalhados NestJS, carregar a skill em `.claude/skills/nestjs`; com Prisma, carregar também `.claude/skills/prisma`.
