import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
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

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'File too large (50MB max)' }, { status: 400 });

  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain',
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Use CSV, Excel, JSON or TXT.' }, { status: 400 });
  }

  const fileId = crypto.randomUUID();
  const ext = file.name.split('.').pop() ?? 'dat';
  const storagePath = orgId + '/' + fileId + '.' + ext;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await svc.storage
    .from('analysis')
    .upload(storagePath, buf, { contentType: file.type, upsert: false });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Quick preview parse for CSV
  let preview: unknown = null;
  let columns: string[] | null = null;
  let rowCount: number | null = null;

  if (file.type === 'text/csv') {
    try {
      const text = buf.toString('utf-8');
      const lines = text.split('\n').slice(0, 6);
      const headers = lines[0]?.split(',').map((s) => s.trim()) ?? [];
      const rows = lines.slice(1).filter(Boolean).map((line) =>
        line.split(',').map((c) => c.trim())
      );
      columns = headers;
      preview = rows;
      rowCount = text.split('\n').filter(Boolean).length - 1;
    } catch { /* ignore preview errors */ }
  }

  const { data: row, error: dbErr } = await svc.from('analysis_files').insert({
    org_id: orgId,
    user_id: user.id,
    name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    storage_path: storagePath,
    row_count: rowCount,
    column_count: columns?.length ?? null,
    columns: columns,
    preview: preview,
  } as never).select('id, name, mime_type, size_bytes, row_count, column_count, columns, created_at').single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ file: row });
}
