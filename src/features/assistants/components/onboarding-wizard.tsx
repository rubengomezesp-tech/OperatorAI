'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { emptyAssistantInput, type AssistantProfileInput } from '../types';
import { StepIdentity } from './step-identity';
import { StepAudience } from './step-audience';
import { StepVoice } from './step-voice';
import { StepCustom } from './step-custom';

const STEPS = [
  { key: 'identity',  title: 'Identity',            subtitle: 'The basics. Who the assistant represents.' },
  { key: 'audience',  title: 'Audience & offer',    subtitle: 'Who you speak to, what you offer.' },
  { key: 'voice',     title: 'Voice & style',       subtitle: 'How the assistant should sound.' },
  { key: 'custom',    title: 'Custom instructions', subtitle: 'Fine-tune behavior. Optional but powerful.' },
] as const;

interface Props {
  initial?: Partial<AssistantProfileInput>;
  /**
   * If mode === "create", POSTs to /api/assistants/create with isDefault=true and redirects to /chat.
   * If mode === "edit", PUT-style update on existing id and redirects to /assistants.
   */
  mode: 'create' | 'edit';
  existingId?: string;
}

export function OnboardingWizard({ initial, mode, existingId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AssistantProfileInput>({
    ...emptyAssistantInput(),
    ...(initial ?? {}),
  });
  const [saving, setSaving] = useState(false);

  const patch = useCallback((p: Partial<AssistantProfileInput>) => {
    setData((d) => ({ ...d, ...p }));
  }, []);

  const canProceedIdentity = !!data.business_name.trim();
  const canFinish = canProceedIdentity;

  async function save() {
    setSaving(true);
    try {
      if (mode === 'create') {
        const res = await fetch('/api/assistants/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, isDefault: true }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Failed');
        toast.success('Assistant ready');
        router.push('/chat');
        router.refresh();
      } else {
        if (!existingId) throw new Error('Missing assistant id');
        const res = await fetch('/api/assistants/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingId, ...data }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Failed');
        toast.success('Assistant updated');
        router.push('/assistants');
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto w-full">
      <div className="text-center mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          {mode === 'create' ? 'Set up your assistant' : 'Edit assistant'}
        </div>
        <h1 className="font-display text-[36px] leading-[1.1]">
          Teach your <span className="text-gold-grad">Creative Agent</span>
        </h1>
        <p className="text-[14px] text-fg-muted mt-3 max-w-[420px] mx-auto">
          A few minutes now. Every answer from Operator AI gets sharper, truer to your brand, and impossible to tell apart from a senior on your team.
        </p>
      </div>

      {/* Step tracker */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => { if (i <= step || done) setStep(i); }}
              className={cn(
                'flex-1 h-1 rounded-full transition-all',
                done ? 'gold-grad' : active ? 'bg-gold/50' : 'bg-border',
              )}
              aria-label={s.title}
            />
          );
        })}
      </div>

      <div className="surface-raised p-7">
        <div className="mb-6">
          <h2 className="font-display text-[22px] mb-1">{STEPS[step].title}</h2>
          <p className="text-[13px] text-fg-muted">{STEPS[step].subtitle}</p>
        </div>

        {step === 0 && <StepIdentity value={data} onChange={patch} />}
        {step === 1 && <StepAudience value={data} onChange={patch} />}
        {step === 2 && <StepVoice value={data} onChange={patch} />}
        {step === 3 && <StepCustom value={data} onChange={patch} />}

        <div className="flex items-center justify-between pt-7 mt-7 border-t border-border">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || saving}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="md"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !canProceedIdentity}
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="md"
              onClick={save}
              loading={saving}
              disabled={!canFinish}
            >
              <Check className="h-4 w-4" />
              <span>{mode === 'create' ? 'Create assistant' : 'Save changes'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
