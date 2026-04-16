'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StepWelcome } from './step-welcome';
import { StepAbout } from './step-about';
import { StepBrand } from './step-brand';
import { StepVibe } from './step-vibe';
import { StepFirstPrompt } from './step-first-prompt';
import { StepTour } from './step-tour';

export interface OnboardingData {
  full_name?: string;
  user_role?: string;
  brand_name?: string;
  description?: string;
  vibe?: 'minimal' | 'editorial' | 'bold' | 'playful';
  first_prompt?: string;
}

export function OnboardingWizard({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [loading, setLoading] = useState(true);

  // Load saved state on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/state');
        if (res.ok) {
          const body = await res.json();
          if (!cancelled && body.state) {
            if (body.state.completed) {
              router.replace('/dashboard');
              return;
            }
            setStep(body.state.current_step ?? 0);
            setData((body.state.data ?? {}) as OnboardingData);
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function saveState(newStep: number, newData: OnboardingData, completed = false) {
    try {
      await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: newStep, data: newData, completed }),
      });
    } catch {
      // non-fatal
    }
  }

  async function next(partial: Partial<OnboardingData>) {
    const merged = { ...data, ...partial };
    setData(merged);
    const nextStep = step + 1;
    setStep(nextStep);
    await saveState(nextStep, merged, false);
  }

  async function complete(partial: Partial<OnboardingData>) {
    const merged = { ...data, ...partial };
    setData(merged);
    await saveState(6, merged, true);
    toast.success('You\'re all set!');
    router.push('/dashboard');
    router.refresh();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="h-8 w-8 rounded-full gold-grad animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-surface-2 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 gold-grad transition-all duration-500 ease-out"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[640px]">
          {step === 0 && <StepWelcome onNext={() => next({})} email={userEmail} />}
          {step === 1 && <StepAbout data={data} onNext={next} onBack={back} />}
          {step === 2 && <StepBrand data={data} onNext={next} onBack={back} />}
          {step === 3 && <StepVibe data={data} onNext={next} onBack={back} />}
          {step === 4 && <StepFirstPrompt data={data} onNext={next} onBack={back} />}
          {step === 5 && <StepTour data={data} onComplete={complete} onBack={back} />}
        </div>
      </div>

      {/* Skip — available after step 1 */}
      {step > 0 && step < 5 && (
        <div className="text-center pb-6">
          <button
            type="button"
            onClick={() => complete(data)}
            className="text-[11.5px] uppercase tracking-[0.14em] text-fg-subtle hover:text-gold transition-colors"
          >
            Skip onboarding
          </button>
        </div>
      )}
    </div>
  );
}
