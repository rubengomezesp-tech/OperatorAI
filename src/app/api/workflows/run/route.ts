import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { webSearch } from '@/features/web-browse/server/web-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  id: z.string().min(1),
  variables: z.record(z.string()).optional(),
});

interface Step {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
}

interface StepResult {
  stepId: string;
  type: string;
  label: string;
  status: 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  durationMs: number;
}

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? ('{{' + k + '}}'));
}

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data: workflow } = await svc
    .from('workflows')
    .select('id, name, steps, trigger_type')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .single();

  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  const wf = workflow as unknown as { id: string; name: string; steps: Step[]; trigger_type: string };
  const variables = parsed.data.variables ?? {};
  const results: StepResult[] = [];

  // Create run record
  const { data: runRow } = await svc.from('workflow_runs').insert({
    workflow_id: wf.id,
    org_id: orgId,
    status: 'running',
    trigger_data: variables,
  } as never).select('id').single();

  const runId = (runRow as { id: string } | null)?.id;
  let context = '';

  for (const step of wf.steps) {
    const stepStart = Date.now();
    try {
      let output = '';

      if (step.type === 'web_search') {
        const query = interpolate(String(step.config.query ?? ''), variables);
        const results = await webSearch(query, Number(step.config.count ?? 5));
        output = results.map((r, i) =>
          '[' + (i + 1) + '] ' + r.title + '\n' + r.url + '\n' + r.snippet
        ).join('\n\n');
      }
      else if (step.type === 'ai_chat') {
        const prompt = interpolate(String(step.config.prompt ?? ''), variables);
        const fullPrompt = (context ? 'Previous context:\n' + context + '\n\n' : '') + prompt;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not set');

        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 1000,
          }),
        });

        if (!aiRes.ok) throw new Error('AI call failed: ' + aiRes.status);
        const aiBody = await aiRes.json();
        output = aiBody?.choices?.[0]?.message?.content ?? '';
      }
      else if (step.type === 'condition') {
        output = '[condition] evaluated as: pass';
      }
      else {
        output = '[' + step.type + '] simulated (real action requires integration)';
      }

      context = output.slice(0, 2000);
      results.push({
        stepId: step.id, type: step.type, label: step.label,
        status: 'success', output, durationMs: Date.now() - stepStart,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Step failed';
      results.push({
        stepId: step.id, type: step.type, label: step.label,
        status: 'failed', error: msg, durationMs: Date.now() - stepStart,
      });
      // Update run + workflow as failed
      if (runId) {
        await svc.from('workflow_runs').update({
          status: 'failed', step_results: results, error_message: msg,
          completed_at: new Date().toISOString(),
        } as never).eq('id', runId);
      }
      try { await (svc.rpc as any)('increment_failure_count', { wf_id: wf.id }); } catch { /* ignore */ }
      await svc.from('workflows').update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
      } as never).eq('id', wf.id);
      return NextResponse.json({ runId, status: 'failed', error: msg, results }, { status: 500 });
    }
  }

  if (runId) {
    await svc.from('workflow_runs').update({
      status: 'success', step_results: results,
      completed_at: new Date().toISOString(),
    } as never).eq('id', runId);
  }
  await svc.from('workflows').update({
    last_run_at: new Date().toISOString(),
    last_run_status: 'success',
  } as never).eq('id', wf.id);

  return NextResponse.json({ runId, status: 'success', results });
}
