---
name: impeccable-ui-ux
description: >-
  Skill unificada de UI/UX de elite. Cobre três contextos: (1) direção estética arrojada
  antes de codificar — tom, tipografia, cor, movimento, composição e textura;
  (2) implementação de nova tela reaproveitando design system existente — padrões,
  estados completos e responsividade; (3) checklist de acessibilidade e interação —
  foco, teclado, semântica, ARIA e contraste. Use quando o usuário pedir conceito visual,
  redesign, nova tela, componente, revisão de UI ou auditoria de acessibilidade.
disable-model-invocation: true
---

# Impeccable UI/UX — Huashu Design Pro Max

## Prioridades (não negociáveis)

1. **Acessibilidade e legibilidade** vêm antes da estética — contraste, foco, tamanhos mínimos, `prefers-reduced-motion`.
2. **Estética arrojada** entra depois de cumprir WCAG AA básico e usabilidade — explicar trade-offs se o visual competir com a11y.
3. **Coerência com o projeto** — reusar componentes, tokens e padrões existentes antes de criar qualquer coisa nova.
4. Usar **Context7** para APIs de frameworks, animação e CSS quando houver dúvida de sintaxe ou suporte.

---

## Contexto 1 — Direção Estética (quando não há design system definido)

### Fluxo de trabalho

1. **Contexto**: produto, público, plataforma (web app, marketing, dashboard), referências visuais citadas.
2. **Direção em uma frase**: o que a interface deve "sentir" e por quê — não só adjetivos soltos.
3. **Tom**: escolher UM extremo e comprometer — brutalmente minimal, maximalista, retrofuturista, orgânico/natural, luxuoso/refinado, editorial/magazine, brutalist/raw, art déco, soft/pastel, industrial/utilitário.
4. **Pilares** (escolher e justificar):
   - Tipografia: hierarquia, pares de fontes, escala modular.
   - Cor: primária/secundária/neutra, estados (hover, erro, sucesso), modo escuro se aplicável.
   - Movimento: duração, easing, decorativo vs. feedback funcional.
   - Composição: grid, ritmo vertical, densidade (dashboard vs. landing).
   - Textura: gradientes sutis, ruído, bordas, sombras — com moderação para performance.
5. **Tokens**: mapear para CSS variables (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, `--motion-*`) alinhados ao design system existente; se não houver, propor conjunto mínimo.
6. **Entregável**: mood + decisões + checklist de implementação. Não implementar até o usuário pedir — salvo se a tarefa for só implementação.

### Tipografia
- Escolher fontes **belas, únicas e inesperadas** — que elevem a estética.
- **NUNCA** usar Inter, Roboto, Arial ou system-ui como fonte de display principal.
- Parear uma **fonte de display distintiva** com uma **fonte de corpo refinada**.
- Variar o par por projeto — nunca convergir para o mesmo stack (ex.: não repetir Space Grotesk por padrão).
- Usar tamanho, peso e tracking para criar hierarquia — não só bold/normal.
- Tipografia decorativa só em headings e displays, nunca em corpo de texto.

### Cor & Tema
- Paleta coesa via CSS custom properties.
- Cor dominante com acentos intencionais — evitar paletas tímidas e igualmente distribuídas.
- Definir explicitamente: primária, secundária, neutras, estados (hover, erro, sucesso, disabled).
- Dark mode considerado sempre, mesmo que apenas light seja entregue.
- Background com **atmosfera**: gradient mesh, ruído sutil, padrão geométrico ou transparência em camadas — com moderação para performance.

### Movimento
- Animação para **momentos significativos**: reveal de entrada, hover, transições de estado.
- Um entrance animation bem coreografado (staggered via `animation-delay`) > micro-animações espalhadas.
- CSS-only para HTML/CSS; `framer-motion` para React.
- Respeitar `prefers-reduced-motion` — sempre.
- Jamais animar para decoração pura — todo movimento deve comunicar algo.

### Composição Espacial
- Quebrar layouts previsíveis: assimetria, sobreposição, fluxo diagonal, elementos que quebram o grid.
- Alternar entre espaço negativo generoso e densidade controlada — nunca meio-termo sem intenção.
- Pensar em camadas: foreground (conteúdo), mid-layer (acentos), background (atmosfera).

### Tokens mínimos sugeridos (quando não há design system)
```css
:root {
  --color-primary: ; --color-primary-hover: ; --color-secondary: ;
  --color-neutral-50: ; /* … até --color-neutral-900 */
  --color-success: ; --color-error: ; --color-warning: ; --color-info: ;

  --font-display: ; --font-body: ; --font-mono: ;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;

  --motion-fast: 150ms ease; --motion-base: 250ms ease; --motion-slow: 400ms ease;
}
```

---

## Contexto 2 — Implementação de Nova Tela (com design system existente)

### Fluxo de trabalho

1. **Descobrir padrões existentes**
   - Mapear telas parecidas e copiar estrutura (layout, headings, listas, forms).
   - Listar componentes reutilizáveis: Card, Button, Input, Table, Dialog, Toast.
   - Identificar tokens: spacing, radius, cores, tipografia, breakpoints.

2. **Definir layout e hierarquia**
   - Header com título + descrição curta.
   - Área principal com conteúdo (lista/tabela/form) e 1 CTA primário.
   - Ações secundárias em menu/toolbar quando fizer sentido.

3. **Estados completos — obrigatórios**
   - `loading`: skeleton ou placeholder consistente com o projeto.
   - `empty`: mensagem clara + ação sugerida.
   - `error`: mensagem útil + retry se aplicável.
   - `disabled/submitting`: evitar double-submit, mostrar progresso.

4. **Responsividade**
   - Mobile-first: colunas viram stack, tabelas com overflow controlado.
   - CTAs e inputs confortáveis em touch (mínimo 44px de área de toque).

5. **Integração**
   - Garantir que a tela compila.
   - Rodar lint/test ou deixar comandos prontos.

---

## Contexto 3 — Acessibilidade e Interação

### Navegação por teclado
- Tab percorre elementos interativos em ordem lógica.
- Modais e drawers prendem foco corretamente e permitem sair (Esc).
- Enter para submit, Esc para fechar — atalhos naturais implementados.

### Foco
- Foco sempre visível — nunca remover outline sem alternativa clara.
- Foco vai para o lugar certo após ações (abrir modal, validar form, navegar).

### Semântica e formulários
- Elementos semânticos corretos: `button`, `a`, `label`, `fieldset/legend`.
- Inputs sempre com label visível ou associado corretamente.
- Erros ligados ao campo via `aria-describedby` com instrução do que fazer.

### ARIA (usar com precisão)
- Só usar ARIA quando a semântica nativa não resolver.
- Evitar `aria-label` redundante quando já existe texto visível.
- Tabs, combobox, dialog: seguir padrões ARIA conhecidos (APG).

### Contraste e legibilidade
- Texto e ícones com contraste WCAG AA mínimo (4.5:1 para corpo, 3:1 para UI).
- Tamanhos mínimos legíveis, `line-height` confortável.
- Estado `disabled` com contraste claro e motivo quando relevante.

### Estados e feedback
- `loading`: comunicar progresso sem bloquear teclado.
- Mensagens (toast/alert) nunca são a única forma de feedback para ações críticas — garantir alternativa inline.
- Não depender apenas de hover para revelar ações.
- Alvo de toque confortável para botões e itens de lista (mínimo 44px).

---

## Anti-padrões

- Gradiente roxo em fundo branco (clichê universal de AI).
- Inter/Roboto/Arial como fonte de display.
- Card com drop shadow e cantos arredondados como única decisão de design.
- Hero section genérico: título centralizado + subtítulo + dois CTAs em fundo liso.
- Criar estilos "soltos" quando já existe componente/token no projeto.
- UI bonita sem estados (sem loading/empty/error).
- Copy genérica ("Enviar", "Ok") sem contexto.
- Animação que atrasa tarefas ou esconde conteúdo essencial.
- Tipografia decorativa ilegível em corpo de texto.
- Depender apenas de hover para revelar ações.

---

## Checklist Final

- [ ] Fonte de display distintiva, nunca Inter/Roboto/Arial
- [ ] Paleta com lógica dominante + acento em CSS variables
- [ ] Pelo menos uma decisão de layout que quebra o grid previsível
- [ ] Animações respeitam `prefers-reduced-motion`
- [ ] Background tem atmosfera, não apenas cor sólida
- [ ] Dark mode considerado
- [ ] Estados completos: loading, empty, error, disabled
- [ ] Foco visível em todos os elementos interativos
- [ ] Inputs com labels; erros com `aria-describedby`
- [ ] Área de toque mínima 44px em mobile
- [ ] Nenhum estilo novo criado quando componente/token já existe
- [ ] Copy contextual e significativa
