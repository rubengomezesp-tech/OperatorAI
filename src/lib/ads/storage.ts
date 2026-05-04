/**
 * 📁 STORAGE — Upload helper para Supabase
 */

import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function uploadToStorage(params: {
  buffer: Buffer;
  path: string;
  contentType: string;
  orgId: string;
}): Promise<string> {
  const svc = createSupabaseServiceClient();
  
  const { error: uploadErr } = await svc.storage
    .from('generated-images')
    .upload(params.path, new Uint8Array(params.buffer), {
      contentType: params.contentType,
      upsert: true,
    });

  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

  const { data: pub } = svc.storage
    .from('generated-images')
    .getPublicUrl(params.path);

  return pub.publicUrl;
}
