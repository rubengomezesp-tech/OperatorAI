import 'server-only';

export interface ExtractedText {
  text: string;
  meta: Record<string, unknown>;
}

const MAX_CHARS = 2_000_000;

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<ExtractedText> {
  const lower = filename.toLowerCase();

  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    return extractPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return extractDocx(buffer);
  }

  if (
    mimeType.startsWith('text/') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.markdown') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.json')
  ) {
    const text = buffer.toString('utf-8').slice(0, MAX_CHARS);
    return { text, meta: { type: 'text' } };
  }

  throw new Error('Unsupported file type: ' + mimeType);
}

async function extractPdf(buffer: Buffer): Promise<ExtractedText> {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const uint8 = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8);
  const { text, totalPages } = await extractText(pdf, { mergePages: true });

  const joined = Array.isArray(text) ? text.join('\n\n') : text;
  return {
    text: joined.slice(0, MAX_CHARS),
    meta: { type: 'pdf', pages: totalPages },
  };
}

async function extractDocx(buffer: Buffer): Promise<ExtractedText> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value ?? '').slice(0, MAX_CHARS);
  return { text, meta: { type: 'docx', warnings: result.messages?.length ?? 0 } };
}
