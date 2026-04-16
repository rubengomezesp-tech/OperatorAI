import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  fileId: z.string().min(1),
  question: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data: file } = await svc
    .from('analysis_files')
    .select('id, name, mime_type, storage_path, columns, preview, row_count')
    .eq('id', parsed.data.fileId)
    .eq('org_id', orgId)
    .single();

  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const f = file as { id: string; name: string; mime_type: string; storage_path: string; columns: string[] | null; preview: unknown; row_count: number | null };

  // Download file content (limit to first 100KB for context)
  const { data: blob } = await svc.storage.from('analysis').download(f.storage_path);
  if (!blob) return NextResponse.json({ error: 'File content unavailable' }, { status: 500 });

  let content = '';
  if (f.mime_type === 'text/csv' || f.mime_type === 'application/json' || f.mime_type === 'text/plain') {
    const text = await blob.text();
    content = text.slice(0, 100_000);
  } else {
    content = '[binary file] columns: ' + JSON.stringify(f.columns) + ', preview: ' + JSON.stringify(f.preview);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });

  const systemPrompt = 'You are a data analyst. The user uploaded the file "' + f.name + '" with ' + (f.row_count ?? '?') + ' rows. ' +
    'Analyze the data and answer the user\u2019s question precisely. ' +
    'When asked for charts, return them as Markdown tables. ' +
    'Be concise. Lead with the answer. Show key numbers. Suggest 1-2 follow-up questions at the end.';

  const userPrompt = 'FILE CONTENT (first 100KB max):\n' + content + '\n\nUSER QUESTION:\n' + parsed.data.question;

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
    }),
  });

  if (!aiRes.ok) {
    const text = await aiRes.text().catch(() => '');
    return NextResponse.json({ error: 'AI failed: ' + text.slice(0, 200) }, { status: 500 });
  }

  const aiBody = await aiRes.json();
  const answer = aiBody?.choices?.[0]?.message?.content ?? 'No answer generated';

  await svc.from('analysis_files').update({
    last_analyzed_at: new Date().toISOString(),
  } as never).eq('id', f.id);

  return NextResponse.json({ answer });
}
