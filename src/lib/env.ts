import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url().optional());

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Operator AI'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),

  DEFAULT_TEXT_PROVIDER: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  DEFAULT_IMAGE_PROVIDER: z.enum(['replicate']).default('replicate'),

  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: optionalUrl.transform((v) => v ?? 'https://cloud.langfuse.com'),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  COMPOSIO_API_KEY: z.string().optional(),
  COMPOSIO_AUTH_CONFIG_GMAIL: z.string().optional(),
  COMPOSIO_AUTH_CONFIG_GCAL: z.string().optional(),
  COMPOSIO_AUTH_CONFIG_GDRIVE: z.string().optional(),
  COMPOSIO_AUTH_CONFIG_SLACK: z.string().optional(),
  BRAVE_API_KEY: z.string().optional(),

  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Operator AI <noreply@operatorai.app>'),
});

export const serverEnv = (() => {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv accessed in browser');
  }
  return serverSchema.parse(process.env);
})();
