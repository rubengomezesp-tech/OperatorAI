/**
 * Endpoint de test para verificar la conexión con OperatorAI local.
 * 
 * Solo disponible en desarrollo.
 * 
 * Uso:
 *   GET  /api/operator-test           → mensaje fijo "Hola brother"
 *   POST /api/operator-test           → body: { message: "...", history?: [...] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { callOperator, isOperatorAvailable } from '@/lib/models/local-operator-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function devOnly() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint disabled in production' },
      { status: 403 }
    );
  }
  return null;
}

export async function GET() {
  const block = devOnly();
  if (block) return block;

  const available = await isOperatorAvailable();
  if (!available) {
    return NextResponse.json(
      {
        error: 'OperatorAI local no está disponible',
        hint: 'Verifica que LM Studio esté corriendo en http://localhost:1234 con el modelo operator-qwen14b cargado',
      },
      { status: 503 }
    );
  }

  try {
    const start = Date.now();
    const response = await callOperator('Hola brother, ¿quién eres y qué haces?');
    const elapsedMs = Date.now() - start;

    return NextResponse.json({
      ok: true,
      elapsedMs,
      response: {
        content: response.content,
        toolCall: response.toolCall ?? null,
        usage: response.usage,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error llamando a OperatorAI',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const block = devOnly();
  if (block) return block;

  try {
    const body = await req.json();
    const message: string = body?.message;
    const history = body?.history;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Body must include { message: string }' },
        { status: 400 }
      );
    }

    const start = Date.now();
    const response = await callOperator(message, { history });
    const elapsedMs = Date.now() - start;

    return NextResponse.json({
      ok: true,
      elapsedMs,
      response: {
        content: response.content,
        toolCall: response.toolCall ?? null,
        usage: response.usage,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error llamando a OperatorAI',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
