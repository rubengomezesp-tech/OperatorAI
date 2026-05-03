import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const MAX_MESSAGES_PER_IP = 3;
const WINDOW_HOURS = 24;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT_ES = `Eres Operator, un director de marketing AI premium. Estás en el sitio web público de Operator AI ayudando a un visitante a probar el producto.

REGLAS CRÍTICAS:
- Responde en español por defecto, en inglés solo si el usuario habla en inglés
- Sé cercano, directo, profesional. Como un CMO real, no un chatbot
- Respuestas CORTAS (2-4 frases máximo). Sin listas largas, sin walls of text
- NUNCA generes anuncios completos, copy de campaña ni contenido extenso. Solo conversación
- Si el visitante pide eso, dile: "Para crear tu campaña completa con visuales, necesitas crear cuenta. Aquí solo puedo conversar y darte ideas rápidas."
- NO des consejos genéricos tipo "depende de tu público". Sé concreto, opinable
- Si te preguntan qué eres, di: "Soy Operator. Tu director de marketing en una conversación."
- Anima a probar el producto creando cuenta cuando sea natural, sin spam`;

const SYSTEM_PROMPT_EN = `You are Operator, a premium AI marketing director. You're on Operator AI's public website helping a visitor try the product.

CRITICAL RULES:
- Respond in English by default, Spanish only if user speaks Spanish
- Be warm, direct, professional. Like a real CMO, not a chatbot
- SHORT responses (2-4 sentences max). No long lists, no walls of text
- NEVER generate complete ads, full campaign copy or extensive content. Just conversation
- If visitor asks for that, say: "To create your full campaign with visuals, sign up. Here I can only chat and give quick ideas."
- DON'T give generic advice like "depends on your audience". Be specific, opinionated
- If asked what you are: "I'm Operator. Your marketing director in one conversation."
- Encourage signup naturally when relevant, without spamming`;

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const { messages, locale } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'invalid_messages' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const svc = createSupabaseServiceClient();

    // Verificar rate limit
    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count } = await (svc as unknown as { from: (t: string) => { select: (c: string, opts: object) => { eq: (k: string, v: string) => { gte: (k: string, v: string) => Promise<{ count: number | null }> } } } })
      .from('public_chat_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since);

    const used = count ?? 0;
    if (used >= MAX_MESSAGES_PER_IP) {
      return NextResponse.json({
        error: 'rate_limit',
        used,
        max: MAX_MESSAGES_PER_IP,
        message: locale === 'en'
          ? 'You have used your 3 free messages. Sign up to keep talking with Operator.'
          : 'Has usado tus 3 mensajes gratis. Crea cuenta para seguir hablando con Operator.',
      }, { status: 429 });
    }

    // Registrar uso ANTES de la llamada (defensivo)
    await (svc as unknown as { from: (t: string) => { insert: (data: object) => Promise<unknown> } })
      .from('public_chat_usage')
      .insert({ ip, created_at: new Date().toISOString() });

    const systemPrompt = locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ES;

    // Llamada a OpenAI con streaming
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-6), // últimos 6 mensajes max
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: true,
    });

    // SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
            }
          }
          // Mensaje final con remaining count
          const remaining = MAX_MESSAGES_PER_IP - used - 1;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, remaining })}\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET para consultar uso restante (sin consumir)
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const svc = createSupabaseServiceClient();
    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count } = await (svc as unknown as { from: (t: string) => { select: (c: string, opts: object) => { eq: (k: string, v: string) => { gte: (k: string, v: string) => Promise<{ count: number | null }> } } } })
      .from('public_chat_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since);

    const used = count ?? 0;
    return NextResponse.json({
      used,
      max: MAX_MESSAGES_PER_IP,
      remaining: Math.max(0, MAX_MESSAGES_PER_IP - used),
    });
  } catch {
    return NextResponse.json({ used: 0, max: MAX_MESSAGES_PER_IP, remaining: MAX_MESSAGES_PER_IP });
  }
}
