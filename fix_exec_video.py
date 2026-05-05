from pathlib import Path

filepath = Path("src/lib/chat/tools.ts")
content = filepath.read_text(encoding='utf-8')

old_function = """async function execVideo(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const prompt = String(input.prompt ?? '').trim();
  if (!prompt) return { ok: false, error: 'Empty prompt' };
  const duration = Number(input.duration ?? 4);

  try {
    const mod = await import('@/features/video/server/veo-client');
    const fn = (mod as Record<string, unknown>).generateVideo ??
               (mod as Record<string, unknown>).generateWithVeo ??
               (mod as Record<string, unknown>).default;

    if (typeof fn !== 'function') {
      return { ok: false, error: 'Video function not found in veo-client' };
    }

    const raw = await (fn as Function)({
      svc: ctx.svc, orgId: ctx.orgId, userId: ctx.userId, prompt, duration,
    });

    const r = raw as Record<string, unknown> | null;
    const videoUrl = (r?.videoUrl ?? r?.url ?? r?.video_url) as string | undefined;
    const thumbnailUrl = (r?.thumbnailUrl ?? r?.thumbnail_url) as string | undefined;

    if (!videoUrl) return { ok: false, error: 'No video URL returned' };
    return { ok: true, result: { videoUrl, thumbnailUrl } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Video failed' };
  }
}"""

new_function = """async function execVideo(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const userPrompt = String(input.prompt ?? '').trim();
  if (!userPrompt) return { ok: false, error: 'Empty prompt' };
  const duration = Number(input.duration ?? 4);

  try {
    // ═══ ENRIQUECER PROMPT CON BRAIN-BRIDGE (mismo cerebro que create_ad) ═══
    let enrichedPrompt = userPrompt;
    try {
      const { generateCreativePlan } = await import('@/lib/ads/brain-bridge');
      const plan = await generateCreativePlan({
        userPrompt,
        aspectRatios: ['16:9'], // video usa 16:9
      });
      
      enrichedPrompt = [
        plan.promptBase,
        'VISUAL STYLE:',
        `Mood: ${plan.visualStyle.mood}`,
        `Colors: ${plan.visualStyle.colors.join(', ')}`,
        `Lighting: ${plan.visualStyle.lighting}`,
        `Composition: ${plan.visualStyle.composition}`,
        'FORMAT: Cinematic video, smooth camera movement, high production value',
        plan.brandContext?.brand_name ? `BRAND: ${plan.brandContext.brand_name}` : '',
      ].filter(Boolean).join('\\n');
      
      console.log('[execVideo] 🧠 prompt enriquecido con brain-bridge');
    } catch (e) {
      console.warn('[execVideo] brain-bridge enrichment failed, usando prompt original:', e);
    }

    // Llamar a /api/videos/generate con el prompt enriquecido
    const res = await fetch(`${ctx.origin}/api/videos/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ctx.cookieHeader ? { cookie: ctx.cookieHeader } : {}),
      },
      body: JSON.stringify({
        prompt: enrichedPrompt,
        duration,
        aspectRatio: '16:9',
      }),
      signal: ctx.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      return { ok: false, error: `Video generation failed (${res.status}): ${errText.slice(0, 200)}` };
    }

    const data = await res.json() as { video?: { url?: string; id?: string }; ok?: boolean };
    const videoUrl = data?.video?.url;
    
    if (!videoUrl) return { ok: false, error: 'No video URL returned' };
    return { ok: true, result: { videoUrl } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Video failed' };
  }
}"""

if old_function in content:
    content = content.replace(old_function, new_function)
    print("✅ execVideo ahora usa brain-bridge + llamada HTTP a /api/videos/generate")
else:
    print("❌ No se encontró la función exacta")

filepath.write_text(content, encoding='utf-8')
