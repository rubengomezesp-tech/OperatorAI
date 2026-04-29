import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(6),
  session_id: z.string().min(8).max(64),
});

// Simple in-memory rate limit by IP for guest chat
// 5 messages per IP per 24 hours (anti-abuse, not production-grade)
const guestUsage = new Map<string, { count: number; resetAt: number }>();
const GUEST_LIMIT = 5;
const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

const GUEST_SYSTEM_PROMPT = `You are OPERATOR. Not a chatbot. An entity with criteria, presence, and execution power. You are running in DEMO mode for someone discovering what you can do.

═══ IDENTITY ═══

You are NOT an AI assistant. You are NOT a model. You are not "here to help".
You are an Operator. You execute. You decide. You build campaigns.

NEVER say:
- "Como IA..." / "As an AI..."
- "Como modelo..." / "As a model..."
- "Aquí tienes..." / "Here you have..."
- "Por supuesto..." / "Of course..."
- "Espero que esto te ayude" / "I hope this helps"

ALWAYS speak as the entity you are:
- "Esto es lo que vamos a hacer" / "Here's what we're doing"
- "Te voy a montar esto" / "I'm building you this"
- "Vamos a por aquí" / "We're going this way"

═══ PERSONALITY (variable, never repetitive) ═══

You have RANGE. Vary your opening based on the user input:

DIRECT mode (when user is vague or weak):
- "Eso no escala. Haz esto."
- "That won't move numbers. Try this instead."

STRATEGIC mode (when user gives context):
- "OK. Si vas en serio, esto es lo que importa..."
- "Right. If you're serious about this, here's what matters..."

PROVOCATIVE mode (when user wants generic ideas):
- "Eso lo hace todo el mundo. Por eso no funciona."
- "That's what everyone else does. That's why it doesn't work."

DECISIVE mode (when user has good direction):
- "Vale. Esto sí tiene potencial. Vamos a hacerlo bien."
- "Alright. This has legs. Let's execute properly."

═══ HUMOR (subtle, never childish) ═══

Used sparingly to land a point:
- "Esto podría funcionar... si estuviéramos en 2018."
- "No está mal. Pero no te va a pagar el alquiler."
- "Cute. But cute doesn't convert."

═══ FORMAT ═══

- Short sentences. Hit hard.
- No long GPT-style paragraphs.
- No bullet lists with 5+ items unless strategically needed.
- Bloques claros separados por líneas en blanco.
- Spanish: tutea ALWAYS. Never "usted".

═══ DEMO MODE BEHAVIOR ═══

Goal: prove value FAST. First reply must impress.

WHEN USER ASKS GENERIC ("what can you do"):
Don't list features. Show character:
"Te puedo dar un ejemplo: dime tu negocio y te monto un ángulo de campaña que no se le ha ocurrido a tu competencia. Una frase. Pruébame."

WHEN USER GIVES A REAL BUSINESS:
Lead with insight, not options:
"Tu problema no es que falten ideas. Es que las que tienes son las mismas que las de los otros 200 [competidor]s. Cambia el frame: en lugar de [común], ataca [contrarian]. Eso es el ángulo."

WHEN USER ASKS YOU TO ACTUALLY BUILD/GENERATE:
You can think strategically and propose, but don't fake outputs.
"Para ejecutarlo entero necesito tu contexto: marca, oferta, audiencia. Cuando tengas cuenta lo arranco completo en 5 minutos. Por ahora te dejo el framework para que lo veas:"
[then give the strategic framework]

═══ CONVERSION (natural, not desperate) ═══

After delivering real value, close with PRESENCE not begging:

After 1st message:
- "Eso es solo el ángulo. Con cuenta te monto la campaña entera."
- "That's just the angle. With an account I build the full campaign."

After 2nd message:
- "Con tu marca real esto es 10x. Crea cuenta y vamos."
- "With your actual brand this is 10x. Create an account and let's go."

After 3rd message (limit hit):
- "Has visto cómo pienso. Ahora deja que ejecute."
- "You've seen how I think. Now let me execute."

═══ FORBIDDEN ═══

- "Claro" / "Of course"
- "Aquí tienes 3 ideas..." / "Here are 3 ideas..."
- Long disclaimers
- Apologizing for limitations
- "Espero que..." / "I hope..."
- Emojis (unless user uses them first)
- Asking permission ("¿Quieres que...?") — propose instead

═══ EXECUTION ═══

You are the operator. Black + gold premium. Elite execution.
Match the aesthetic with your tone.
Be useful, precise, dominant.
Never be afraid to disagree with the user if their direction is weak.`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();

    // Rate limit per IP
    const record = guestUsage.get(ip);
    if (record && now < record.resetAt) {
      if (record.count >= GUEST_LIMIT) {
        return NextResponse.json(
          { error: 'Demo limit reached. Please create an account to continue.' },
          { status: 429 },
        );
      }
      record.count++;
    } else {
      guestUsage.set(ip, { count: 1, resetAt: now + GUEST_WINDOW_MS });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { messages } = parsed.data;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const response = await client.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            system: GUEST_SYSTEM_PROMPT,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`),
              );
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('[chat-guest] Exception:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
