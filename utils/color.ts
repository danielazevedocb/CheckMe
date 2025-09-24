export function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized.length === 3 ? expandShortHex(sanitized) : sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function expandShortHex(hex: string): string {
  return hex
    .split('')
    .map((char) => char + char)
    .join('');
}

export function blendWithSurface(color: string, alpha: number): string {
  return hexToRgba(color, alpha);
}

export function getReadableTextColor(color: string, light = '#0F172A', dark = '#FFFFFF'): string {
  const sanitized = color.replace('#', '');
  const hex = sanitized.length === 3 ? expandShortHex(sanitized) : sanitized;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const luminance = 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
  return luminance > 0.6 ? light : dark;
}

function gamma(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}
