from pathlib import Path

filepath = Path("src/lib/chat/tools.ts")
content = filepath.read_text(encoding='utf-8')

old_function = """// ── CREATE AD (full pipeline) ─────────────────────────────────────
async function execCreateAd(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const userPrompt = String(input.user_prompt ?? '').trim();
  if (!userPrompt) return { ok: false, error: 'Empty user_prompt' };

  const formats = Array.isArray(input.formats) ? (input.formats as string[]) : undefined;
  const presetOverride = input.preset_override ? String(input.preset_override) : undefined;

  // Fetch brand context (logo + brand info) so the pipeline auto-applies them
  let logoUrl: string | undefined;
  let brandContext: { brand_name?: string; description?: string; vibe?: string } | undefined;
  try {
    const { data: brand } = await ctx.svc
      .from('brand_profile')
      .select('brand_name, description, vibe, logo_url')
      .eq('org_id', ctx.orgId)
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
  } catch {
    /* non-fatal */
  }

  const images = ctx.attachedImages && ctx.attachedImages.length > 0
    ? ctx.attachedImages
    : undefined;
  console.log('[execCreateAd] images:', images ? images.length : 0, 'logoUrl:', logoUrl ? 'yes' : 'no');

  try {
    const res = await fetch(`${ctx.origin}/api/ads/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        cookie: ctx.cookieHeader,
      },
      body: JSON.stringify({
        userPrompt,
        logoUrl,
        brandContext,
        images,
        formats,
        presetOverride,
        enableAudit: true,
      }),
      signal: ctx.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      return { ok: false, error: `Ad pipeline failed (${res.status}): ${errText.slice(0, 200)}` };
    }

    // Parse SSE stream and capture final 'complete' event with URLs
    if (!res.body) return { ok: false, error: 'No response body' };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalUrls: string[] = [];
    let lastError: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() ?? '';

      let currentEvent = '';
      let currentData = '';
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          currentData = line.slice(5).trim();
        } else if (line === '' && currentEvent && currentData) {
          // Process event
          try {
            const parsed = JSON.parse(currentData);
            if (currentEvent === 'result' && parsed.url) {
              finalUrls = [parsed.url as string];
            } else if (currentEvent === 'error') {
              lastError = parsed.message || parsed.error || 'Stream error';
            }
          } catch {}
          currentEvent = '';
          currentData = '';
        }
      }
    }

    if (finalUrls.length === 0) {
      console.error('[execCreateAd] no urls from stream. lastError:', lastError);
      return { ok: false, error: lastError || 'No ads produced from stream' };
    }

    return { ok: true, result: { urls: finalUrls } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ad creation failed';
    return { ok: false, error: msg };
  }
}"""

new_function = """// ── CREATE AD (full pipeline) — usando el nuevo sistema nervioso central ──
async function execCreateAd(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const userPrompt = String(input.user_prompt ?? '').trim();
  if (!userPrompt) return { ok: false, error: 'Empty user_prompt' };

  const formats = Array.isArray(input.formats) ? (input.formats as string[]) : undefined;
  const presetOverride = input.preset_override ? String(input.preset_override) : undefined;

  // Fetch brand context (logo + brand info) so the pipeline auto-applies them
  let logoUrl: string | undefined;
  let brandContext: { brand_name?: string; description?: string; vibe?: string } | undefined;
  try {
    const { data: brand } = await ctx.svc
      .from('brand_profile')
      .select('brand_name, description, vibe, logo_url')
      .eq('org_id', ctx.orgId)
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
  } catch {
    /* non-fatal */
  }

  const images = ctx.attachedImages && ctx.attachedImages.length > 0
    ? ctx.attachedImages
    : undefined;
  console.log('[execCreateAd] images:', images ? images.length : 0, 'logoUrl:', logoUrl ? 'yes' : 'no');

  try {
    // ═══ NUEVO SISTEMA: brain-bridge + job-processor (sin HTTP interno) ═══
    const { generateCreativePlan } = await import('@/lib/ads/brain-bridge');
    const { processJob } = await import('@/lib/ads/job-processor');
    const { createJob, getJob } = await import('@/lib/ads/job-manager');
    const { parseAspectRatios } = await import('@/lib/ads/aspect-ratio');

    // Crear el Creative Plan usando todo el DNA
    const plan = await generateCreativePlan({
      userPrompt,
      brandContext,
      logoUrl,
      images,
      aspectRatios: formats ? parseAspectRatios(formats) : undefined,
      presetOverride,
    });

    // Crear job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await createJob({
      jobId,
      creativePlanId: plan.creativePlanId,
      orgId: ctx.orgId,
      userId: ctx.userId,
      creativePlan: plan,
    });

    // Procesar job (genera imágenes con límite de concurrencia)
    await processJob({
      jobId,
      plan,
      orgId: ctx.orgId,
      userId: ctx.userId,
      logoUrl,
    });

    // Recuperar resultados
    const job = await getJob(jobId);
    if (!job) return { ok: false, error: 'Job not found after processing' };

    const urls = (job.results || [])
      .filter(r => r.status === 'completed' && r.url)
      .map(r => r.url as string);

    if (urls.length === 0) {
      const errors = (job.results || [])
        .filter(r => r.error)
        .map(r => r.error)
        .join('; ');
      console.error('[execCreateAd] no urls generated. errors:', errors);
      return { ok: false, error: errors || 'No ads produced' };
    }

    console.log('[execCreateAd] ✅ generated', urls.length, 'variants');
    return { ok: true, result: { urls } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ad creation failed';
    console.error('[execCreateAd] ❌', msg);
    return { ok: false, error: msg };
  }
}"""

if old_function in content:
    content = content.replace(old_function, new_function)
    filepath.write_text(content, encoding='utf-8')
    print("✅ execCreateAd actualizado al nuevo sistema nervioso central")
else:
    print("❌ No se encontró la función exacta. Buscando...")
    if "execCreateAd" in content:
        print("   La función existe pero el formato no coincide exactamente")
    else:
        print("   execCreateAd no encontrado")
