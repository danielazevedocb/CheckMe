---
name: brainstorming
description: >-
  Impõe fluxo de descoberta e aprovação antes de implementar: nenhuma escrita de
  código ou estrutura de projeto até o usuário aprovar o plano apresentado. Guia em
  etapas sequenciais (contexto, dúvidas, opções, proposta, especificação, revisão).
  Use em projetos novos, refactors grandes ou quando o usuário pedir planejamento
  explícito antes de codar.
disable-model-invocation: true
---

# Brainstorming

## Regra rígida

**Não iniciar implementação** (código novo, arquivos, refator estrutural, comandos que alterem o repo) até o usuário **aprovar explicitamente** o plano ou o "projeto" descrito nesta skill.

Esclarecimentos e leitura **somente leitura** do código para entender contexto são permitidos quando necessários para propor o plano.

## Etapas (sequenciais)

1. **Explorar contexto**: objetivo, restrições, prazo, stack, partes já existentes (resumo).
2. **Esclarecer dúvidas**: listar perguntas objetivas; aguardar respostas ou assinalar suposições explícitas.
3. **Propor abordagens**: 2–3 opções com prós/contras e recomendação única quando possível.
4. **Apresentar o projeto**: escopo, fora de escopo, entregas, riscos, ordem de execução.
5. **Documentar especificação**: critérios de pronto, contratos principais, pontos de integração.
6. **Ciclo de revisão**: incorporar feedback do usuário em uma versão revisada do plano.
7. **Aprovação**: só após frase clara do tipo "pode implementar" / "aprovado" seguir para Agent mode de implementação (se aplicável).

## Exceções (combinar com o usuário)

- **Hotfix** de uma linha ou correção trivial: pode pedir dispensa rápida da regra.
- Se o usuário já trouxe especificação fechada, condensar etapas 3–5 em confirmação única.

## Saída típica

- Plano em markdown claro, sem código de produção até aprovação.
- Se o usuário pedir estimativa, usar faixas ou t-shirt size, não precisão falsa.
