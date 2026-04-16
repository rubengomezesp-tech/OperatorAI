'use client';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import {
  MessageSquare, ImageIcon, Video, Mic, Zap, FileSpreadsheet,
  FolderOpen, Brain, Plug, Megaphone, Type, Search, ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';

type TileKey = 'creative_agent' | 'image_studio' | 'video_studio' | 'voice_mode' | 'workflows' | 'files' | 'projects' | 'knowledge' | 'memory' | 'integrations' | 'campaigns' | 'copywriter';

type Tile = { href: string; labelKey: string; descKey: TileKey; icon: LucideIcon; accent?: boolean };

const tiles: Tile[] = [
  { href: '/chat', labelKey: 'nav.creative_agent', descKey: 'creative_agent', icon: MessageSquare, accent: true },
  { href: '/studio/image', labelKey: 'nav.image_studio', descKey: 'image_studio', icon: ImageIcon },
  { href: '/studio/video', labelKey: 'nav.video_studio', descKey: 'video_studio', icon: Video, accent: true },
  { href: '/voice', labelKey: 'nav.voice_mode', descKey: 'voice_mode', icon: Mic },
  { href: '/workflows', labelKey: 'nav.workflows', descKey: 'workflows', icon: Zap },
  { href: '/files', labelKey: 'nav.files', descKey: 'files', icon: FileSpreadsheet },
  { href: '/projects', labelKey: 'nav.projects', descKey: 'projects', icon: FolderOpen },
  { href: '/knowledge', labelKey: 'nav.knowledge', descKey: 'knowledge', icon: Search },
  { href: '/settings/memory', labelKey: 'nav.memory', descKey: 'memory', icon: Brain },
  { href: '/settings/integrations', labelKey: 'nav.integrations', descKey: 'integrations', icon: Plug },
  { href: '/studio/campaign', labelKey: 'nav.campaigns', descKey: 'campaigns', icon: Megaphone },
  { href: '/studio/copy', labelKey: 'nav.copywriter', descKey: 'copywriter', icon: Type },
];

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] w-full mx-auto space-y-10">
      <section className="relative overflow-hidden surface-raised p-8 lg:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full gold-grad opacity-[0.08] blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">{t('dash.title')}</div>
          <h2 className="font-display text-[40px] lg:text-[52px] leading-[1.05]">
            {t('dash.headline')} <span className="text-gold-grad">{t('dash.headline_accent')}</span>.
          </h2>
          <p className="text-[15px] text-fg-muted mt-4 max-w-xl">{t('dash.subtitle')}</p>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h3 className="font-display text-[20px]">{t('dash.modules')}</h3>
          <span className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
            {String(tiles.length).padStart(2, '0')} {t('dash.tools')}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.href} href={tile.href} className="group">
                <Card className="h-full transition-all group-hover:border-gold/50 group-hover:-translate-y-0.5">
                  <CardBody className="flex gap-5">
                    <div className={'h-12 w-12 rounded-md shrink-0 flex items-center justify-center border border-border ' + (tile.accent ? 'text-bg gold-grad' : 'text-gold')}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[16px] font-medium tracking-tight">{t(tile.labelKey as any)}</h4>
                      <p className="text-[13.5px] text-fg-muted leading-relaxed mt-1.5">{t(('tile.' + tile.descKey) as any)}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-fg-subtle group-hover:text-gold -rotate-12 group-hover:rotate-0 transition" />
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
