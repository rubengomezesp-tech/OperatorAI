import 'server-only';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!serverEnv.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return client;
}

export interface VoiceFingerprint {
  tone_summary: string;
  sentence_length: string;
  vocabulary_style: string;
  preferred_phrases: string[];
  avoided_phrases: string[];
  structural_preferences: string;
}

export async function learnVoiceFromUser(params: {
  svc: SupabaseClient;
  orgId: string;
  userId: string;
  minSamples?: number;
}): Promise<{ fingerprint: VoiceFingerprint | null; sampleCount: number }> {
  const minSamples = params.minSamples ?? 10;

  // Collect last 50 user messages
  const { data: rows } = await params.svc
    .from('messages')
    .select('content, created_at')
    .eq('user_id', params.userId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(50);

  type Row = { content: string; created_at: string };
  const samples = (rows as Row[] | null ?? [])
    .map((r) => (r.content ?? '').trim())
    .filter((c) => c.length > 15 && c.length < 2000);

  if (samples.length < minSamples) {
    return { fingerprint: null, sampleCount: samples.length };
  }

  const openai = getClient();

  const system = [
    'You analyze user-written messages and produce a style fingerprint of the author.',
    'Be specific, not generic. Focus on what is distinctive about this user\'s voice.',
    'Detect the dominant language the user writes in (Spanish, English, etc.) and reflect it in your analysis.',
    'Return JSON exactly matching this schema:',
    '{',
    '  "tone_summary": "2-3 sentence description of overall tone and register",',
    '  "sentence_length": "short | medium | long | mixed",',
    '  "vocabulary_style": "formal | casual | technical | poetic | direct | mixed (with brief explanation)",',
    '  "preferred_phrases": ["array of 3-8 distinctive phrases/words the user uses often"],',
    '  "avoided_phrases": ["array of 2-4 phrases the user seems to avoid or notably never uses"],',
    '  "structural_preferences": "how they tend to structure messages (short paragraphs, bullets, emojis, etc.)"',
    '}',
  ].join('\n');

  const userPayload = samples.slice(0, 30).map((s, i) => '[' + (i + 1) + '] ' + s).join('\n\n');

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPayload },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const raw = res.choices[0]?.message?.content ?? '{}';
    const fp = JSON.parse(raw) as Partial<VoiceFingerprint>;

    const normalized: VoiceFingerprint = {
      tone_summary: fp.tone_summary ?? '',
      sentence_length: fp.sentence_length ?? 'medium',
      vocabulary_style: fp.vocabulary_style ?? 'mixed',
      preferred_phrases: Array.isArray(fp.preferred_phrases) ? fp.preferred_phrases.slice(0, 12) : [],
      avoided_phrases: Array.isArray(fp.avoided_phrases) ? fp.avoided_phrases.slice(0, 6) : [],
      structural_preferences: fp.structural_preferences ?? '',
    };

    return { fingerprint: normalized, sampleCount: samples.length };
  } catch (e) {
    console.error('[voice.learn] failed:', e);
    return { fingerprint: null, sampleCount: samples.length };
  }
}

export function fingerprintToPromptSnippet(fp: {
  tone_summary: string | null;
  sentence_length: string | null;
  vocabulary_style: string | null;
  preferred_phrases: string[] | null;
  avoided_phrases: string[] | null;
  structural_preferences: string | null;
}): string {
  const lines: string[] = [];
  lines.push('The user you are talking to has a specific voice. Match it naturally in your own writing:');
  if (fp.tone_summary) lines.push('- Tone: ' + fp.tone_summary);
  if (fp.sentence_length) lines.push('- Sentence length: ' + fp.sentence_length);
  if (fp.vocabulary_style) lines.push('- Vocabulary: ' + fp.vocabulary_style);
  if (fp.structural_preferences) lines.push('- Structure: ' + fp.structural_preferences);
  if (fp.preferred_phrases && fp.preferred_phrases.length) {
    lines.push('- Phrases the user likes: ' + fp.preferred_phrases.join(', '));
  }
  if (fp.avoided_phrases && fp.avoided_phrases.length) {
    lines.push('- Phrases to avoid: ' + fp.avoided_phrases.join(', '));
  }
  lines.push("Do not imitate robotically. Align with their register and cadence while staying yourself.");
  return lines.join('\n');
}
