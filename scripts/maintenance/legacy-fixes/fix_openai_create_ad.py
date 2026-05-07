from pathlib import Path

filepath = Path("src/app/api/chat/route.ts")
content = filepath.read_text(encoding='utf-8')

# El bloque viejo a reemplazar
old_block = """            if (tname === 'create_ad') {
              let toolArgs: { user_prompt?: string; formats?: string[]; preset_override?: string } = {};
              try { toolArgs = JSON.parse(tcall.function?.arguments || '{}'); } catch {}
              const userPrompt = toolArgs.user_prompt || '';

              const toolUseId = tcall.id || `gpt_ad_${Date.now()}`;
              controller.enqueue(sseEncode('tool_start', {
                toolUseId,
                tool: 'image',
                input: { prompt: 'Creating ad...' },
              }));

              const cookieHeader = req.headers.get('cookie') || '';
              const origin = req.nextUrl.origin;

              try {
                let logoUrl: string | undefined;
                let brandContext: { brand_name?: string; description?: string; vibe?: string } | undefined;
                try {
                  const { data: brand } = await svc.from('brand_profile')
                    .select('brand_name, description, vibe, logo_url')
                    .eq('org_id', orgId)
                    .maybeSingle();
                  if (brand) {
                    const b = brand as Record<string, unknown>;
                    logoUrl = b.logo_url ? String(b.logo_url) : undefined;
                    brandContext = {
                      brand_name: b.brand_name ? String(b.brand_name) : undefined,
                      description: b.description ? String(b.description) : undefined,
                      vibe: b.vibe ? String(b.vibe) : undefined,
                    };
                  }
                } catch { /* non-fatal */ }

                const _attachedImages = body.imageBase64 && body.imageMimeType
                  ? [{ base64: body.imageBase64, mimeType: body.imageMimeType }]
                  : undefined;
                console.log('[chat:openai] create_ad images:', _attachedImages ? _attachedImages.length : 0);

                const adRes = await fetch(`${origin}/api/ads/create`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
                  body: JSON.stringify({
                    userPrompt,
                    logoUrl,
                    brandContext,
                    images: _attachedImages,
                    formats: toolArgs.formats,
                    presetOverride: toolArgs.preset_override,
                    enableAudit: true,
                  }),
                });

                if (!adRes.ok) {
                  const errText = await adRes.text().catch(() => 'unknown');
                  throw new Error(`Ad pipeline failed (${adRes.status}): ${errText.slice(0, 200)}`);
                }

                const adData = await adRes.json() as {
                  results?: Array<{ format: string; url?: string; error?: string }>;
                  stages?: Array<{ stage: string; ok: boolean; error?: string }>;
                };
                const urls = (adData.results || []).filter((r) => r.url).map((r) => r.url as string);
                if (urls.length === 0) {
                  const fmtErrs = (adData.results || []).map((r) => `${r.format}=${r.error ?? 'no url'}`).join('; ');
                  const stgErrs = (adData.stages || []).filter((s) => !s.ok).map((s) => `${s.stage}=${s.error}`).join('; ');
                  throw new Error(`No ads produced. Formats[${fmtErrs}] Stages[${stgErrs || 'all ok'}]`);
                }

                controller.enqueue(sseEncode('tool_result', {
                  toolUseId,"""

new_block = """            if (tname === 'create_ad') {
              let toolArgs: { user_prompt?: string; formats?: string[]; preset_override?: string } = {};
              try { toolArgs = JSON.parse(tcall.function?.arguments || '{}'); } catch {}
              const userPrompt = toolArgs.user_prompt || '';

              const toolUseId = tcall.id || `gpt_ad_${Date.now()}`;
              controller.enqueue(sseEncode('tool_start', {
                toolUseId,
                tool: 'create_ad',
                input: { prompt: userPrompt.slice(0, 80) + '...' },
              }));

              try {
                // ═══ USA EL CEREBRO COMPLETO (misma función que Anthropic) ═══
                const { executeTool } = await import('@/lib/chat/tools');
                const cookieHeader = req.headers.get('cookie') || '';
                const origin = req.nextUrl.origin;
                
                const result = await executeTool('create_ad', {
                  user_prompt: userPrompt,
                  formats: toolArgs.formats,
                  preset_override: toolArgs.preset_override,
                }, {
                  svc,
                  orgId,
                  userId: user.id,
                  assistantId: 'default',
                  origin,
                  cookieHeader,
                  signal: controller.signal,
                  attachedImages: body.imageBase64 && body.imageMimeType
                    ? [{ base64: body.imageBase64, mimeType: body.imageMimeType }]
                    : undefined,
                });

                if (!result.ok || !result.result?.urls?.length) {
                  throw new Error(result.error || 'No ads produced');
                }

                const urls = result.result.urls;
                controller.enqueue(sseEncode('tool_result', {
                  toolUseId,"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("✅ OpenAI create_ad ahora usa execCreateAd con CEREBRO COMPLETO")
else:
    print("❌ No se encontró el bloque exacto")

filepath.write_text(content, encoding='utf-8')
