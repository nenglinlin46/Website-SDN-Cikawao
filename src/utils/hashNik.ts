export async function hashNikSha256(rawNik: string): Promise<string> {
  const digits = rawNik.replace(/\D/g, '').slice(0, 20);
  if (!digits) return '';

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(digits);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  return '';
}
