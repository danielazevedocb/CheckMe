---
description: Regras para projetos Django
globs:
  - "**/*.py"
alwaysApply: false
---

## Estrutura
- Use a estrutura padrão do Django de forma clara e organizada.
- Separe responsabilidades entre views, serializers, models, forms, services e repositories quando fizer sentido.
- Evite colocar regra de negócio complexa diretamente em views; extraia para services.
- Prefira funções e classes pequenas com responsabilidade única.

## Models e banco
- Use models bem definidos, com nomes claros, relacionamentos corretos e validações apropriadas.
- Mantenha migrations consistentes e revise impactos no banco antes de alterar models.
- Evite queries desnecessárias; considere `select_related` e `prefetch_related` quando houver relações.

## APIs (Django REST Framework)
- Use serializers para entrada e saída de dados.
- Valide entradas de dados e trate erros de forma clara.
- Use status HTTP corretos em respostas de API.
- Nunca exponha detalhes internos em respostas de erro em produção.

## Python
- Use nomes descritivos para funções, variáveis, classes e módulos.
- Trate erros de forma clara e consistente; prefira exceções específicas ao `Exception` genérico.
- Adicione comentários apenas quando ajudarem a explicar a intenção, não o óbvio.

## Coexistência com FastAPI
- Se este repositório também tiver FastAPI, prefira estreitar os `globs` por pasta (ex.: `apps/django/**/*.py`) para evitar as duas rules aplicarem ao mesmo arquivo.
