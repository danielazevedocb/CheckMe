---
name: ui-screen-design-system
description: >-
  Implementa uma nova tela de UI reaproveitando o design system existente (componentes, tokens, padrões),
  com estados completos (loading/empty/error), responsividade e acessibilidade.
disable-model-invocation: true
---

# Implementar nova tela usando Design System

## Objetivo
Entregar uma tela **coerente com o projeto** (componentes, tokens, copy e padrões), evitando "reconstruir UI do zero".

## Inputs mínimos (inferir do contexto se o usuário não fornecer)
- Nome/rota da tela e objetivo principal
- Fonte de dados (endpoint, query, mock) e ações do usuário
- Design system disponível (ex.: shadcn, MUI, componentes internos)

## Checklist de implementação (sequência recomendada)
1. **Descobrir padrões existentes**
   - Procurar telas parecidas e copiar estrutura (layout, headings, listas, forms).
   - Mapear componentes reutilizáveis (Card, Button, Input, Table, Dialog, Toast).
   - Identificar tokens: spacing, radius, cores, tipografia, breakpoints.

2. **Definir layout e hierarquia**
   - Header com título + descrição curta.
   - Área principal com o conteúdo (lista/tabela/form) e 1 CTA primário.
   - Ações secundárias em menu/toolbar quando fizer sentido.

3. **Estados completos**
   - `loading`: skeleton ou placeholder consistente com o projeto.
   - `empty`: mensagem clara + ação sugerida.
   - `error`: mensagem útil + retry se aplicável.
   - `disabled/submitting`: evitar double-submit, mostrar progresso.

4. **Responsividade**
   - Definir comportamento mobile-first (colunas viram stack, tabelas com overflow/control).
   - Garantir que CTAs e inputs são confortáveis em touch.

5. **Acessibilidade**
   - Semântica (header/main/section, labels).
   - Foco visível e navegação por teclado.
   - `aria-*` apenas quando necessário.

6. **Integração e testes rápidos**
   - Garantir que a tela compila.
   - Rodar lint/test (ou deixar comandos prontos se o repo não tiver).

## Anti-padrões
- Criar novos estilos "soltos" quando já existe componente/token.
- UI bonita sem estados (sem loading/empty/error).
- Copy genérica ("Enviar", "Ok") sem contexto.
