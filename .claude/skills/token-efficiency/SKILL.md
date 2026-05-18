---
name: token-efficiency
description: >-
  Aplica estratégias de uso econômico de contexto em conversas com agentes: respostas
  enxutas, evitar dumps grandes, carregar detalhes sob demanda e referenciar skills
  em vez de repetir playbooks inteiros. Use quando o usuário pedir modo compacto,
  sessões longas ou redução de ruído no chat.
disable-model-invocation: true
---

# Token efficiency

## Para o agente

1. **Resposta proporcional**: perguntas simples → respostas curtas; só expandir com "quer detalhes?".
2. **Sem repetir**: não recitar rules/skills já carregadas; não colar o mesmo bloco em todo turno.
3. **Código**: mostrar só trechos relevantes com elisão (`...`); arquivo inteiro só se necessário.
4. **Busca**: preferir grep/leitura parcial a ler projetos inteiros; estreitar caminho antes.
5. **Múltiplas skills**: ativar só a necessária; descrever em uma linha o que outras fariam em vez de carregar todas.
6. **Listas e logs**: resumir contagens e amostras, não mil linhas.
7. **Confirmação**: uma pergunta objetiva em vez de questionário longo quando faltar um dado.

## Para o usuário (sugestão de uso)

- Pedir "modo compacto" ou "bullet points apenas".
- Anexar arquivo em vez de colar conteúdo gigante.
- Quebrar tarefas grandes em threads ou mensagens com um objetivo por vez.

## Quando não economizar

- Segurança, contratos de API, ou debug onde o erro completo importa.
- Acessibilidade e requisitos legais — não omitir por brevidade.
