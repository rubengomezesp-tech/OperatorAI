'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  Video,
  Mic,
  Palette,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  ImageIcon,
  Bot,
  Rocket,
  Settings,
  Shield,
  ChevronLeft,
  Shirt,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface NavItem {
  href: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  badge?: string;
  primary?: boolean;
}

interface NavGroup {
  id: string;
  labelKey: string;
  fallback: string;
  items: NavItem[];
}

/**
 * Primary application sidebar.
 *
 * Structure:
 *   Dashboard (top)
 *   CREATE      Creative Studio, Chat, Video, Voice
 *   LIBRARY     Brand OS, Projects, Knowledge, Files, Image Studio
 *   AUTOMATE    Assistants, Missions
 *   Settings + Admin (bottom)
 *
 * Hidden from navigation (routes remain live, see ROUTES_AUDIT.md):
 *   /studio     redundant hub
 *   /billing    duplicates /settings/billing
 *   /memory     duplicates /settings/memory
 *
 * Admin visibility: controlled by the optional `isAdmin` prop.
 * AppShell can pass it; if omitted, the Admin link is not shown.
 */
interface Props {
  isAdmin?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isAdmin = false, onClose }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();

  const groups: NavGroup[] = [
    {
      id: 'create',
      labelKey: 'nav.create',
      fallback: 'Create',
      items: [
        {
          href: '/campaigns/new',
          labelKey: 'nav.create_campaign',
          fallback: 'Create Campaign',
          icon: Sparkles,
          primary: true,
          badge: 'Beta',
        },
        {
          href: '/campaigns',
          labelKey: 'nav.my_campaigns',
          fallback: 'My Campaigns',
          icon: Sparkles,
        },

        {
          href: '/chat',
          labelKey: 'nav.creative_agent',
          fallback: 'Chat',
          icon: MessageSquare,
        },
        {
          href: '/studio/video',
          labelKey: 'nav.video_studio',
          fallback: 'Video',
          icon: Video,
        },
        {
          href: '/voice',
          labelKey: 'nav.voice_mode',
          fallback: 'Voice',
          icon: Mic,
          badge: 'Beta',
        },
        {
          href: '/ai-mockup',
          labelKey: 'nav.mockup_studio',
          fallback: 'Mockup Studio',
          icon: Shirt,
          badge: 'New',
        },
      ],
    },
    {
      id: 'library',
      labelKey: 'nav.library',
      fallback: 'Library',
      items: [
        {
          href: '/brand-os',
          labelKey: 'nav.brand_os',
          fallback: 'Brand OS',
          icon: Palette,
        },
        {
          href: '/projects',
          labelKey: 'nav.projects',
          fallback: 'Projects',
          icon: FolderOpen,
        },
        {
          href: '/knowledge',
          labelKey: 'nav.knowledge',
          fallback: 'Knowledge',
          icon: FileText,
        },
        {
          href: '/files',
          labelKey: 'nav.files',
          fallback: 'Files',
          icon: FileSpreadsheet,
        },
        {
          href: '/studio/image',
          labelKey: 'nav.image_studio',
          fallback: 'Image Studio',
          icon: ImageIcon,
        },
      ],
    },
    {
      id: 'automate',
      labelKey: 'nav.automate',
      fallback: 'Automate',
      items: [
        {
          href: '/assistants',
          labelKey: 'nav.assistants',
          fallback: 'Assistants',
          icon: Bot,
        },
        {
          href: '/missions',
          labelKey: 'nav.missions',
          fallback: 'Missions',
          icon: Rocket,
        },
      ],
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Try translation, fall back to literal if the key isn't in i18n yet.
  const tr = (key: string, fallback: string): string => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <aside className="h-full w-[240px] shrink-0 border-r border-border bg-surface flex flex-col">
      {/* Brand */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group"
          onClick={onClose}
        >
          <div className="h-7 w-7 rounded-lg gold-grad flex items-center justify-center">
            <span className="font-display text-[13px] text-bg font-bold">O</span>
          </div>
          <span className="font-display text-[14px] tracking-[0.08em] uppercase">
            Operator
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden h-7 w-7 rounded-md flex items-center justify-center text-fg-muted hover:text-fg"
            aria-label="Close navigation"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dashboard pinned top */}
      <div className="px-2 pt-3">
        <NavLink
          item={{
            href: '/dashboard',
            labelKey: 'nav.overview',
            fallback: 'Dashboard',
            icon: LayoutDashboard,
          }}
          active={isActive('/dashboard')}
          onNavigate={onClose}
          tr={tr}
        />
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-4 pb-3 space-y-5">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="px-2 mb-1.5 text-[9px] uppercase tracking-[0.16em] text-fg-subtle font-medium">
              {tr(group.labelKey, group.fallback)}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  onNavigate={onClose}
                  tr={tr}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + Admin */}
      <div className="border-t border-border p-2 space-y-0.5">
        <NavLink
          item={{
            href: '/settings',
            labelKey: 'nav.settings',
            fallback: 'Settings',
            icon: Settings,
          }}
          active={isActive('/settings')}
          onNavigate={onClose}
          tr={tr}
        />
        {isAdmin && (
          <NavLink
            item={{
              href: '/admin',
              labelKey: 'nav.admin',
              fallback: 'Admin',
              icon: Shield,
            }}
            active={isActive('/admin')}
            onNavigate={onClose}
            tr={tr}
          />
        )}
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
  tr,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  tr: (key: string, fallback: string) => string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-2.5 h-8 px-2 rounded-md',
        'text-[12.5px] transition-colors duration-150',
        active
          ? 'bg-gold/10 text-gold'
          : 'text-fg-muted hover:text-fg hover:bg-surface-2',
      )}
    >
      <Icon
        className={cn(
          'h-[14px] w-[14px] shrink-0',
          active ? 'text-gold' : 'text-fg-subtle group-hover:text-fg-muted',
        )}
      />
      <span className="flex-1 truncate">{tr(item.labelKey, item.fallback)}</span>
      {item.primary && !active && (
        <span className="h-1 w-1 rounded-full bg-gold/60" aria-hidden />
      )}
      {item.badge && (
        <span className="text-[8.5px] px-1.5 h-4 rounded bg-surface-2 border border-border text-fg-subtle uppercase tracking-[0.1em] flex items-center">
          {item.badge}
        </span>
      )}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r bg-gold"
          aria-hidden
        />
      )}
    </Link>
  );
}
