# Skill — Pagamento (SaaS)

## Visão Geral

Integração de pagamentos em SaaS envolve cobrança recorrente (assinaturas), gestão de planos, webhooks e controle de status de pagamento. Esta skill cobre os dois gateways mais comuns para projetos brasileiros.

| Gateway | Melhor para | Suporte a |
|---|---|---|
| **Stripe** | Projetos internacionais ou com cartão | Cartão, PIX (beta), boleto |
| **Asaas** | Projetos brasileiros | PIX, boleto, cartão, carnê |

---

## 1. Conceitos Fundamentais

```
Customer     → representa o cliente (tenant) no gateway
Product      → o produto SaaS (ex: "Plano Pro")
Price        → valor e recorrência do produto (ex: R$99/mês)
Subscription → assinatura ativa do customer em um price
Invoice      → fatura gerada por período da assinatura
Webhook      → notificação do gateway para sua API sobre eventos
```

---

## 2. Stripe

### Instalação

```bash
npm install stripe
npm install --save-dev @types/stripe
```

### Configuração (NestJS)

```typescript
// src/common/stripe/stripe.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  getClient(): Stripe {
    return this.stripe;
  }
}
```

### Variáveis de ambiente

```env
STRIPE_SECRET_KEY=sk_live_...        # nunca expor no frontend
STRIPE_WEBHOOK_SECRET=whsec_...      # para validar webhooks
STRIPE_PUBLIC_KEY=pk_live_...        # seguro para o frontend
```

### Fluxo completo de assinatura

```typescript
// 1. Criar Customer ao cadastrar o tenant
async createCustomer(email: string, name: string): Promise<string> {
  const customer = await this.stripe.getClient().customers.create({
    email,
    name,
  });
  return customer.id; // salvar no tenant: gatewayCustomerId
}

// 2. Criar Subscription (no fim do trial ou ao escolher plano)
async createSubscription(
  customerId: string,
  priceId: string, // ID do Price no Stripe (configurado no dashboard)
): Promise<Stripe.Subscription> {
  return await this.stripe.getClient().subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}

// 3. Cancelar Subscription
async cancelSubscription(subscriptionId: string): Promise<void> {
  await this.stripe.getClient().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true, // cancela no fim do período pago
  });
}

// 4. Trocar de plano (upgrade/downgrade)
async changePlan(
  subscriptionId: string,
  subscriptionItemId: string,
  newPriceId: string,
): Promise<void> {
  await this.stripe.getClient().subscriptions.update(subscriptionId, {
    items: [{ id: subscriptionItemId, price: newPriceId }],
    proration_behavior: 'always_invoice', // cobra/credita a diferença
  });
}
```

### Webhooks do Stripe

```typescript
// src/webhooks/stripe.controller.ts
@Controller('webhooks/stripe')
export class StripeWebhookController {
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripe.getClient().webhooks.constructEvent(
        req.rawBody,           // body cru (não parseado)
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new BadRequestException('Webhook inválido');
    }

    switch (event.type) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
    }

    return { received: true };
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Atualizar Subscription.status = ACTIVE, Tenant.status = ACTIVE
  }

  private async handleInvoiceFailed(invoice: Stripe.Invoice) {
    // Atualizar Subscription.status = PAST_DUE
  }

  private async handleSubscriptionCancelled(sub: Stripe.Subscription) {
    // Atualizar Tenant.status = CANCELLED
  }
}
```

### Habilitar rawBody no NestJS (obrigatório para webhooks)

```typescript
// src/main.ts
const app = await NestFactory.create(AppModule, {
  rawBody: true, // necessário para validar assinatura do webhook
});
```

---

## 3. Asaas (Brasil)

### Instalação

```bash
npm install axios # Asaas não tem SDK oficial — usar HTTP direto
```

### Configuração

```typescript
// src/common/asaas/asaas.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AsaasService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.ASAAS_ENV === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3',
      headers: {
        access_token: process.env.ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
    });
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}
```

### Variáveis de ambiente

```env
ASAAS_API_KEY=$aas_...    # chave da API Asaas
ASAAS_ENV=sandbox          # sandbox | production
```

### Fluxo de assinatura no Asaas

```typescript
// 1. Criar Customer
async createCustomer(data: {
  name: string;
  email: string;
  cpfCnpj: string;
}): Promise<string> {
  const response = await this.asaas.getClient().post('/customers', data);
  return response.data.id; // salvar no tenant: gatewayCustomerId
}

// 2. Criar Subscription (assinatura recorrente)
async createSubscription(data: {
  customer: string;      // ID do customer no Asaas
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;         // valor em R$
  nextDueDate: string;   // data da primeira cobrança (YYYY-MM-DD)
  cycle: 'MONTHLY' | 'YEARLY';
  description: string;
}): Promise<string> {
  const response = await this.asaas.getClient().post('/subscriptions', data);
  return response.data.id;
}

// 3. Cancelar Subscription
async cancelSubscription(subscriptionId: string): Promise<void> {
  await this.asaas.getClient().delete(`/subscriptions/${subscriptionId}`);
}
```

### Webhooks do Asaas

```typescript
// src/webhooks/asaas.controller.ts
@Controller('webhooks/asaas')
export class AsaasWebhookController {
  @Post()
  async handleWebhook(@Body() body: any) {
    const { event, payment, subscription } = body;

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        // Subscription.status = ACTIVE, Tenant.status = ACTIVE
        break;
      case 'PAYMENT_OVERDUE':
        // Subscription.status = PAST_DUE
        break;
      case 'SUBSCRIPTION_DELETED':
        // Tenant.status = CANCELLED
        break;
    }

    return { received: true };
  }
}
```

---

## 4. Mapeamento de Eventos → Status do Sistema

Independente do gateway, mapeie os eventos para os mesmos status internos:

| Evento Gateway | Status Subscription | Status Tenant |
|---|---|---|
| Pagamento confirmado | `ACTIVE` | `ACTIVE` |
| Pagamento atrasado | `PAST_DUE` | `ACTIVE` (grace period) |
| Atraso > N dias | `PAST_DUE` | `SUSPENDED` |
| Assinatura cancelada | `CANCELLED` | `CANCELLED` |
| Trial expirado sem pagamento | — | `SUSPENDED` |

---

## 5. Serviço de Billing (NestJS)

Centraliza a lógica de cobrança independente do gateway.

```typescript
// src/billing/billing.service.ts
@Injectable()
export class BillingService {
  async handlePaymentSuccess(gatewayCustomerId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { gatewayCustomerId },
    });

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.subscription.update({
      where: { tenantId: tenant.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 1),
      },
    });
  }

  async handlePaymentFailed(gatewayCustomerId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { gatewayCustomerId },
    });

    await this.prisma.subscription.update({
      where: { tenantId: tenant.id },
      data: { status: 'PAST_DUE' },
    });

    // Suspende após grace period (ex: 7 dias)
    await this.scheduleSuspension(tenant.id, 7);
  }

  async handleCancellation(gatewayCustomerId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { gatewayCustomerId },
    });

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'CANCELLED' },
    });
  }
}
```

---

## 6. Ciclo de Status do Tenant

```
[Cadastro] → TRIAL → ACTIVE → PAST_DUE → SUSPENDED
               │                              │
               │  (trial expirado)            │ (pagamento regularizado)
               └──────→ SUSPENDED             └──→ ACTIVE
                                                      │
                                          (cancelamento)
                                                      ↓
                                                  CANCELLED
```

---

## 7. Checklist de Validação

- [ ] `STRIPE_SECRET_KEY` / `ASAAS_API_KEY` estão apenas no backend?
- [ ] Webhook valida assinatura antes de processar (Stripe: `constructEvent`)?
- [ ] `rawBody: true` está habilitado no NestJS para webhooks Stripe?
- [ ] Todos os eventos de pagamento mapeiam para status internos?
- [ ] Grace period está configurado antes de suspender por atraso?
- [ ] `gatewayCustomerId` está salvo no tenant para correlacionar webhooks?
- [ ] Ambiente `sandbox`/`test` está sendo usado em desenvolvimento?
- [ ] Cancelamento usa `cancel_at_period_end: true` (não cancela imediatamente)?

---

## 8. Erros Comuns

| Erro | Causa | Solução |
|---|---|---|
| Webhook retorna 400 | Body parseado (não raw) | Habilitar `rawBody: true` no NestJS |
| `No signatures found` | Header de assinatura ausente | Verificar `stripe-signature` no header |
| Pagamento duplicado processado | Webhook sem idempotência | Verificar se já processou pelo ID do evento |
| Tenant não encontrado no webhook | `gatewayCustomerId` não salvo | Salvar ID do gateway ao criar o customer |
| Sandbox cobrando real | Env errado | Verificar `STRIPE_ENV` / `ASAAS_ENV` |

---

*Skill genérica — aplicável a qualquer projeto SaaS com cobrança recorrente*
*Cobre: Stripe · Asaas · Webhooks · NestJS · Ciclo de status de assinatura*
