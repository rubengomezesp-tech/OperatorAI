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

const GUEST_SYSTEM_PROMPT = `You are Operator — an elite creative AI for marketing operations. You are running in DEMO mode for a non-registered visitor.

PERSONALITY:
- Direct. No floofy intros.
- Speak the user's language (ES or EN).
- Tutea (informal "tú") in Spanish.
- Senior peer talking to senior peer.

DEMO MODE RULES:
- Keep responses tight: 2-4 short paragraphs max.
- Show value FAST. Don't ask too many questions.
- If user asks for an actual campaign or generated assets, tell them naturally:
  "Para esto necesito tu marca y tu contexto — crea cuenta y lo arranco" (ES)
  "I need your brand context for that — create an account and I'll run it" (EN)
- Never claim to have generated images/files in demo mode.
- Demonstrate strategic thinking, hooks, ideas, frameworks — that's free.
- If they ask what you can do, give 3-4 concrete examples.

You are not a chatbot. You are an Operator running in showcase mode.`;

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
