# CheckMe

Aplicativo mobile em Expo para criar, acompanhar e concluir checklists com persistência local. Ele foi pensado para uso diário, permitindo alternar entre modo lista e modo texto, além de agendar datas e receber um destaque visual quando o prazo está próximo.

## Principais funcionalidades

- Criar checklists com título, itens e preços opcionais.
- Alternar entre **Modo Lista** (itens estruturados) e **Modo Texto** (cada linha vira um item marcável).
- Definir uma cor por checklist, aplicada automaticamente a todos os itens existentes e novos.
- Editar, marcar como feito ou remover itens individualmente.
- Agendar uma data para cada checklist e ver indicadores visuais de "Hoje", "Em breve" ou "Atrasado".
- Separar listas em abas **Abertas** e **Concluídas** com busca por título e indicador de progresso.
- Calcular totais gerais e somatório dos itens concluídos em tempo real.
- Suporte a tema claro/escuro com persistência da preferência do usuário.
- Banco local SQLite com migrations automáticas, retries no fallback web e repositórios tipados.

## Stack

- [Expo](https://expo.dev) + [React Native](https://reactnative.dev)
- [Expo Router](https://expo.github.io/router/docs) (navegação baseada em arquivos)
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) para persistência local
- [@react-native-community/datetimepicker](https://github.com/react-native-datetimepicker/datetimepicker) para agendamento
- TypeScript com ESLint e paths configurados (`@/`)

## Estrutura do projeto

```
app/
  (tabs)/           # Abas principais (Abertas, Concluídas, Nova)
  checklist/[id].tsx# Detalhe e edição de uma checklist existente
  config.tsx        # Tela para trocar o tema
components/
  checklist/        # Cartões e linhas de itens
  ui/               # Botões, inputs, estados vazios etc.
contexts/           # DatabaseProvider e ThemeProvider
lib/database.ts     # Migrations e abertura do SQLite
repositories/       # Regras de acesso aos dados (checklists e itens)
hooks/              # Hooks de listagem e detalhe
utils/format.ts     # Funções de formatação e datas
constants/checklist-colors.ts # Paleta disponível para os usuários
```

## Banco de dados local

- Tabela `checklists`: `title`, `mode`, `scheduled_for`, `created_at` e chave primária.
- Tabela `checklist_items`: itens com `price`, `done` e relação `checklist_id`.
- Migrations executadas na abertura do app; novos campos (`mode`, `scheduled_for`) são adicionados automaticamente.

## Temas e acessibilidade

- `ThemeProvider` controla modo claro, escuro ou sistema, persistindo a escolha no AsyncStorage.
- Componentes utilizam tokens `Colors` para garantir contraste e feedbacks consistentes.
- Botões e ícones possuem `accessibilityLabel` para leitores de tela.

## Agendamento

- Ao criar ou editar um checklist, use o ícone de calendário para escolher a data.
  - Android: abre o seletor nativo (`DateTimePickerAndroid`).
  - Web/iOS: exibimos um modal com calendário embutido.
- Cartões mostram um badge quando há agendamento: vermelho para hoje/atrasado e azul quando a data está chegando.

## Como executar

1. Pré-requisitos: Node 18+, npm e Expo CLI (opcional).
2. Instale dependências:
   ```bash
   npm install
   ```
3. Inicie o aplicativo:
   ```bash
   npx expo start
   ```
   - Utilize os atalhos do Metro para abrir no dispositivo, emulador Android ou Expo Go.

### Scripts úteis

| Script                  | Descrição                                         |
| ----------------------- | ------------------------------------------------- |
| `npm run start`         | Metro + escolha da plataforma                     |
| `npm run android`       | Inicia direto no Android (expo start)             |
| `npm run ios`           | Inicia direto no iOS (macOS)                      |
| `npm run web`           | Abre a versão web com Expo                        |
| `npm run lint`          | Executa o ESLint com as regras da Expo            |
| `npm run generate:assets` | Recria ícones, splash e favicon a partir de `assets/images/logo.png` |

### Branding e ícones

- Centralize a arte principal em `assets/images/logo.png`.
- Sempre que atualizar esse arquivo, execute `npm run generate:assets` para regerar `icon.png`, adaptive icon (foreground/background/monochrome), splash e favicon.
- As cores usadas no `app.json` seguem o mesmo gradiente aplicado aos cartões e badges do app.

## Gerar APK com EAS Build

1. Faça login (uma vez):
   ```bash
   npx eas login
   ```
2. Configure o projeto (já versionado em `eas.json`).
3. Gere um APK usando o profile `preview`:
   ```bash
   eas build -p android --profile preview
   ```
4. Após finalizar, baixe o link exibido no terminal ou no painel do EAS.

## Próximos passos sugeridos

- Implementar notificações locais para lembrar o usuário na data agendada.
- Adicionar testes de integração (por exemplo com Detox ou Playwright).
- Criar exportação/importação dos dados (backup) usando o SQLite.

## Licença

Projeto desenvolvido para fins educativos/demonstração. Adapte conforme sua necessidade.
