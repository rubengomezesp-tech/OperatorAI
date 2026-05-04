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
  // pdf-parse ESM: usa el export nombrado o require
  const pdfParse = (await import('pdf-parse')) as any;
  const parseFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || pdfParse;
  const data = await parseFn(buffer);
  
  return {
    text: (data.text ?? '').slice(0, MAX_CHARS),
    meta: { type: 'pdf', pages: data.numpages },
  };
}

async function extractDocx(buffer: Buffer): Promise<ExtractedText> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value ?? '').slice(0, MAX_CHARS);
  return { text, meta: { type: 'docx', warnings: result.messages?.length ?? 0 } };
}
