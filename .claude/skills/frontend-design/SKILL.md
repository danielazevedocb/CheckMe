---
name: frontend-design
description: >-
  Define direção estética e de UI antes de codificar (estilo brutalista, maximalista,
  retrofuturista, luxuoso, lúdico, minimal técnico, etc.) com propósito, tom e
  diferenciação claros. Cobre tipografia, paleta, movimento, composição espacial e
  textura via CSS variables, animações e efeitos ligados à rolagem. Use quando o
  usuário pedir conceito visual, redesign, identidade de interface ou "look & feel"
  antes da implementação — especialmente quando ainda não há design system definido.
disable-model-invocation: true
---

# Frontend Design

## Prioridade (alinhar com as rules do projeto)

1. **Acessibilidade e legibilidade** não são negociáveis: contraste, foco, tamanhos mínimos, redução de movimento quando o usuário preferir (`prefers-reduced-motion`).
2. **Estética arrojada** entra depois de cumprir WCAG básico e usabilidade — explicar trade-offs se o visual competir com a11y.
3. Usar **Context7** para APIs de frameworks, animação e CSS quando houver dúvida de sintaxe ou suporte.

## Fluxo de trabalho

1. **Contexto**: produto, público, plataforma (web app, marketing, dashboard), referências visuais citadas pelo usuário.
2. **Direção em uma frase**: o que a interface deve "sentir" e por quê (não só adjetivos soltos).
3. **Pilares** (escolher e justificar):
   - Tipografia: hierarquia, pares de fontes, escala modular.
   - Cor: primária/secundária/neutra, estados (hover, erro, sucesso), modo escuro se aplicável.
   - Movimento: duração, easing, o que é decorativo vs. feedback funcional.
   - Composição: grid, ritmo vertical, densidade (dashboard vs. landing).
   - Textura: gradientes sutis, ruído, bordas, sombras — com moderação para performance.
4. **Tokens**: mapear para **CSS variables** (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, `--motion-*`) alinhados ao design system existente; se não houver, propor conjunto mínimo.
5. **Rolagem**: só usar efeitos "on scroll" se melhorarem compreensão ou delight sem atrapalhar leitura; respeitar `prefers-reduced-motion`.
6. **Entregável**: mood + decisões + checklist de implementação (o que mudar no código), sem implementar até o usuário pedir — salvo se a tarefa for só implementação.

## Anti-padrões

- Animação que atrasa tarefas ou esconde conteúdo essencial.
- Tipografia decorativa ilegível em corpo de texto.
- Paleta sem contraste suficiente para texto e componentes interativos.
