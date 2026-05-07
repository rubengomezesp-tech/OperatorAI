from pathlib import Path

filepath = Path("src/app/api/ads/audit/route.ts")
content = filepath.read_text(encoding='utf-8')

# 1. Agregar fetch para convertir URL a base64
old_block = """  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: briefContext },
            {
              type: 'image_url',
              image_url: { url: body.adImageUrl, detail: 'high' },
            },
          ],
        },
      ],
      temperature: 0.2,
    });"""

new_block = """  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  try {
    // Convert image URL to base64 to avoid OpenAI timeout downloading from Supabase
    let imageData: { type: 'image_url'; image_url: { url: string; detail: 'high' } };
    try {
      const imageResponse = await fetch(body.adImageUrl, { signal: AbortSignal.timeout(10000) });
      if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const base64 = imageBuffer.toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      imageData = {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
      };
    } catch (fetchErr) {
      // Fallback: usar URL directa si no se puede convertir
      console.warn('[ads/audit] Could not convert to base64, using URL:', (fetchErr as Error).message);
      imageData = {
        type: 'image_url',
        image_url: { url: body.adImageUrl, detail: 'high' },
      };
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: briefContext },
            imageData,
          ],
        },
      ],
      temperature: 0.2,
    });"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("✅ Audit: Ahora convierte imagen a base64 antes de enviar a Vision")
else:
    print("⚠️  No se encontró el bloque exacto")

filepath.write_text(content, encoding='utf-8')
