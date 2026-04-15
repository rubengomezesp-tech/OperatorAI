export interface PlanDefinition {
  id: 'starter' | 'pro' | 'agency';
  name: string;
  tagline: string;
  priceCents: number;
  priceDisplay: string;
  quotas: {
    chatMessages: number;
    imageGenerations: number;
    knowledgeDocuments: number;
    assistants: number;
  };
  features: string[];
  highlight?: boolean;
  cta: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For individuals and small projects',
    priceCents: 2900,
    priceDisplay: '$29',
    quotas: { chatMessages: 500, imageGenerations: 50, knowledgeDocuments: 10, assistants: 1 },
    features: [
      'GPT-4o, Claude Sonnet 4.5, Gemini 3.1 Pro',
      '500 chat messages / month',
      '50 AI images / month',
      '10 documents in Knowledge',
      '1 branded assistant',
      'Email support',
    ],
    cta: 'Start with Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For brands and independent professionals',
    priceCents: 9900,
    priceDisplay: '$99',
    quotas: { chatMessages: 3000, imageGenerations: 300, knowledgeDocuments: 100, assistants: 5 },
    features: [
      'Everything in Starter',
      '3,000 chat messages / month',
      '300 AI images / month',
      '100 documents in Knowledge',
      '5 branded assistants',
      'Reference images + refinement',
      'All editorial presets',
      'Priority support',
    ],
    highlight: true,
    cta: 'Start with Pro',
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'For studios managing multiple brands',
    priceCents: 29900,
    priceDisplay: '$299',
    quotas: { chatMessages: 15000, imageGenerations: 1500, knowledgeDocuments: 999999, assistants: 999999 },
    features: [
      'Everything in Pro',
      '15,000 chat messages / month',
      '1,500 AI images / month',
      'Unlimited documents',
      'Unlimited assistants',
      'Concierge onboarding',
      'Custom branding',
      'Dedicated account manager',
    ],
    cta: 'Start with Agency',
  },
];

export function findPlan(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatLimit(n: number): string {
  if (n >= 999999) return 'Unlimited';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return n.toString();
}
