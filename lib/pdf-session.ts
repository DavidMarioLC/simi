export const pdfChannel = 'simi-pdf-v1';
export function remotePdfUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value);
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) return url.href;
  } catch { /* Destino no admitido. */ }
}
export const originPermission = (url: string) => `${new URL(url).origin}/*`;
