export interface PlanDefinition {
  id: 'starter' | 'pro' | 'studio' | 'agency';
  name: string;
  tagline: string;
  priceCents: number;
  priceDisplay: string;
  quotas: {
    chatMessages: number;
    imageGenerations: number;
    knowledgeDocuments: number;
    assistants: number;
    projects: number;
    integrations: number;
    videoGenerations: number;
  };
  features: string[];
  highlight?: boolean;
  cta: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For individuals',
    priceCents: 2900,
    priceDisplay: '$29',
    quotas: { chatMessages: 500, imageGenerations: 50, knowledgeDocuments: 10, assistants: 1, projects: 1, integrations: 2, videoGenerations: 10 },
    features: [
      '3 AI models (GPT-4o, Claude 4.5, Gemini 3.1)',
      '500 chat messages / mo',
      '50 AI images / mo',
      '10 knowledge documents',
      '1 project',
      '2 integrations',
      'Voice mode + memory',
      '10 AI videos / mo (Veo 3.1)',
      'Email support',
    ],
    cta: 'Start with Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For brands and pros',
    priceCents: 9900,
    priceDisplay: '$99',
    quotas: { chatMessages: 3000, imageGenerations: 300, knowledgeDocuments: 100, assistants: 5, projects: 5, integrations: 10, videoGenerations: 100 },
    features: [
      'Everything in Starter',
      '3,000 chat messages / mo',
      '300 AI images / mo',
      '100 knowledge documents',
      '5 projects',
      '10 integrations (Gmail, Notion, Slack...)',
      '6 specialized agents',
      'Reference images + refinement',
      '100 AI videos / mo (Veo 3.1)',
      'Priority support',
    ],
    highlight: true,
    cta: 'Start with Pro',
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'For studios with multiple brands',
    priceCents: 29900,
    priceDisplay: '$299',
    quotas: { chatMessages: 15000, imageGenerations: 1500, knowledgeDocuments: 999999, assistants: 999999, projects: 25, integrations: 50, videoGenerations: 500 },
    features: [
      'Everything in Pro',
      '15,000 chat messages / mo',
      '1,500 AI images / mo',
      '500 AI videos / mo (Veo 3.1)',
      'Unlimited documents & assistants',
      '25 projects',
      '50 integrations',
      '5 team seats',
      'Concierge onboarding',
    ],
    cta: 'Start with Studio',
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'White-label for agencies',
    priceCents: 99900,
    priceDisplay: '$999',
    quotas: { chatMessages: 50000, imageGenerations: 5000, knowledgeDocuments: 999999, assistants: 999999, projects: 999999, integrations: 999999, videoGenerations: 999999 },
    features: [
      'Everything in Studio',
      '50,000 chat messages / mo',
      '5,000 AI images / mo',
      'Unlimited AI videos (Veo 3.1)',
      'Unlimited projects + integrations',
      '25 team seats',
      'White-label (your domain, your logo)',
      'Custom AI training on your IP',
      'Dedicated account manager',
      'SLA 99.9%',
    ],
    cta: 'Talk to sales',
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
