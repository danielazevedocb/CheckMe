---
description: Regras gerais do projeto (todas as stacks)
alwaysApply: true
---

## Documentação e bibliotecas
- Sempre use o MCP Context7 ao lidar com bibliotecas, frameworks, APIs externas, setup, configuração e exemplos de código.
- Priorize documentação atual e específica de versão via Context7.
- Não confie apenas no conhecimento interno do modelo para sintaxe ou APIs de bibliotecas.

## Qualidade de código
- Escreva código limpo, legível e fácil de manter.
- Evite duplicação de código.
- Use nomes descritivos para arquivos, funções, variáveis, componentes e props.
- Prefira funções e componentes pequenos com responsabilidade única.
- Prefira simplicidade em vez de soluções desnecessariamente complexas.
- Não invente bibliotecas, funções ou APIs inexistentes.

## Processo
- Preserve o padrão já existente no projeto.
- Antes de implementar, analise a estrutura já existente.
- Faça alterações pequenas, objetivas e fáceis de revisar.
- Explique brevemente a abordagem antes de mudanças grandes.

## Tratamento de erros e validação
- Sempre considere tratamento de erros e validação quando houver entrada de dados.
- Trate erros de forma clara e consistente em todas as camadas.

## Backend (todas as stacks)
- Prefira responsabilidades bem separadas entre camadas; evite lógica excessiva em controllers/views/rotas.
- Sempre valide entradas de dados no servidor.
- Prefira respostas de API consistentes, com status HTTP corretos e contratos estáveis.
- Ao alterar fluxos de negócio, considere impacto em serviços, banco, DTOs e contratos da API.

## Python
- Use nomes descritivos para funções, variáveis, classes e módulos.
- Prefira organização modular quando o código crescer.
- Adicione comentários apenas quando ajudarem a explicar a intenção, não o óbvio.
