import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/card';
import {
  MessageSquare, ImageIcon, Video, Mic, Zap, FileSpreadsheet,
  FolderOpen, Brain, Plug, Megaphone, Type, Search, ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';

type Tile = { href: string; label: string; icon: LucideIcon; desc: string; accent?: boolean };

const tiles: Tile[] = [
  { href: '/chat', label: 'Creative Agent', icon: MessageSquare, desc: 'Chat, imagery, campaigns, and research.', accent: true },
  { href: '/studio/image', label: 'Image Studio', icon: ImageIcon, desc: 'Editorial-grade imagery with Flux 2 Pro.' },
  { href: '/studio/video', label: 'Video Studio', icon: Video, desc: 'Cinematic AI video powered by Veo 3.1.', accent: true },
  { href: '/voice', label: 'Voice Mode', icon: Mic, desc: 'Talk to your AI. Push-to-talk with memory.' },
  { href: '/workflows', label: 'Workflows', icon: Zap, desc: 'Multi-step automations powered by AI.' },
  { href: '/files', label: 'Files & Analysis', icon: FileSpreadsheet, desc: 'Upload CSV, Excel, JSON — get AI insights.' },
  { href: '/projects', label: 'Projects', icon: FolderOpen, desc: 'Workspaces per brand or client.' },
  { href: '/knowledge', label: 'Knowledge', icon: Search, desc: 'Your business docs, searchable.' },
  { href: '/settings/memory', label: 'Memory', icon: Brain, desc: 'What Operator knows about you.' },
  { href: '/settings/integrations', label: 'Integrations', icon: Plug, desc: 'Gmail, Calendar, Notion, Slack and more.' },
  { href: '/studio/campaign', label: 'Campaigns', icon: Megaphone, desc: 'Multi-tone launch kits.' },
  { href: '/studio/copy', label: 'Copywriter', icon: Type, desc: 'Taglines, emails, stories.' },
];

export default function DashboardPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] w-full mx-auto space-y-10">
      <section className="relative overflow-hidden surface-raised p-8 lg:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full gold-grad opacity-[0.08] blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Operator Studio</div>
          <h2 className="font-display text-[40px] lg:text-[52px] leading-[1.05]">
            Run your brand like a <span className="text-gold-grad">studio</span>.
          </h2>
          <p className="text-[15px] text-fg-muted mt-4 max-w-xl">
            Chat, imagery, video, voice, workflows, and data analysis — unified under one AI that knows your brand.
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h3 className="font-display text-[20px]">Modules</h3>
          <span className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
            {String(tiles.length).padStart(2, '0')} tools
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} className="group">
                <Card className="h-full transition-all group-hover:border-gold/50 group-hover:-translate-y-0.5">
                  <CardBody className="flex gap-5">
                    <div className={'h-12 w-12 rounded-md shrink-0 flex items-center justify-center border border-border ' + (t.accent ? 'text-bg gold-grad' : 'text-gold')}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[16px] font-medium tracking-tight">{t.label}</h4>
                      <p className="text-[13.5px] text-fg-muted leading-relaxed mt-1.5">{t.desc}</p>
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
