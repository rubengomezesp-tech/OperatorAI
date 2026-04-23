import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  MessageSquare,
  Palette,
  ArrowRight,
  FolderOpen,
  FileText,
  Bot,
  Video,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardRecentImages } from './dashboard-recent';

export const dynamic = 'force-dynamic';

/**
 * Dashboard — product entry point.
 *
 * Design:
 * - 3 primary CTAs above the fold
 * - Recent images (via /api/images/list) — client component
 * - Quick links for organization routes
 * - No empty state without a CTA
 *
 * Data sources verified:
 * - User profile: public.users (full_name, email) joined to auth.users.id
 * - Locale: users.locale
 * - Images: /api/images/list (handles signed URLs for private bucket)
 *
 * NOT included:
 * - Recent campaigns section: the `campaigns` table is not yet present
 *   in migrations. When migration 0016 lands, add a campaigns section
 *   above the images row. See ROUTES_AUDIT.md section 9.
 */
export default async function DashboardPage() {
  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  // Read profile from public.users (verified schema in 0002_auth_orgs.sql)
  const { data: meRaw } = await ssr
    .from('users')
    .select('full_name, email, locale')
    .eq('id', user.id)
    .single();

  const me = meRaw as {
    full_name: string | null;
    email: string;
    locale: string | null;
  } | null;

  const locale: 'en' | 'es' = me?.locale === 'es' ? 'es' : 'en';
  const es = locale === 'es';

  const firstName =
    me?.full_name?.split(' ')[0] ||
    me?.email?.split('@')[0]?.split('.')[0] ||
    '';
  const greetingName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : '';

  const greeting = greetingName
    ? (es ? 'Hola, ' : 'Hello, ') + greetingName + '.'
    : es
    ? 'Hola.'
    : 'Hello.';

  return (
    <div className="px-4 lg:px-10 py-8 max-w-[1240px] mx-auto space-y-10">
      {/* Header */}
      <header>
        <h1 className="font-display text-[28px] lg:text-[34px] leading-[1.1]">
          {greeting}
        </h1>
        <p className="text-[14px] text-fg-muted mt-1.5">
          {es ? 'Que quieres crear hoy?' : 'What are we making today?'}
        </p>
      </header>

      {/* Primary actions */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PrimaryAction
            href="/creative-studio"
            eyebrow={es ? 'Campanas' : 'Campaigns'}
            title={es ? 'Crear campana' : 'Create campaign'}
            description={
              es
                ? 'Sube producto, genera 5 anuncios listos para publicar.'
                : 'Upload a product, get 5 publish-ready ads.'
            }
            icon={Sparkles}
            accent
          />
          <PrimaryAction
            href="/chat"
            eyebrow={es ? 'Conversacion' : 'Conversation'}
            title={es ? 'Chat con tu asistente' : 'Chat with your assistant'}
            description={
              es
                ? 'Pide, itera y planifica en lenguaje natural.'
                : 'Ask, iterate, and plan in plain language.'
            }
            icon={MessageSquare}
          />
          <PrimaryAction
            href="/brand-os"
            eyebrow={es ? 'Marca' : 'Brand'}
            title={es ? 'Configurar Brand OS' : 'Set up Brand OS'}
            description={
              es
                ? 'Paleta, voz, identidad. Todo lo que sale, coherente.'
                : 'Palette, voice, identity. Everything you ship stays on brand.'
            }
            icon={Palette}
          />
        </div>
      </section>

      {/* Recent images + organization row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <SectionHeader
            title={es ? 'Imagenes recientes' : 'Recent images'}
            href="/studio/image"
            linkLabel={es ? 'Abrir Image Studio' : 'Open Image Studio'}
          />
          <DashboardRecentImages locale={locale} />
        </div>

        <div>
          <SectionHeader
            title={es ? 'Organizacion' : 'Organization'}
            href="/projects"
            linkLabel={es ? 'Ver proyectos' : 'View projects'}
          />
          <div className="grid grid-cols-1 gap-2">
            <QuickLink
              href="/projects"
              icon={FolderOpen}
              title={es ? 'Proyectos' : 'Projects'}
              description={
                es
                  ? 'Agrupa campanas y assets por cliente o linea.'
                  : 'Group campaigns and assets by client or line.'
              }
            />
            <QuickLink
              href="/knowledge"
              icon={FileText}
              title="Knowledge"
              description={
                es
                  ? 'Sube documentos. Tu asistente los usa como contexto.'
                  : 'Upload documents. Your assistant uses them as context.'
              }
            />
            <QuickLink
              href="/assistants"
              icon={Bot}
              title={es ? 'Asistentes' : 'Assistants'}
              description={
                es
                  ? 'Crea agentes especializados con instrucciones propias.'
                  : 'Build specialized agents with custom instructions.'
              }
            />
            <QuickLink
              href="/studio/video"
              icon={Video}
              title="Video"
              description={
                es
                  ? 'Genera video corto con IA.'
                  : 'Generate short video with AI.'
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function PrimaryAction({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
  accent = false,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        'group relative rounded-2xl border p-5 transition-all overflow-hidden ' +
        (accent
          ? 'border-gold/30 bg-gradient-to-br from-gold/[0.08] via-surface to-surface hover:border-gold/50'
          : 'border-border bg-surface hover:border-gold/30')
      }
    >
      <div className="flex items-start justify-between mb-6">
        <div
          className={
            'h-9 w-9 rounded-lg flex items-center justify-center ' +
            (accent
              ? 'bg-gold text-bg'
              : 'bg-surface-2 text-fg-muted border border-border')
          }
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <ArrowRight className="h-4 w-4 text-fg-subtle group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-fg-subtle mb-1">
        {eyebrow}
      </div>
      <div className="font-display text-[18px] mb-1 group-hover:text-gold transition-colors">
        {title}
      </div>
      <p className="text-[12.5px] text-fg-muted leading-snug">{description}</p>
    </Link>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="font-display text-[18px]">{title}</h2>
      <Link
        href={href}
        className="text-[11px] text-fg-muted hover:text-gold flex items-center gap-1 transition-colors"
      >
        {linkLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:border-gold/30 transition-colors"
    >
      <div className="h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-fg-muted group-hover:text-gold transition-colors shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium group-hover:text-gold transition-colors">
          {title}
        </div>
        <div className="text-[11px] text-fg-subtle truncate">{description}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-fg-subtle group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
