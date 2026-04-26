'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StepWelcome } from './step-welcome';
import { StepOrganization } from './step-organization';
import { StepAbout } from './step-about';
import { StepBrand } from './step-brand';
import { StepVibe } from './step-vibe';
import { StepFirstPrompt } from './step-first-prompt';
import { StepTour } from './step-tour';

export interface OnboardingData {
  // Welcome
  full_name?: string;
  user_role?: string;

  // Organization (Step 1 — NEW)
  workspace_name?: string;

  // About (Step 2)
  // user_role lives here too (overlap with welcome OK)

  // Brand (Step 3) — UPDATED with C2 fields
  brand_name?: string;
  description?: string;
  website_url?: string;
  detected_logo_url?: string;
  detected_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    palette?: Array<{ hex: string; weight: number }>;
  };

  // Vibe (Step 4)
  vibe?: 'minimal' | 'editorial' | 'bold' | 'playful';

  // First prompt (Step 5)
  first_prompt?: string;
}

const TOTAL_STEPS = 7; // 0:Welcome 1:Org 2:About 3:Brand 4:Vibe 5:FirstPrompt 6:Tour

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
    return () => {
      cancelled = true;
    };
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
    await saveState(TOTAL_STEPS - 1, merged, true);
    toast.success("You're all set!");
    router.push('/dashboard');
    router.refresh();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-fg-subtle text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {step === 0 && <StepWelcome email={userEmail} onNext={() => next({})} />}
      {step === 1 && <StepOrganization data={data} onNext={next} onBack={back} />}
      {step === 2 && <StepAbout data={data} onNext={next} onBack={back} />}
      {step === 3 && <StepBrand data={data} onNext={next} onBack={back} />}
      {step === 4 && <StepVibe data={data} onNext={next} onBack={back} />}
      {step === 5 && <StepFirstPrompt data={data} onNext={next} onBack={back} />}
      {step === 6 && <StepTour data={data} onComplete={complete} onBack={back} />}
    </div>
  );
}
