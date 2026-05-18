# Skill — QR Code

## Visão Geral

QR Codes são usados para direcionar usuários a URLs específicas sem digitação. Em sistemas SaaS, são gerados dinamicamente por recurso (mesa, produto, evento, etc.) e podem ser exportados como PNG, SVG ou PDF.

| Biblioteca | Uso | Quando usar |
|---|---|---|
| `qrcode` | Gera PNG, SVG, base64 | Backend Node.js / NestJS |
| `react-qr-code` | Renderiza SVG no browser | Frontend React / Next.js |
| `react-native-qrcode-svg` | Renderiza no app | Expo / React Native |
| `pdf-lib` + `qrcode` | Exporta QR em PDF | Geração de PDFs para impressão |

---

## 1. Instalação

```bash
# Backend (NestJS)
npm install qrcode
npm install --save-dev @types/qrcode

# Frontend (Next.js / React)
npm install react-qr-code

# Mobile (Expo)
npm install react-native-qrcode-svg react-native-svg
```

---

## 2. Geração no Backend (NestJS)

### Como string base64 (para salvar ou enviar via API)

```typescript
import * as QRCode from 'qrcode';

// Gera QR Code como base64 (PNG)
async generateQRCodeBase64(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
// Retorna: "data:image/png;base64,iVBOR..."
```

### Como Buffer (para salvar em Storage ou enviar como arquivo)

```typescript
async generateQRCodeBuffer(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
  });
}
```

### Como SVG string (escalável, ideal para PDF)

```typescript
async generateQRCodeSVG(url: string): Promise<string> {
  return await QRCode.toString(url, {
    type: 'svg',
    width: 300,
    margin: 2,
  });
}
```

### Endpoint NestJS — retorna imagem PNG

```typescript
// qrcode.controller.ts
@Get(':id/qrcode')
async getQRCode(
  @Param('id') id: string,
  @TenantId() tenantId: string,
  @Res() res: Response,
) {
  const url = await this.qrcodeService.getResourceUrl(id, tenantId);
  const buffer = await QRCode.toBuffer(url, { width: 400 });

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `inline; filename="qrcode-${id}.png"`);
  res.send(buffer);
}
```

---

## 3. Renderização no Frontend (Next.js / React)

```tsx
import QRCode from 'react-qr-code';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  label?: string;
}

export function QRCodeDisplay({ url, size = 200, label }: QRCodeDisplayProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <QRCode
        value={url}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M" // L | M | Q | H (correção de erro)
      />
      {label && <p style={{ marginTop: 8 }}>{label}</p>}
    </div>
  );
}
```

---

## 4. Renderização no Mobile (Expo)

```tsx
import QRCode from 'react-native-qrcode-svg';
import { View, Text } from 'react-native';

interface QRCodeCardProps {
  url: string;
  label?: string;
  size?: number;
}

export function QRCodeCard({ url, label, size = 200 }: QRCodeCardProps) {
  return (
    <View style={{ alignItems: 'center', padding: 16 }}>
      <QRCode
        value={url}
        size={size}
        color="#000000"
        backgroundColor="#ffffff"
        ecl="M"
      />
      {label && <Text style={{ marginTop: 8 }}>{label}</Text>}
    </View>
  );
}
```

---

## 5. Exportação em PDF (múltiplos QR Codes)

Útil para imprimir QR Codes de várias mesas/recursos de uma vez.

```typescript
// Backend — gera PDF com múltiplos QR Codes
import * as QRCode from 'qrcode';
import { PDFDocument, rgb } from 'pdf-lib';

async generateQRCodesPDF(
  items: { id: string; label: string; url: string }[],
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const item of items) {
    const page = pdfDoc.addPage([300, 350]);
    const qrBuffer = await QRCode.toBuffer(item.url, { width: 250 });
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    // Desenha o QR Code na página
    page.drawImage(qrImage, { x: 25, y: 80, width: 250, height: 250 });

    // Adiciona label abaixo
    page.drawText(item.label, {
      x: 25,
      y: 50,
      size: 16,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
```

### Endpoint para download do PDF

```typescript
@Get('qrcodes/pdf')
async downloadPDF(
  @TenantId() tenantId: string,
  @Res() res: Response,
) {
  const items = await this.service.getAllWithUrls(tenantId);
  const pdf = await this.qrcodeService.generateQRCodesPDF(items);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="qrcodes.pdf"');
  res.send(pdf);
}
```

---

## 6. Padrão de URL para QR Code

A URL embutida no QR Code deve ser estável, curta e conter o identificador do recurso.

```
# Padrão recomendado
https://{dominio}/{tenant-slug}/{recurso}?{param}={id}

# Exemplos
https://app.com/restaurante-abc/menu?table=mesa-01
https://app.com/evento-xyz/checkin?ticket=ticket-456
https://app.com/loja-123/produto?id=prod-789
```

**Boas práticas:**
- Use slugs legíveis no lugar de UUIDs quando possível
- Mantenha a URL curta — QR Codes menores são mais fáceis de escanear
- A URL deve funcionar sem autenticação (acesso público)
- Nunca inclua dados sensíveis na URL

---

## 7. Salvando QR Code no Storage

Em vez de gerar o QR Code a cada request, gere uma vez e salve no storage.

```typescript
async createResourceWithQRCode(dto: CreateDto, tenantId: string) {
  // 1. Cria o recurso no banco
  const resource = await this.prisma.resource.create({
    data: { ...dto, tenantId },
  });

  // 2. Gera a URL do QR Code
  const url = `https://app.com/${dto.slug}?id=${resource.id}`;

  // 3. Gera o QR Code como buffer
  const buffer = await QRCode.toBuffer(url, { width: 400 });

  // 4. Salva no Storage
  const path = `${tenantId}/qrcodes/${resource.id}.png`;
  await this.storageService.upload('qrcodes', path, buffer, 'image/png');

  // 5. Atualiza o registro com a URL do QR Code
  return this.prisma.resource.update({
    where: { id: resource.id },
    data: { qrCodeUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/qrcodes/${path}` },
  });
}
```

---

## 8. Nível de Correção de Erro (ECL)

| Nível | Correção | Quando usar |
|---|---|---|
| `L` | 7% | URL curta, ambiente limpo |
| `M` | 15% | Uso geral — padrão recomendado |
| `Q` | 25% | Ambientes com sujeira ou desgaste |
| `H` | 30% | QR com logo sobreposta |

---

## 9. Checklist de Validação

- [ ] A URL do QR Code é pública (sem autenticação)?
- [ ] O `tenantId` ou `slug` está na URL para identificar o contexto?
- [ ] O QR Code foi testado com câmera real (não apenas preview)?
- [ ] O nível ECL é adequado ao ambiente de uso?
- [ ] QR Codes gerados em PDF têm label identificador?
- [ ] A URL é estável (não muda se o recurso for atualizado)?

---

## 10. Erros Comuns

| Erro | Causa | Solução |
|---|---|---|
| QR Code não escaneia | URL muito longa | Encurtar URL ou aumentar tamanho do QR |
| QR Code quebra ao imprimir | Resolução baixa | Usar width mínimo de 400px para impressão |
| URL muda e QR Code fica inválido | UUID na URL sem abstração | Usar slug estável ou rota por ID fixo |
| PDF com QR Code corrompido | Buffer mal convertido | Garantir que `toBuffer` retorna PNG válido |

---

*Skill genérica — aplicável a qualquer projeto que gere QR Codes*
*Cobre: NestJS · Next.js · Expo · PDF · Storage*
