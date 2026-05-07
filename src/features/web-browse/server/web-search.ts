export async function webSearch(query: string, count?: number): Promise<any[]> {
  console.warn('[STUB] webSearch disabled');
  return [];
}
export function formatWebContext(results: any[]): string { return ''; }
export function shouldSearch(message: string): boolean { return false; }
