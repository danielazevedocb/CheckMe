---
description: Segurança em front (Next/React), mobile (Expo) e APIs (Nest, Prisma, Python)
alwaysApply: true
---

# Segurança — engenharia (Next.js, Expo, NestJS, Prisma, Python)

Prioridade: código **seguro**, escalável e manutenível. Rejeite "vibe coding" sem checagem de risco. Trabalhe como se o repositório fosse auditado amanhã.

## Princípio zero trust

- **Autorização e regras de negócio** vivem no **servidor** (API, Route Handlers, Server Actions, ORM com contexto de usuário). O cliente só **reflete** estado para UX.
- **O que roda no browser ou no bundle do app** pode ser inspecionado. **Não** use isso como barreira de segurança.
- No **Next.js**, código em **Server Components**, **Route Handlers** e trechos só de servidor **não** são o mesmo que JS enviado ao cliente — mas **qualquer** valor em `NEXT_PUBLIC_*` ou string embutida em Client Component **é** exposto.

---

## Front web (Next.js, React, shadcn)

1. **Backend / API é a fonte da verdade**
   - Estado local (Context, Zustand, etc.) é para **UX**, não para segurança.
   - Rotas ou layouts "protegidos" no `app/` são **UX**; toda chamada de dados deve assumir `401`/`403` e tratar com clareza.
   - Validação com **Zod** (ou similar) no form **complementa**; a **API** deve validar de novo.

2. **Segredos e variáveis de ambiente (risco crítico)**
   - **Nunca** coloque chaves privadas (service role, AWS, OpenAI, chaves de banco, etc.) em código de cliente ou em variáveis prefixadas para o client.
   - No Next, o paralelo de "exposto no bundle" é **`NEXT_PUBLIC_*`** e qualquer secret acidental em módulos importados por Client Components.
   - Se pedirem secret no front, **recuse** e proponha: **Route Handler**, **Server Action** (só servidor), ou **API Nest/backend** que mantenha o segredo.

3. **Vazamento de dados**
   - Não passe objetos completos da API para a UI só para mostrar um campo (ex.: evitar `password_hash`, `cpf`, tokens em props).
   - Com **Supabase/Firebase** no client, **RLS/policies** são obrigatórios; não "esconda" dado sensível só com `.filter()` no JS.

4. **XSS e DOM**
   - Evite `dangerouslySetInnerHTML`; se for inevitável, use sanitização robusta (ex.: DOMPurify) e justifique.
   - Cuidado com `{...props}` para elementos DOM nativos quando a origem não é confiável.

5. **Rotas sensíveis (admin, etc.)**
   - Use **lazy loading** / divisão de rotas quando fizer sentido, mas lembre: **ocultar rota no client não protege dados**. A **API** deve negar acesso.
   - Não coloque lógica privilegiada só em Client Component.

6. **Sessão e tokens**
   - Prefira cookies **HttpOnly** e **Secure** para sessão quando o stack permitir.
   - Se usar `localStorage` com JWT, **alerte** risco de XSS e prefira refresh com TTL curto e rotação.

---

## Mobile (Expo / React Native)

- Trate o código do app como **revisável**; não armazene secrets em código ou em env "público" embutido no app.
- Preferir **SecureStore** (ou equivalente) para tokens quando apropriado; **AsyncStorage** é menos seguro para credenciais.
- Chamadas a APIs: centralizar em clients; tratar rede, timeouts e erros sem vazar detalhes internos ao usuário final.
- Permissões (câmera, localização, etc.): pedir só quando necessário; alinhar a `app.json` / `app.config` e builds (EAS).

---

## API e dados (NestJS, Prisma, Django, FastAPI)

- **Validar toda entrada** (DTOs, Pydantic, serializers); nunca confiar no client.
- **AuthN/AuthZ** em endpoints sensíveis; erros consistentes sem expor stack traces ou dados internos em produção.
- **Prisma / ORM**: queries parametrizadas; evitar SQL cru concatenado; princípio do menor privilégio no banco quando possível.
- **Segredos**: env no servidor apenas; não commitar `.env` com secrets; rotação e escopo mínimo de chaves.
- Ao mudar schema ou contratos, considerar impacto em **migrations**, **integridade** e **vazamento** em respostas JSON (campos sensíveis).

---

## Comportamento esperado no Cursor

- **Questionar pedidos frágeis** (ex.: "salvar senha no `localStorage`", "colocar API key no `.env` público do Next").
- Ao sugerir checagem `isAdmin` / role só no front, **deixar explícito na resposta** que é só UX e que o servidor deve aplicar a política.
- Priorizar padrões **alinhados ao projeto existente** (Next, shadcn, Nest, Prisma, Django, FastAPI) e documentação atual via **Context7** quando for uso de biblioteca ou API.
