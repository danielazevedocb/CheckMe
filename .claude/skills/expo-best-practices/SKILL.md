---
name: expo-best-practices
description: >
  Guia de boas práticas para desenvolvimento mobile com Expo. Use esta skill sempre que o usuário
  pedir orientação sobre: estrutura de projeto Expo, navegação com Expo Router, gerenciamento de
  estado com TanStack Query, estilização com NativeWind, performance em React Native, ou qualquer
  decisão de arquitetura em projetos Expo + TypeScript.

  Ative especialmente quando o usuário mencionar: "como organizar", "estrutura de pastas", "melhor
  forma de fazer", "como usar expo router", "tanstack query no mobile", "nativewind", "performance",
  "flatlist", "re-renders", "state management", ou quando estiver criando um novo projeto Expo.
---

# Boas Práticas — Expo (Expo Router + TypeScript + React Query + NativeWind)

## Stack de referência

- **Expo SDK** (latest) com **Expo Router** (file-based routing)
- **TypeScript** estrito
- **TanStack Query v5** para dados assíncronos
- **NativeWind v4** para estilização
- Estado local/global leve com `useState` / `useReducer` / Context

---

## 1. Estrutura de projeto

Organizar o projeto de forma que cada camada tenha uma responsabilidade única. Uma estrutura que funciona bem em projetos médios e grandes:

```
app/                        ← rotas (Expo Router — não colocar lógica aqui)
  (auth)/
    login.tsx
    register.tsx
  (app)/
    _layout.tsx
    index.tsx
    profile/
      index.tsx
      [id].tsx
  _layout.tsx               ← providers globais, fonts, splash screen

src/
  components/               ← componentes reutilizáveis (sem lógica de negócio)
    ui/                     ← primitivos (Button, Input, Card, etc.)
    shared/                 ← compostos reutilizáveis (UserAvatar, ErrorBoundary, etc.)
  features/                 ← módulos por funcionalidade
    auth/
      components/           ← componentes usados só nesta feature
      hooks/                ← useLogin, useRegister, etc.
      api.ts                ← funções de fetch / mutations para esta feature
      types.ts
    profile/
      components/
      hooks/
      api.ts
      types.ts
  hooks/                    ← hooks genéricos (useDebounce, useNetworkStatus)
  lib/                      ← configurações de libs (queryClient, axios instance)
  types/                    ← tipos globais e utilitários TypeScript
  constants/                ← cores, tamanhos, strings constantes
  utils/                    ← funções puras sem side effects

assets/                     ← imagens, fontes, ícones
```

**Regras importantes:**
- Arquivos dentro de `app/` são só rotas — importam de `src/`, não contêm lógica diretamente.
- Cada feature em `src/features/` é auto-suficiente: seus hooks, componentes e tipos vivem juntos.
- `src/components/ui/` deve ser totalmente "dumb" — sem chamadas de API, sem contexto de negócio.

---

## 2. Expo Router

### Layouts e providers globais

O `app/_layout.tsx` é o ponto de entrada. Coloque todos os providers aqui:

```tsx
// app/_layout.tsx
import '@/globals.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
```

### Route groups para separar autenticação

Use route groups `(auth)` e `(app)` para manter layouts separados sem afetar a URL:

```
app/
  (auth)/
    _layout.tsx   ← layout sem tab bar, sem header autenticado
    login.tsx
  (app)/
    _layout.tsx   ← layout com tab bar e header + proteção de rota
    index.tsx
```

A proteção de rotas (redirect se não autenticado) deve viver no `_layout.tsx` do grupo `(app)`, não espalhada por cada tela:

```tsx
// app/(app)/_layout.tsx
export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack />;
}
```

### Rotas tipadas

Habilite rotas tipadas no `app.json` para type-safety nos links:

```json
{
  "expo": {
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Use `router.push('/profile/123')` — o TypeScript aponta erros se a rota não existir.

### Navegação programática vs declarativa

- `<Link>` para links visíveis no JSX.
- `useRouter()` para navegação com lógica (ex: após login, após submit de formulário).

```tsx
const router = useRouter();
// Após login bem-sucedido:
router.replace('/(app)/');
```

### Parâmetros de rota tipados

```tsx
// app/(app)/profile/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // ...
}
```

---

## 3. TanStack Query (React Query)

### Configuração do QueryClient

Centralize em `src/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 min
      retry: 2,
      refetchOnWindowFocus: false,  // no mobile gera comportamentos estranhos
    },
  },
});
```

### Organização de queries por feature

Cada feature tem seu `api.ts` com as funções de fetch e um hook que encapsula o useQuery:

```ts
// src/features/profile/api.ts
export async function fetchProfile(id: string): Promise<Profile> {
  const response = await apiClient.get(`/profiles/${id}`);
  return response.data;
}

// src/features/profile/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '../api';
import { profileKeys } from '../queryKeys';

export function useProfile(id: string) {
  return useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: () => fetchProfile(id),
    enabled: !!id,
  });
}
```

### Query keys como constantes

Centralizar as query keys evita typos e facilita invalidação:

```ts
// src/features/profile/queryKeys.ts
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (id: string) => ['profiles', id] as const,
  list: (filters: object) => ['profiles', 'list', filters] as const,
};
```

### Mutations com invalidação

```ts
export function useUpdateProfile() {
  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
    },
  });
}
```

### TanStack Query é para estado do servidor

Não use `useQuery` para estado de UI (modal aberto, filtro selecionado, valor de input). Para isso, use `useState` ou `useReducer` local.

---

## 4. NativeWind

### Setup essencial

Importe o CSS global no root `_layout.tsx`:

```tsx
import '@/globals.css';
```

### Classes dinâmicas

NativeWind não suporta classes montadas por interpolação de string em runtime. Use objetos de variante com as classes completas:

```tsx
// ✅ Certo — classes completas conhecidas em build time
const variantClasses = {
  primary: 'bg-blue-500',
  danger: 'bg-red-500',
  ghost: 'bg-transparent',
};
<View className={variantClasses[variant]} />

// ❌ Errado — NativeWind não consegue processar isso
<View className={`bg-${color}-500`} />
```

### Componentes base tipados

Crie wrappers com variantes explícitas para os primitivos mais usados:

```tsx
// src/components/ui/Button.tsx
type Variant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 active:bg-blue-700',
  secondary: 'bg-gray-100 active:bg-gray-200',
  ghost: 'bg-transparent',
};

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  label: string;
}

export function Button({ variant = 'primary', label, className, ...props }: ButtonProps) {
  return (
    <TouchableOpacity
      className={`px-4 py-3 rounded-xl items-center ${variantClasses[variant]} ${className ?? ''}`}
      {...props}
    >
      <Text className="font-semibold text-white">{label}</Text>
    </TouchableOpacity>
  );
}
```

---

## 5. Performance

### FlatList — checklist de otimização

```tsx
const renderItem = useCallback(({ item }: ListRenderItemInfo<Item>) => (
  <ItemCard item={item} />
), []);

<FlatList
  data={items}
  keyExtractor={(item) => item.id}     // string estável e única
  renderItem={renderItem}              // useCallback, fora do JSX
  getItemLayout={(_, index) => ({      // se altura é fixa — elimina measurement
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  initialNumToRender={8}
/>
```

Componentes de item devem ser memoizados:

```tsx
const ItemCard = React.memo(({ item }: { item: Item }) => {
  return <View>...</View>;
});
```

### Evitar re-renders

- `useCallback` para handlers passados como props.
- `useMemo` para valores computados que envolvam objetos/arrays.
- Dividir Context em dois: um para estado (leitura), outro para dispatch/actions — quem só precisa de dispatch não re-renderiza quando o estado muda.
- Passe valores primitivos como props em vez de objetos inteiros quando possível.

### Imagens remotas

Prefira `expo-image` ao `<Image>` padrão — tem cache nativo, placeholder com blur hash e transição suave:

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: url }}
  contentFit="cover"
  transition={200}
  placeholder={{ blurhash }}
/>
```

### Hermes está ativo por padrão

A partir do Expo SDK 48, Hermes é o engine JS padrão. Não desative — ele melhora tempo de startup e consumo de memória significativamente.

---

## 6. TypeScript

### tsconfig recomendado

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tipar variáveis de ambiente

```ts
// src/types/env.d.ts
declare module '@env' {
  export const API_URL: string;
  export const APP_ENV: 'development' | 'staging' | 'production';
}
```

### Compor tipos de componentes nativos

```tsx
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
}
```

### Evite `any`

Quando for um dado externo (resposta de API), use Zod para validar em runtime e inferir o tipo:

```ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
```

---

## 7. Checklist para novas features

Ao implementar uma nova feature, siga esta ordem para manter consistência:

1. **Tipos** — `src/features/<nome>/types.ts`
2. **API** — `src/features/<nome>/api.ts` (funções puras de fetch/mutation)
3. **Query keys** — `src/features/<nome>/queryKeys.ts`
4. **Hooks** — `src/features/<nome>/hooks/` (encapsulam useQuery/useMutation)
5. **Componentes** — `src/features/<nome>/components/`
6. **Rota** — arquivo em `app/` que importa e compõe os hooks e componentes
7. **Verificação** — `tsc --noEmit` antes de marcar como pronto

---

## Referência rápida — padrões a evitar

| Evitar | Preferir |
|---|---|
| Lógica de negócio em `app/` (rotas) | Hooks e componentes em `src/features/` |
| Classes NativeWind com interpolação (`bg-${color}-500`) | Objetos de variante com classes completas |
| `useQuery` para estado de UI | `useState` / `useReducer` |
| `<Image>` do RN para imagens remotas | `expo-image` |
| `any` no TypeScript | Tipos explícitos ou inferência via Zod |
| `renderItem` inline sem `useCallback` | `useCallback` fora do return do componente |
| Omitir `getItemLayout` em listas com altura fixa | Sempre fornecer quando a altura é conhecida |
| Proteção de rota em cada tela | `_layout.tsx` do route group cuida do redirect |
