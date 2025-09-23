const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0);
}

export function formatProgress(completed: number, total: number): string {
  return `${completed}/${total}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function parseCurrencyInput(value: string): number | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\./g, '').replace(',', '.');
  const result = Number(normalized);

  if (!Number.isFinite(result)) {
    return null;
  }

  return Math.round(result * 100) / 100;
}

const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function formatFullDate(timestamp: number): string {
  return longDateFormatter.format(new Date(timestamp));
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function differenceInDays(from: number, to: number): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = startOfDay(new Date(from)).getTime();
  const end = startOfDay(new Date(to)).getTime();
  return Math.round((end - start) / msPerDay);
}
