---
name: a11y-interaction-checklist
description: >-
  Checklist de acessibilidade e interação para telas e componentes: foco, teclado, semântica,
  ARIA correto, contraste e estados.
disable-model-invocation: true
---

# Checklist de Acessibilidade e Interação

## Navegação por teclado
- Tab percorre elementos interativos em ordem lógica.
- Não há "armadilhas" (modais/drawers prendem foco corretamente e permitem sair).
- Ações comuns têm atalhos naturais (Enter para submit, Esc para fechar modal).

## Foco
- Foco é **visível** (não remover outline sem alternativa).
- Foco vai para o lugar certo após ações (abrir modal, validar form, navegar).

## Semântica e formulários
- Use elementos semânticos corretos (`button`, `a`, `label`, `fieldset/legend` quando útil).
- Inputs sempre têm label (visível ou associado corretamente).
- Erros estão ligados ao campo (ex.: `aria-describedby`) e explicam o que fazer.

## ARIA (usar com precisão)
- Só use ARIA quando a semântica nativa não resolver.
- Evite `aria-label` redundante quando já existe texto visível.
- Componentes complexos (tabs, combobox, dialog) devem seguir padrões conhecidos.

## Contraste e legibilidade
- Texto e ícones com contraste suficiente (incluindo disabled).
- Tamanhos mínimos legíveis e line-height confortável.

## Estados e feedback
- `loading`: comunicar progresso sem bloquear teclado indevidamente.
- `disabled`: estado claro e motivo quando relevante.
- Mensagens (toast/alert) não devem ser a única forma de feedback para algo crítico; garantir alternativa (ex.: inline).

## Responsividade e touch
- Alvo de toque confortável para botões e itens de lista.
- Não depender apenas de hover para revelar ações.
