---
description: Regras gerais para frontend (web e mobile)
alwaysApply: true
---

## Componentes
- Escreva componentes claros, reutilizáveis e com responsabilidade única.
- Evite lógica excessiva dentro de componentes visuais; extraia para hooks, helpers ou services.
- Antes de criar algo novo, procure e reutilize componentes, hooks e padrões já existentes no projeto.
- Não crie variações "quase iguais" de componentes; se precisar de variação, estenda o componente existente.

## Visual e consistência
- Preserve tokens e tema do projeto (cores, radius, sombras, tipografia, espaçamento).
- Use a escala existente de `space`, `radius`, `font-size` e `z-index`; evite valores soltos.
- Não adicione gradientes, sombras, blur ou animações sem motivo de UX claro.
- Mantenha ritmo vertical coerente, grids previsíveis e alinhamento consistente.
- Escolha uma densidade (compacta vs. confortável) e aplique uniformemente em toda a tela.
- Iconografia: mesma família, espessura e alinhamento em todo o projeto.

## Hierarquia e microcopy
- Defina 1 CTA primário por seção; use peso/tamanho/contraste para guiar o olhar.
- Evite excesso de bordas e sombras para separar elementos; prefira espaçamento e tipografia.
- Use verbos claros com objeto em botões e ações ("Salvar alterações", "Criar conta").
- Mensagens de erro devem dizer o que ocorreu e como resolver.
- Evite textos vagos ("Clique aqui", "Enviar" sem contexto).

## Responsividade e acessibilidade
- Sempre considere responsividade para mobile, tablet e desktop.
- Foco visível para todos os elementos interativos.
- Labels e `aria-label` quando necessário; semântica HTML correta (`<button>`, `<a>`).
- Contraste adequado para texto e estados (erro/sucesso/desabilitado).
- Tamanho mínimo de alvo (touch) e navegação por teclado sem armadilhas.
- `aria-*` apenas quando necessário e corretamente; sem `aria-label` redundante quando já existe texto visível.

## Estados e formulários
- Sempre tratar estados de `loading`, `empty`, `error`, `success` e `disabled` em telas com dados assíncronos.
- Loading deve preservar layout (skeleton/spinner) e evitar "pulos" de conteúdo.
- `hover/active/focus/disabled` consistentes em todos os componentes interativos.
- Confirmações e toasts apenas quando agregarem clareza real.
- Ao criar formulários, valide entradas e exiba mensagens de erro claras e específicas.
