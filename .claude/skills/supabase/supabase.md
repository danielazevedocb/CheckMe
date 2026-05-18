# Skill — Supabase

## Visão Geral

Supabase é uma plataforma open-source que combina PostgreSQL, autenticação, storage de arquivos e comunicação em tempo real em um único serviço. É usado como backend-as-a-service em projetos que precisam de banco de dados, auth e realtime sem gerenciar infraestrutura.

| Recurso | O que faz |
|---|---|
| **PostgreSQL** | Banco relacional principal, acessado via Prisma ou SDK |
| **Auth** | Autenticação com JWT, email/senha, OAuth, magic link |
| **Storage** | Upload e servir arquivos (imagens, PDFs, etc.) |
| **Realtime** | Escuta mudanças no banco em tempo real via WebSocket |

---

## 1. Configuração Inicial

### Variáveis de ambiente obrigatórias

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJ...         # chave pública (frontend/mobile)
SUPABASE_SERVICE_ROLE_KEY=eyJ... # chave privada (backend apenas — nunca expor)
DATABASE_URL=postgresql://...    # conexão direta para Prisma
```

### Instalação

```bash
npm install @supabase/supabase-js
```

### Cliente no backend (NestJS)

```typescript
// src/common/supabase/supabase.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // service role no backend
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
```

### Cliente no frontend (Next.js)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // anon key no frontend
);
```

### Cliente no mobile (Expo)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,        // persistência no dispositivo
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
```

---

## 2. Auth — Autenticação

### Registro e login (backend NestJS)

```typescript
// Registro
const { data, error } = await supabase.auth.admin.createUser({
  email: dto.email,
  password: dto.password,
  email_confirm: true, // confirma e-mail automaticamente
});

// Login (retorna JWT)
const { data, error } = await supabase.auth.signInWithPassword({
  email: dto.email,
  password: dto.password,
});

const token = data.session.access_token; // JWT para usar nas requisições
```

### Login no frontend/mobile

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Sessão persistida automaticamente
const session = data.session;
const user = data.user;
```

### Logout

```typescript
await supabase.auth.signOut();
```

### Verificar sessão ativa

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) redirect('/login');
```

### Escutar mudanças de auth (frontend/mobile)

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') { /* usuário logou */ }
  if (event === 'SIGNED_OUT') { /* usuário deslogou */ }
  if (event === 'TOKEN_REFRESHED') { /* token renovado */ }
});
```

### Validar JWT no backend (NestJS AuthGuard)

```typescript
// Decodifica o JWT do Supabase e valida a assinatura
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) throw new UnauthorizedException();
```

---

## 3. Storage — Upload de Arquivos

### Criar bucket (via dashboard ou migration)

```sql
-- No Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('images', 'images', true); -- public = URLs públicas sem auth
```

### Upload de arquivo (backend NestJS)

```typescript
async uploadFile(
  bucket: string,
  path: string,       // ex: 'tenant-id/produto-123.jpg'
  file: Buffer,
  mimetype: string,
): Promise<string> {
  const { error } = await this.supabase.getClient()
    .storage
    .from(bucket)
    .upload(path, file, {
      contentType: mimetype,
      upsert: true, // sobrescreve se já existir
    });

  if (error) throw new Error(error.message);

  // Retorna URL pública
  const { data } = this.supabase.getClient()
    .storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}
```

### Upload direto no frontend (Next.js / React)

```typescript
async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path);

  return data.publicUrl;
}
```

### Deletar arquivo

```typescript
await supabase.storage.from('images').remove(['path/arquivo.jpg']);
```

### Boas práticas de nomenclatura de path

```
{tenantId}/{recurso}/{id}-{timestamp}.{ext}

Exemplos:
tenant-abc/products/prod-123-1716000000.jpg
tenant-abc/logos/logo-1716000000.png
```

---

## 4. Realtime — Eventos em Tempo Real

O Supabase Realtime escuta mudanças na tabela PostgreSQL (INSERT, UPDATE, DELETE) e envia via WebSocket.

### Habilitar Realtime na tabela (SQL)

```sql
-- Habilitar replication para a tabela desejada
alter publication supabase_realtime add table orders;
```

### Escutar eventos no frontend/mobile

```typescript
// Escuta INSERT, UPDATE e DELETE na tabela orders
const channel = supabase
  .channel('orders-changes')
  .on(
    'postgres_changes',
    {
      event: '*',           // INSERT | UPDATE | DELETE | *
      schema: 'public',
      table: 'orders',
      filter: `tenant_id=eq.${tenantId}`, // filtrar por tenant
    },
    (payload) => {
      console.log('Evento:', payload.eventType);
      console.log('Novo dado:', payload.new);
      console.log('Dado anterior:', payload.old);
    },
  )
  .subscribe();

// Cancelar inscrição ao desmontar o componente
return () => {
  supabase.removeChannel(channel);
};
```

### Realtime no React (hook)

```typescript
function useRealtimeOrders(tenantId: string) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        setOrders((prev) => [...prev, payload.new as Order]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        setOrders((prev) =>
          prev.map((o) => o.id === payload.new.id ? payload.new as Order : o)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId]);

  return orders;
}
```

### Realtime no Expo (React Native)

Mesmo padrão do React — usar dentro de `useEffect` com cleanup.

---

## 5. Checklist de Validação

- [ ] `SUPABASE_SERVICE_ROLE_KEY` está apenas no backend (nunca no frontend)?
- [ ] `ANON_KEY` é a única chave exposta no frontend/mobile?
- [ ] Buckets de storage estão configurados com visibilidade correta (public/private)?
- [ ] Paths de upload incluem `tenantId` para evitar colisão entre tenants?
- [ ] Realtime filtra por `tenant_id` para não vazar eventos entre tenants?
- [ ] Canais Realtime são removidos no cleanup (`removeChannel`)?
- [ ] Sessão do Expo usa `AsyncStorage` para persistência?

---

## 6. Erros Comuns

| Erro | Causa | Solução |
|---|---|---|
| `Invalid API key` | Usando service role no frontend | Usar anon key no frontend |
| Upload retorna 403 | Bucket privado sem auth | Verificar política RLS do bucket |
| Realtime não dispara | Tabela sem replication | Executar `alter publication supabase_realtime add table X` |
| Sessão não persiste no Expo | Falta AsyncStorage | Configurar `storage: AsyncStorage` no cliente |
| Eventos de outros tenants chegando | Filter ausente no canal | Adicionar `filter: tenant_id=eq.${tenantId}` |

---

*Skill genérica — aplicável a qualquer projeto com Supabase*
*Cobre: Auth · Storage · Realtime · NestJS · Next.js · Expo*
