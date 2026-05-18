---
description: Frontend — evitar “UI com cara de IA” (microcopy, hierarquia, estados)
globs:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
  - "components/**/*.ts"
  - "components/**/*.tsx"
  - "components/**/*.js"
  - "components/**/*.jsx"
  - "pages/**/*.ts"
  - "pages/**/*.tsx"
  - "pages/**/*.js"
  - "pages/**/*.jsx"
alwaysApply: false
---

- **Sem “layout genérico”**: evite cartões empilhados sem hierarquia, muito espaço vazio sem propósito, ou tudo centralizado por padrão. Dê estrutura: título → explicação → ação principal → ações secundárias.
- **Microcopy humano e específico**:
  - Evite “Lorem / placeholder genérico” e textos vagos (“Clique aqui”, “Enviar” sem contexto).
  - Use verbos claros + objeto (“Salvar alterações”, “Criar conta”, “Adicionar ao carrinho”).
  - Mensagens de erro devem dizer *o que ocorreu* e *como resolver*.
- **Hierarquia visual intencional**:
  - Defina 1 CTA primário por seção.
  - Use peso/tamanho/contraste para guiar o olhar; não dependa só de cor.
  - Evite muitas bordas e sombras para “separar” tudo; prefira espaçamento e tipografia.
- **Densidade e ritmo**: escolha densidade (compacta vs. confortável) e aplique em toda a tela (inputs, listas, cards, tabelas).
- **Estados e feedback**:
  - `hover/active/focus/disabled` consistentes.
  - Loading deve preservar layout (skeleton/spinner onde faz sentido) e evitar “pulos” de conteúdo.
  - Confirmações e toasts apenas quando agregarem clareza.
- **Coerência de componentes**:
  - Não crie variações “quase iguais” de botões/inputs. Se precisar, estenda o componente do design system.
  - Iconografia: mesma família, espessura e alinhamento.
- **Acessibilidade aplicada à interação**:
  - Tamanho mínimo de alvo (touch) e navegação por teclado sem armadilhas.
  - `aria-*` só quando necessário e corretamente; sem “aria-label” redundante quando já existe texto visível.
