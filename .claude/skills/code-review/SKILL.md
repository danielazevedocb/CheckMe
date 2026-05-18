---
name: code-review
description: >-
  Estrutura revisão de código focada em riscos (correção, segurança, a11y,
  performance, manutenção) e alinhamento às rules do projeto. Indica quando usar
  subagente ou segunda passagem para PRs grandes. Use antes de merge, após tarefas
  grandes ou quando o usuário pedir revisão explícita.
disable-model-invocation: true
---

# Code review

## Escopo da revisão

Ajustar profundidade ao tamanho da mudança:

- **Pequena**: verificação rápida (correção, edge cases óbvios, estilo do repo).
- **Média**: fluxo completo, erros, testes faltantes, impacto em API/contratos.
- **Grande**: arquitetura, segurança, migração, rollback, observabilidade.

## Ordem de leitura sugerida

1. **Intenção**: o que a mudança deveria fazer (PR descrição ou resumo).
2. **Contratos**: tipos públicos, endpoints, eventos, schema.
3. **Lógica principal**: caminho feliz + erros.
4. **Segurança**: validação de entrada, authz, dados sensíveis, injeção, URLs.
5. **A11y/UI**: se houver mudança de interface, checar labels, foco, estados.
6. **Performance**: N+1, renders extras, payloads grandes.
7. **Manutenção**: duplicação, nomes, testes, comentários só onde necessário.

## Alinhamento com este projeto

- **Context7** para uso correto de libs quando suspeitar de API incorreta.
- Mudanças **pequenas e revisáveis**; se o PR cresceu demais, sugerir divisão (ver skill split-to-prs se disponível).
- Não pedir refactor não relacionado ao escopo do PR.

## Formato da resposta

- **Resumo** em 2–4 bullets.
- **Bloqueadores** (deve corrigir antes do merge).
- **Sugestões** (melhorias não bloqueantes) com localização (arquivo/função).
- **Perguntas** só onde o contexto do autor for necessário.

## Subagentes / segunda passagem

- Para PRs muito grandes ou áreas críticas (auth, pagamento), recomendar revisão dedicada por tema (segurança vs. UI) ou ferramenta de CI já usada no repo.
