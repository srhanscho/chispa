export function bearerToken(header: string | null): string | null {
  const match = header?.match(/^bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}
