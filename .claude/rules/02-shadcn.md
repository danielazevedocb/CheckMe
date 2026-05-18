---
description: Regras para uso de shadcn/ui + Magic UI
globs:
  - "app/**/*.tsx"
  - "src/**/*.tsx"
  - "components/**/*.tsx"
alwaysApply: false
---

- Prefira reutilizar componentes existentes antes de criar novos.
- Ao construir interfaces, prefira compor com componentes do shadcn/ui quando fizer sentido.
- Use Magic UI como camada de efeitos/showcase (animações, destaques, backgrounds), mantendo shadcn/ui como base de interação (Button, Input, Dialog, Dropdown, Form, etc.).
- Evite ter duas fontes para o "mesmo" componente; se Magic UI fornecer uma variação visual, prefira empacotar o shadcn/ui em vez de duplicar API/estilos.
- Mantenha consistência visual entre buttons, cards, dialogs, forms, dropdowns, sheets, tables e inputs.
- Use Tailwind CSS de forma organizada, legível e sem excesso de classes duplicadas.
- Preserve tokens/tema do projeto (cores, radius, sombras, tipografia). Ao integrar Magic UI, adapte classes para respeitar o tema atual em vez de introduzir paletas novas.
- Preserve acessibilidade, foco visível, labels, descrições e feedback visual de erro.
- Quando adicionar animações/efeitos do Magic UI, respeite `prefers-reduced-motion` e evite animações em formulários e ações destrutivas.
- Ao alterar componentes existentes, mantenha o padrão visual e estrutural já usado no projeto.
