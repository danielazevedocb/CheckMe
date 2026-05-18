---
description: Regras para projetos Next.js
globs:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "components/**/*.ts"
  - "components/**/*.tsx"
alwaysApply: false
---

- Use boas práticas compatíveis com a estrutura atual do projeto em Next.js.
- Prefira Server Components quando não houver necessidade de interatividade no cliente.
- Use `"use client"` apenas quando realmente necessário.
- Evite colocar lógica excessiva diretamente em páginas.
- Organize código de forma clara entre páginas, componentes, hooks, helpers e services.
- Considere loading, error boundaries e estados assíncronos de forma consistente com o projeto.
- Use tipagem clara com TypeScript; evite `any`.
- Ao buscar dados, mantenha a estratégia consistente com o padrão já adotado no projeto.
- Preserve a organização atual de rotas, layouts e componentes.
