---
description: Regras para projetos FastAPI
globs:
  - "**/*.py"
alwaysApply: false
---

## Estrutura
- Organize rotas, schemas, services e repositórios de forma clara e modular.
- Evite colocar regra de negócio diretamente nas rotas; extraia para services.
- Prefira funções e classes pequenas com responsabilidade única.

## Validação e contratos
- Use Pydantic para validação de entrada e saída em todos os endpoints.
- Use status HTTP corretos e mensagens de erro claras e consistentes.
- Nunca exponha detalhes internos (stack traces, nomes de tabela, etc.) em respostas de erro em produção.

## Python
- Use nomes descritivos para funções, variáveis, classes e módulos.
- Trate erros de forma clara e consistente; prefira exceções específicas ao `Exception` genérico.
- Adicione comentários apenas quando ajudarem a explicar a intenção, não o óbvio.

## Coexistência com Django
- Se este repositório também tiver Django, prefira estreitar os `globs` por pasta (ex.: `apps/fastapi/**/*.py`) para evitar as duas rules aplicarem ao mesmo arquivo.
