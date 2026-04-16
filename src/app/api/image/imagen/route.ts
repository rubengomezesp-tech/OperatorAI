import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateImageImagen, imagenCost, type ImagenModel } from '@/features/image/server/imagen-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  model: z.enum([
    'imagen-4.0-fast-generate-001',
    'imagen-4.0-generate-001',
    'imagen-4.0-ultra-generate-001',
  ]).optional(),
  aspectRatio: z.enum(['1:1', '3:4', '4:3', '9:16', '16:9']).optional(),
  numberOfImages: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
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

  // Quota check
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'image_generation' });
  const q = quota as { allowed: boolean; used: number; limit: number } | null;
  if (q && !q.allowed) {
    return NextResponse.json({
      error: 'Monthly image limit reached. Upgrade to generate more.',
      quota: q,
    }, { status: 402 });
  }

  const model = (parsed.data.model ?? 'imagen-4.0-generate-001') as ImagenModel;
  const numImages = parsed.data.numberOfImages ?? 1;

  try {
    const result = await generateImageImagen({
      prompt: parsed.data.prompt,
      model,
      aspectRatio: parsed.data.aspectRatio ?? '1:1',
      numberOfImages: numImages,
    });

    // Track usage
    await svc.from('usage_events').insert({
      org_id: orgId,
      user_id: user.id,
      kind: 'image_generation',
      quantity: numImages,
      metadata: { model, prompt: parsed.data.prompt.slice(0, 200) },
    } as never);

    // Upload to storage
    const uploaded = await Promise.all(result.images.map(async (img, i) => {
      const buf = Buffer.from(img.base64, 'base64');
      const ext = img.mimeType.includes('png') ? 'png' : 'jpg';
      const path = `${orgId}/${Date.now()}-${i}.${ext}`;
      await svc.storage.from('images').upload(path, buf, {
        contentType: img.mimeType,
        upsert: true,
      });
      const { data } = await svc.storage.from('images').createSignedUrl(path, 60 * 60 * 24);
      return data?.signedUrl ?? null;
    }));

    return NextResponse.json({
      images: uploaded.filter(Boolean),
      model,
      cost: imagenCost(model) * numImages,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Image generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
