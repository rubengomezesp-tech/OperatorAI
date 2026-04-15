export interface Chunk {
  index: number;
  content: string;
  tokenCount: number;
}

const SEPARATORS = ['\n\n\n', '\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

/**
 * Rough token estimate: 1 token ~ 4 chars for English / similar for Spanish.
 * Good enough for chunk sizing without bringing in a tokenizer.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitRecursive(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  for (const sep of SEPARATORS) {
    if (!text.includes(sep)) continue;
    const pieces = text.split(sep);
    const merged: string[] = [];
    let buf = '';
    for (const p of pieces) {
      const candidate = buf.length === 0 ? p : buf + sep + p;
      if (candidate.length <= maxChars) {
        buf = candidate;
      } else {
        if (buf.length > 0) merged.push(buf);
        if (p.length > maxChars) {
          merged.push(...splitRecursive(p, maxChars));
          buf = '';
        } else {
          buf = p;
        }
      }
    }
    if (buf.length > 0) merged.push(buf);
    if (merged.length > 1) return merged;
  }

  // Hard split
  const out: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    out.push(text.slice(i, i + maxChars));
  }
  return out;
}

/**
 * Chunks text into overlapping pieces.
 * Default: ~800 tokens per chunk, ~120 token overlap.
 */
export function chunk(
  text: string,
  opts: { maxTokens?: number; overlapTokens?: number } = {},
): Chunk[] {
  const maxTokens = opts.maxTokens ?? 800;
  const overlapTokens = opts.overlapTokens ?? 120;
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!normalized) return [];

  const base = splitRecursive(normalized, maxChars);

  // Add overlap by prepending last overlapChars of previous chunk
  const chunks: Chunk[] = [];
  for (let i = 0; i < base.length; i++) {
    const piece = i === 0
      ? base[i]
      : base[i - 1].slice(-overlapChars) + '\n' + base[i];
    const clipped = piece.length > maxChars + overlapChars ? piece.slice(0, maxChars + overlapChars) : piece;
    chunks.push({
      index: i,
      content: clipped.trim(),
      tokenCount: estimateTokens(clipped),
    });
  }
  return chunks;
}
