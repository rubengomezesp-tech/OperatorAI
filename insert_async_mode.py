from pathlib import Path

filepath = Path("src/app/api/ads/create/route.ts")
content = filepath.read_text(encoding='utf-8')

# El marcador: justo después de "const origin = new URL(req.url).origin;"
# que está después del auto-carga
marker = """  const origin = new URL(req.url).origin;
  const cookieHeader = req.headers.get('cookie') ?? '';"""

async_block = """
  // ═══ ASYNC MODE (body.async = true) → responde rápido con jobId ═══
  const bodyAny = body as Record<string, unknown>;
  if (bodyAny.async === true) {
    const svc2 = createSupabaseServiceClient();
    const { orgId: asyncOrgId } = await resolveOrgContext(svc2, user.id);

    const { generateCreativePlan } = await import('@/lib/ads/brain-bridge');
    const { processJob } = await import('@/lib/ads/job-processor');

    const plan = await generateCreativePlan({
      userPrompt: body.userPrompt,
      brandContext: resolvedBrandContext,
      logoUrl: resolvedLogoUrl,
      images: body.images,
      aspectRatios: body.formats,
      campaignGoal: (bodyAny.campaignGoal as string) || undefined,
      tone: (bodyAny.tone as string) || undefined,
      language: (bodyAny.language as 'es' | 'en') || undefined,
      targetAudience: (bodyAny.targetAudience as string) || undefined,
    });

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { createJob } = await import('@/lib/ads/job-manager');
    await createJob({ jobId, creativePlanId: plan.creativePlanId, orgId: asyncOrgId, userId: user.id, creativePlan: plan });

    // Lanzar procesamiento en background (NO bloquea la respuesta)
    waitUntil(processJob({ jobId, plan, orgId: asyncOrgId, userId: user.id, logoUrl: resolvedLogoUrl }));

    return NextResponse.json({
      jobId,
      creativePlanId: plan.creativePlanId,
      status: 'queued',
      progress: 0,
      currentStage: 'planning',
      creativePlan: plan,
    });
  }
"""

if marker in content:
    new_block = async_block + "\n" + marker
    content = content.replace(marker, new_block, 1)
    filepath.write_text(content, encoding='utf-8')
    print("✅ Async mode insertado en la posición correcta")
else:
    print("❌ No se encontró el marcador")
