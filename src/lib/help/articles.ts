/**
 * 📚 HELP ARTICLES
 *
 * Catálogo estático de artículos de ayuda.
 * Se renderizan en /help y se buscan desde cmd+/
 *
 * Para añadir artículo nuevo:
 *   1. Asignar id único + category válida
 *   2. Slug url-safe
 *   3. Title + body con markdown ligero
 */

export type HelpCategory =
  | 'getting-started'
  | 'billing'
  | 'integrations'
  | 'brands'
  | 'troubleshooting';

export interface HelpArticle {
  id: string;
  slug: string;
  category: HelpCategory;
  title: string;
  excerpt: string;
  body: string;
  /** Page paths where this article is most relevant (for in-app help) */
  relevantPaths?: string[];
  keywords?: string[];
}

export const HELP_CATEGORIES: { id: HelpCategory; label: string; description: string }[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    description: 'First steps with Operator AI',
  },
  {
    id: 'billing',
    label: 'Billing & plans',
    description: 'Subscriptions, payments, invoices',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Gmail, Calendar, Drive, Slack',
  },
  {
    id: 'brands',
    label: 'Brands & workspaces',
    description: 'Multi-brand, teams, organizations',
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    description: 'Common issues and fixes',
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // ═══ GETTING STARTED ═══
  {
    id: 'what-is-operator',
    slug: 'what-is-operator-ai',
    category: 'getting-started',
    title: 'What is Operator AI?',
    excerpt: 'Operator AI is a complete creative team in one product: strategist, designer, copywriter, and executor.',
    body: `Operator AI gives you a senior marketing/creative agent that can:

- **Create** campaigns, ads, videos, illustrations
- **Manage** your knowledge base with brand guidelines and references
- **Execute** real actions: send emails, schedule meetings, search files in Drive, post to Slack — all through the chat
- **Adapt** to your brand voice, visual style, audience, and pillars

It's not a chatbot. It's an operator that takes action.`,
    keywords: ['intro', 'what', 'overview', 'about'],
  },
  {
    id: 'first-steps',
    slug: 'first-steps',
    category: 'getting-started',
    title: 'First steps after signing up',
    excerpt: 'Connect your brand, upload knowledge, link your tools, and create your first campaign.',
    body: `**1. Set up your brand** (/brand-os)
Drop your website URL and we'll extract colors, logo, voice, and audience automatically.

**2. Upload knowledge** (/knowledge)
Add brand guidelines, briefs, contracts, references. The AI uses these as context.

**3. Connect integrations** (/settings/integrations)
Gmail, Calendar, Drive, Slack — so the agent can take action, not just suggest.

**4. Start creating** (/chat)
"Create me 3 Instagram ads for our new launch"
"Draft an email to the team about the deck review"
"Schedule a strategy call with Anna for Friday at 14:00"

You're not learning a new tool. You're hiring a teammate.`,
    relevantPaths: ['/chat', '/welcome'],
    keywords: ['onboarding', 'setup', 'start', 'begin'],
  },
  {
    id: 'creating-campaigns',
    slug: 'creating-campaigns',
    category: 'getting-started',
    title: 'How to create a campaign',
    excerpt: 'Use the chat or the campaign wizard to generate ads in your brand style.',
    body: `**From chat (recommended)**
Just describe what you need: "Make me 3 vertical Instagram ads for our spring collection, luxury vibe, gold and navy."

The agent picks layout archetypes + style DNAs from our 32×60 = 1920 combinations and generates variants.

**From wizard** (/campaigns/new)
Step-by-step:
1. Vertical (e.g., Fashion, SaaS, Food)
2. Campaign type (Launch, Promo, Brand awareness)
3. Brief description
4. Click 'Generate' — get 4 variants

Each variant is editable: change copy, swap layout, adjust palette.`,
    relevantPaths: ['/campaigns', '/campaigns/new', '/chat'],
    keywords: ['campaign', 'ad', 'create', 'generate'],
  },
  {
    id: 'using-knowledge',
    slug: 'using-knowledge-base',
    category: 'getting-started',
    title: 'How does the Knowledge Base work?',
    excerpt: 'Upload documents and the agent uses them as context in every conversation.',
    body: `The Knowledge Base is your AI's brain.

**What to upload:**
- Brand guidelines (PDF, DOCX)
- Past campaigns / case studies
- Customer testimonials
- Product specs / pricing
- Tone of voice docs

**How it works:**
- Documents are split into chunks
- Each chunk is embedded (semantic search ready)
- When you ask the agent something, it pulls relevant chunks
- The agent cites which doc influenced the answer

**Categories:**
We auto-classify documents (brand asset, product, customer, etc) so the AI knows what's relevant for each task.

**Limits per plan:**
- Starter: 10 docs
- Pro: 100 docs
- Studio: 1000+ docs`,
    relevantPaths: ['/knowledge'],
    keywords: ['knowledge', 'documents', 'rag', 'upload'],
  },

  // ═══ BILLING ═══
  {
    id: 'plans-overview',
    slug: 'plans-overview',
    category: 'billing',
    title: 'What plans are available?',
    excerpt: 'Starter, Pro, Studio, and Agency — different limits for different needs.',
    body: `**Starter — $29/mo**
For individuals
- 200 chat messages/mo
- 30 image generations/mo
- 10 knowledge documents
- 2 integrations
- 1 team seat

**Pro — $99/mo** (most popular)
For brands and pros
- 1,500 chat messages/mo
- 150 image generations/mo
- 5 video generations/mo
- 100 knowledge documents
- 10 integrations
- 5 projects/brands
- 1 team seat

**Studio — $299/mo**
For studios with multiple brands
- 15,000 chat messages/mo
- 1,500 image generations/mo
- Unlimited knowledge docs
- 50 integrations
- 25 projects/brands
- 5 team seats

**Agency — $999/mo**
For agencies running campaigns at scale
- 50,000 chat messages/mo
- 5,000 image generations/mo
- Unlimited everything
- 25 team seats
- White-label option
- Priority support

All plans include a 14-day free trial.`,
    relevantPaths: ['/pricing', '/billing', '/settings/billing'],
    keywords: ['plan', 'price', 'subscription', 'tier'],
  },
  {
    id: 'free-trial',
    slug: 'free-trial',
    category: 'billing',
    title: 'How does the free trial work?',
    excerpt: 'Every new user gets 14 days on the Pro plan. No credit card required.',
    body: `When you sign up, we automatically activate a **14-day Pro trial**:

- All Pro features unlocked
- Pro quotas (1,500 chats, 150 images, 100 docs, etc.)
- No credit card required to start

**At day 7, 3, and 1** before trial ends, you get a reminder email.

**At day 0**, your subscription becomes 'expired' and access to plan features is paused. Your data is preserved.

To activate paid plan: /settings/billing → choose plan → enter payment method → instant upgrade.

You can downgrade or cancel anytime.`,
    relevantPaths: ['/billing'],
    keywords: ['trial', 'free', 'days', 'expire'],
  },
  {
    id: 'cancel-subscription',
    slug: 'how-to-cancel',
    category: 'billing',
    title: 'How do I cancel my subscription?',
    excerpt: 'Cancel from /settings/billing. Access continues until end of billing period.',
    body: `1. Go to /settings/billing
2. Click 'Manage subscription'
3. Cancel subscription

Your access continues until the end of your current billing period. After that, account becomes read-only (data preserved).

To delete data permanently, see /settings/privacy → Delete account.`,
    relevantPaths: ['/settings/billing'],
    keywords: ['cancel', 'unsubscribe', 'stop'],
  },
  {
    id: 'invoices',
    slug: 'invoices-and-receipts',
    category: 'billing',
    title: 'Where can I find my invoices?',
    excerpt: 'All invoices are accessible from /settings/billing → Invoices.',
    body: `Stripe sends each invoice to your email automatically.

You can also download all past invoices from:
**/settings/billing → Invoices** (PDF download)

For tax/VAT updates, contact hi@operatoraiapp.com.`,
    relevantPaths: ['/settings/billing'],
    keywords: ['invoice', 'receipt', 'tax', 'vat'],
  },

  // ═══ INTEGRATIONS ═══
  {
    id: 'connect-gmail',
    slug: 'connect-gmail',
    category: 'integrations',
    title: 'How to connect Gmail',
    excerpt: 'In /settings/integrations → click "Connect" on Gmail → authorize Google.',
    body: `**Steps:**
1. Go to /settings/integrations
2. Find Gmail card → click 'Conectar'
3. Google OAuth screen → authorize
4. Returns to integrations page → card turns gold = connected

**What can the agent do once connected:**
- Send emails on your behalf (always asks confirmation first)
- Search inbox by sender, subject, keywords
- Draft replies in your voice
- Summarize unread emails

**Security:**
We use Composio.dev to manage OAuth tokens. Your credentials never touch our servers. You can revoke access anytime from your Google account settings or by clicking 'Disconnect'.`,
    relevantPaths: ['/settings/integrations'],
    keywords: ['gmail', 'email', 'connect', 'oauth'],
  },
  {
    id: 'connect-calendar',
    slug: 'connect-calendar',
    category: 'integrations',
    title: 'How to connect Google Calendar',
    excerpt: 'In /settings/integrations → click "Connect" on Google Calendar.',
    body: `Once connected, the agent can:
- **Create events** from natural language ("Schedule call with Anna Friday 14:00")
- **List upcoming events** for context
- **Find available time slots** between attendees
- **Brief you** before each meeting with relevant emails/docs

The agent always confirms before creating events.`,
    relevantPaths: ['/settings/integrations'],
    keywords: ['calendar', 'meeting', 'event', 'schedule'],
  },
  {
    id: 'integration-not-working',
    slug: 'integration-not-working',
    category: 'integrations',
    title: "My integration isn't working — what to do?",
    excerpt: 'Check status, refresh OAuth, or contact support.',
    body: `**Common fixes:**

1. **Card stuck on 'Pending'**
   Refresh the page after 30s. The OAuth callback can take a few seconds.

2. **'Integration limit reached'**
   Upgrade your plan or disconnect unused integrations.

3. **'Tool execution failed'**
   The OAuth token may have expired. Disconnect and reconnect.

4. **Status page check**
   Go to /status to verify Composio (the integration backend) is operational.

If problem persists, email hi@operatoraiapp.com with the integration name + error message.`,
    relevantPaths: ['/settings/integrations'],
    keywords: ['error', 'broken', 'fix', 'troubleshoot', 'integration'],
  },

  // ═══ BRANDS ═══
  {
    id: 'multi-brand',
    slug: 'multi-brand-support',
    category: 'brands',
    title: 'How do I manage multiple brands?',
    excerpt: 'Use the brand switcher in the topbar to add and switch between brands.',
    body: `Operator AI supports unlimited brands per organization.

**To add a brand:**
1. Click brand pill in topbar (top-left)
2. 'Add new brand'
3. Choose:
   - **From URL**: paste website, we extract colors/logo/voice
   - **Manual**: enter name + description

**To switch active brand:**
Click brand pill → click any brand from list. The whole app context (campaigns, knowledge, brand-os) reflects the active brand.

**To delete a brand:**
/brand-os → Settings → Delete (only owners/admins).
Cannot delete if it's the only brand.

**Plan limits:**
- Starter: 1 brand
- Pro: 5 brands
- Studio: 25 brands
- Agency: unlimited`,
    relevantPaths: ['/brand-os', '/chat'],
    keywords: ['brand', 'multi', 'switch', 'add', 'manage'],
  },
  {
    id: 'invite-team',
    slug: 'invite-team-members',
    category: 'brands',
    title: 'How to invite team members',
    excerpt: 'In /settings/team → "Invite member" → choose role → send email invite.',
    body: `**Roles:**
- **Owner** — full control: billing, settings, members, brands
- **Admin** — invite/remove members, manage settings (no billing or org delete)
- **Member** — regular use of all features
- **Viewer** — read-only access

**Invite flow:**
1. /settings/team → 'Invite member'
2. Email + role
3. They receive branded invite email
4. They click → sign up or log in → auto-joined to your org

**Limits per plan:**
- Starter & Pro: 1 seat
- Studio: 5 seats
- Agency: 25 seats

**Owner protection:**
Last owner cannot be removed. Transfer ownership first.`,
    relevantPaths: ['/settings/team'],
    keywords: ['team', 'invite', 'member', 'collaborator', 'role'],
  },

  // ═══ TROUBLESHOOTING ═══
  {
    id: 'chat-not-responding',
    slug: 'chat-not-responding',
    category: 'troubleshooting',
    title: 'The chat is not responding',
    excerpt: 'Check status page, refresh, or try a new conversation.',
    body: `**Quick fixes:**

1. **Refresh the page** — clears state issues
2. **Try a new conversation** — sometimes a corrupt conversation gets stuck
3. **Check /status** — Anthropic or OpenAI may be having issues
4. **Check your quota** — /settings/billing may show 'limit reached'

**Still broken?**
Email hi@operatoraiapp.com with:
- The conversation URL
- What you typed
- What happened (or didn't)`,
    relevantPaths: ['/chat'],
    keywords: ['chat', 'broken', 'stuck', 'no response', 'silent'],
  },
  {
    id: 'image-generation-failed',
    slug: 'image-generation-failed',
    category: 'troubleshooting',
    title: 'Image generation failed',
    excerpt: 'Common causes: quota, content policy, or transient model error.',
    body: `**If it failed once:**
Try again — the image models (Flux, GPT) sometimes have transient errors.

**If it fails consistently:**
1. **Check quota** — /settings/billing
2. **Check prompt** — avoid copyrighted characters, real people's faces
3. **Check brand consistency** — sometimes the brand context conflicts with the request
4. **Check /status** — Replicate may be down

**Plan quotas:**
- Starter: 30 images/mo
- Pro: 150/mo
- Studio: 1,500/mo
- Agency: 5,000/mo`,
    relevantPaths: ['/chat', '/campaigns'],
    keywords: ['image', 'generation', 'failed', 'error', 'flux'],
  },
  {
    id: 'forgot-password',
    slug: 'forgot-password',
    category: 'troubleshooting',
    title: 'I forgot my password',
    excerpt: 'Use /forgot-password to reset via email.',
    body: `1. Go to https://operatoraiapp.com/forgot-password
2. Enter your email
3. Check your inbox for a reset link (1 minute)
4. Click link → set new password

If email doesn't arrive:
- Check spam folder
- Wait 5 min (sometimes delayed)
- Email hi@operatoraiapp.com with your account email`,
    relevantPaths: ['/login'],
    keywords: ['password', 'forgot', 'reset', 'lost'],
  },
  {
    id: 'delete-account',
    slug: 'delete-my-account',
    category: 'troubleshooting',
    title: 'How to delete my account',
    excerpt: 'In /settings/privacy → "Delete account" with confirmation.',
    body: `**Permanent deletion (GDPR Art. 17):**

1. Go to /settings/privacy
2. Click 'Eliminar mi cuenta'
3. Type 'DELETE' in confirmation
4. Receive email confirming deletion

**What gets deleted:**
- Profile, conversations, messages
- Knowledge documents (BD + storage)
- Campaigns, brand profiles
- Memory entries, integrations
- Memberships and orgs (if you're sole owner)
- Auth user record

**Before deleting:**
You may want to export your data first → /settings/privacy → 'Descargar JSON'

**Need help?**
Email hi@operatoraiapp.com.`,
    relevantPaths: ['/settings/privacy'],
    keywords: ['delete', 'remove', 'account', 'gdpr'],
  },
];

// ─── helpers ─────────────────────────────────────────────────

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category);
}

export function getRelevantArticles(currentPath: string, limit = 4): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => {
    if (!a.relevantPaths) return false;
    return a.relevantPaths.some((p) => currentPath === p || currentPath.startsWith(p + '/'));
  }).slice(0, limit);
}

export function searchArticles(query: string): HelpArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return HELP_ARTICLES.filter((a) => {
    if (a.title.toLowerCase().includes(q)) return true;
    if (a.excerpt.toLowerCase().includes(q)) return true;
    if (a.body.toLowerCase().includes(q)) return true;
    if (a.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
    return false;
  });
}
