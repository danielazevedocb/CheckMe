---
name: writing-plans
description: >-
  Produz planos técnicos e de implementação em markdown: contexto, objetivos,
  fora de escopo, abordagem, passos ordenados, riscos, critérios de pronto e
  validação. Use quando o usuário pedir um plano, desenho de solução, roadmap
  de tarefas, especificação antes de codar, ou revisão/estruturação de um plano
  existente.
disable-model-invocation: true
---

# Writing plans

## Objetivo

Entregar **planos claros e acionáveis** (implementação, refator, migração, feature) sem assumir implementação até o usuário pedir — salvo se outra skill (ex.: brainstorming) impor aprovação explícita.

## Estrutura padrão do plano

Usar esta ordem; omitir seções que não se aplicam, com uma linha explicando o porquê.

1. **Contexto**: problema, estado atual, restrições (stack, prazo, compliance).
2. **Objetivos**: o que deve ser verdadeiro ao final (mensurável quando possível).
3. **Fora de escopo**: o que não será feito neste plano.
4. **Abordagem**: decisão principal em 1–2 parágrafos; alternativas descartadas em bullet curto (opcional).
5. **Plano de execução**: passos **ordenados**, com dependências; marcar o que é paralelizável.
6. **Arquivos / módulos tocados**: lista ou tabela enxuta (caminhos relativos ao repo).
7. **Riscos e mitigação**: 2–5 itens realistas.
8. **Critérios de pronto**: checklist objetiva (testes, métricas, revisão).
9. **Validação**: como verificar (comandos, cenários manuais, smoke).

## Regras de qualidade

- **Uma recomendação principal** quando houver trade-offs; opções extras só se forem equivalentes.
- **Sem código de produção** no plano, exceto pseudocódigo ou assinaturas quando esclarecem contrato.
- **Nomes e caminhos** alinhados ao projeto; se incerto, marcar como suposição.
- **Proporcional**: plano pequeno para mudança pequena; não inflar com burocracia.

## Integração com outras skills

- Se **brainstorming** estiver ativa: respeitar a regra de não implementar até aprovação; o plano é a entrega até lá.
- Se o usuário pedir **modo compacto** com token-efficiency: manter a mesma estrutura lógica, mas seções em bullets mínimos.

## Saída

- Markdown limpo, hierarquia consistente (`##` / `###`).
- Se faltar informação crítica: listar **perguntas objetivas** no topo ou após Contexto, em vez de bloquear o plano inteiro.
