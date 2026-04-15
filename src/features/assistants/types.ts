export interface AssistantProfileInput {
  name: string;
  business_name: string;
  industry: string | null;
  website: string | null;
  languages: string[];
  audience: string | null;
  services: string[];
  goals: string[];
  tone: string[];
  writing_style: string | null;
  banned_words: string[];
  custom_instructions: string | null;
}

export interface AssistantProfile extends AssistantProfileInput {
  id: string;
  org_id: string;
  slug: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function emptyAssistantInput(): AssistantProfileInput {
  return {
    name: 'Creative Agent',
    business_name: '',
    industry: null,
    website: null,
    languages: ['en'],
    audience: null,
    services: [],
    goals: [],
    tone: [],
    writing_style: null,
    banned_words: [],
    custom_instructions: null,
  };
}
