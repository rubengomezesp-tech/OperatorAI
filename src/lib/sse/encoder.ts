export function sseEncode(event: string, data: unknown): Uint8Array {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const chunk = `event: ${event}\ndata: ${payload}\n\n`;
  return new TextEncoder().encode(chunk);
}

export function sseComment(text: string): Uint8Array {
  return new TextEncoder().encode(`: ${text}\n\n`);
}
