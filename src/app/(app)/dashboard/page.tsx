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
 */
export default async function DashboardPage() {
  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  if (!user) redirect('/login');

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
    <div className="w-full max-w-full min-w-0 overflow-x-hidden px-4 lg:px-10 py-8 mx-auto space-y-10">
      <header className="min-w-0">
        <h1 className="font-display text-[28px] lg:text-[34px] leading-[1.1] break-words">
          {greeting}
        </h1>
        <p className="text-[14px] text-fg-muted mt-1.5">
          {es ? 'Que quieres crear hoy?' : 'What are we making today?'}
        </p>
      </header>

      <section className="min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
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

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
        <div className="min-w-0">
          <SectionHeader
            title={es ? 'Imagenes recientes' : 'Recent images'}
            href="/studio/image"
            linkLabel={es ? 'Abrir Image Studio' : 'Open Image Studio'}
          />
          <DashboardRecentImages locale={locale} />
        </div>

        <div className="min-w-0">
          <SectionHeader
            title={es ? 'Organizacion' : 'Organization'}
            href="/projects"
            linkLabel={es ? 'Ver proyectos' : 'View projects'}
          />
          <div className="grid grid-cols-1 gap-2 min-w-0">
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
        'group relative min-w-0 rounded-2xl border p-5 transition-all overflow-hidden ' +
        (accent
          ? 'border-gold/30 bg-gradient-to-br from-gold/[0.08] via-surface to-surface hover:border-gold/50'
          : 'border-border bg-surface hover:border-gold/30')
      }
    >
      <div className="flex items-start justify-between mb-6 gap-3 min-w-0">
        <div
          className={
            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ' +
            (accent
              ? 'bg-gold text-bg'
              : 'bg-surface-2 text-fg-muted border border-border')
          }
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
      </div>

      <div className="text-[10px] uppercase tracking-[0.16em] text-fg-subtle mb-1 break-words">
        {eyebrow}
      </div>
      <div className="font-display text-[18px] mb-1 group-hover:text-gold transition-colors break-words">
        {title}
      </div>
      <p className="text-[12.5px] text-fg-muted leading-snug break-words">
        {description}
      </p>
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
    <div className="flex items-end justify-between gap-3 mb-3 min-w-0">
      <h2 className="font-display text-[18px] break-words">{title}</h2>
      <Link
        href={href}
        className="shrink-0 text-[11px] text-fg-muted hover:text-gold flex items-center gap-1 transition-colors"
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
      className="group flex items-center gap-3 min-w-0 p-3 rounded-lg border border-border bg-surface hover:border-gold/30 transition-colors"
    >
      <div className="h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-fg-muted group-hover:text-gold transition-colors shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium group-hover:text-gold transition-colors break-words">
          {title}
        </div>
        <div className="text-[11px] text-fg-subtle truncate">{description}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-subtle group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
