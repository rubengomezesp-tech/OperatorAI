#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "================================================================"
echo "  Operator AI v3 — Fase C"
echo "  PWA + Imagen 4 + Sidebar complete"
echo "================================================================"
echo ""

cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

# ============================================================
# 1. PWA — Progressive Web App
# ============================================================
echo ">>> Setting up PWA..."

# manifest.json
cat > public/manifest.json << 'EOFMAN'
{
  "name": "Operator AI",
  "short_name": "Operator",
  "description": "Run your brand like a studio. Chat, imagery, video, voice, and workflows — unified under one AI.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#c9a863",
  "orientation": "portrait-primary",
  "categories": ["business", "productivity"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
EOFMAN
echo "OK manifest.json"

# Generate simple PWA icons using a canvas script
mkdir -p public/icons
cat > /tmp/gen-icons.py << 'PYICONS'
import struct, zlib, io, os

def create_png(size, bg_r, bg_g, bg_b, text_r, text_g, text_b):
    """Create a simple PNG with 'O' letter centered (gold on dark)."""
    width = height = size
    pixels = []
    center_x, center_y = width // 2, height // 2
    radius = int(size * 0.35)
    inner_radius = int(size * 0.25)

    for y in range(height):
        row = []
        for x in range(width):
            dx = x - center_x
            dy = y - center_y
            dist = (dx*dx + dy*dy) ** 0.5
            if inner_radius < dist < radius:
                row.extend([text_r, text_g, text_b, 255])
            else:
                row.extend([bg_r, bg_g, bg_b, 255])
        pixels.append(bytes(row))

    def make_png(w, h, rows):
        def chunk(ctype, data):
            c = ctype + data
            return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

        sig = b'\x89PNG\r\n\x1a\n'
        ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
        raw = b''
        for row in rows:
            raw += b'\x00' + row
        idat = chunk(b'IDAT', zlib.compress(raw))
        iend = chunk(b'IEND', b'')
        return sig + ihdr + idat + iend

    return make_png(width, height, pixels)

# Gold O on dark background
for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png'), (512, 'icon-maskable.png')]:
    png = create_png(size, 10, 10, 10, 201, 168, 99)
    path = f'public/icons/{name}'
    with open(path, 'wb') as f:
        f.write(png)
    print(f'Created {path} ({len(png)} bytes)')
PYICONS
python3 /tmp/gen-icons.py
echo "OK PWA icons"

# Service worker
cat > public/sw.js << 'EOFSW'
const CACHE_NAME = 'operator-ai-v3';
const PRECACHE = ['/dashboard', '/chat', '/studio/image', '/studio/video'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
EOFSW
echo "OK service worker"

# Add PWA meta tags + SW registration to layout
python3 << 'PYPWA'
import re
path = 'src/app/layout.tsx'
src = open(path, 'r').read()

# Add manifest link if not present
if 'manifest' not in src:
    src = src.replace(
        '<meta name="viewport"',
        '<link rel="manifest" href="/manifest.json" />\n        <meta name="theme-color" content="#c9a863" />\n        <meta name="apple-mobile-web-app-capable" content="yes" />\n        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n        <link rel="apple-touch-icon" href="/icons/icon-192.png" />\n        <meta name="viewport"'
    )

# Add SW registration script before closing </body>
if 'serviceWorker' not in src:
    sw_script = """
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />"""
    src = src.replace('</body>', sw_script + '\n      </body>')

open(path, 'w').write(src)
print('layout.tsx updated with PWA meta + SW')
PYPWA
echo "OK PWA layout tags"

# ============================================================
# 2. IMAGEN 4 — Add to Image Studio
# ============================================================
echo ">>> Adding Imagen 4 models to Image Studio..."

# Create Imagen 4 client
mkdir -p src/features/image/server

cat > src/features/image/server/imagen-client.ts << 'EOFIMG'
import 'server-only';
import { serverEnv } from '@/lib/env';

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type ImagenModel =
  | 'imagen-4.0-fast-generate-001'
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-ultra-generate-001';

export interface ImagenGenerateParams {
  prompt: string;
  model?: ImagenModel;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  numberOfImages?: 1 | 2 | 4;
}

export interface ImagenResult {
  images: Array<{
    base64: string;
    mimeType: string;
  }>;
}

function getApiKey(): string {
  const key = serverEnv.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not configured');
  return key;
}

export async function generateImageImagen(params: ImagenGenerateParams): Promise<ImagenResult> {
  const model = params.model ?? 'imagen-4.0-generate-001';
  const key = getApiKey();

  const url = `${GOOGLE_API_BASE}/models/${model}:predict?key=${key}`;

  const body = {
    instances: [{ prompt: params.prompt }],
    parameters: {
      sampleCount: params.numberOfImages ?? 1,
      aspectRatio: params.aspectRatio ?? '1:1',
      personGeneration: 'allow_adult',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Imagen ${res.status}: ${text.slice(0, 300)}`);
  }

  type PredictResponse = {
    predictions?: Array<{
      bytesBase64Encoded: string;
      mimeType: string;
    }>;
  };

  const json = (await res.json()) as PredictResponse;
  const predictions = json.predictions ?? [];

  if (predictions.length === 0) {
    throw new Error('No images generated. The prompt may have been blocked by safety filters.');
  }

  return {
    images: predictions.map((p) => ({
      base64: p.bytesBase64Encoded,
      mimeType: p.mimeType || 'image/png',
    })),
  };
}

export function imagenCost(model: ImagenModel): number {
  switch (model) {
    case 'imagen-4.0-fast-generate-001': return 0.02;
    case 'imagen-4.0-generate-001': return 0.04;
    case 'imagen-4.0-ultra-generate-001': return 0.06;
    default: return 0.04;
  }
}
EOFIMG
echo "OK imagen-client.ts"

# Create Imagen 4 API route
mkdir -p src/app/api/image/imagen
cat > src/app/api/image/imagen/route.ts << 'EOFIMGAPI'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateImageImagen, imagenCost, type ImagenModel } from '@/features/image/server/imagen-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  model: z.enum([
    'imagen-4.0-fast-generate-001',
    'imagen-4.0-generate-001',
    'imagen-4.0-ultra-generate-001',
  ]).optional(),
  aspectRatio: z.enum(['1:1', '3:4', '4:3', '9:16', '16:9']).optional(),
  numberOfImages: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  // Quota check
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'image_generation' });
  const q = quota as { allowed: boolean; used: number; limit: number } | null;
  if (q && !q.allowed) {
    return NextResponse.json({
      error: 'Monthly image limit reached. Upgrade to generate more.',
      quota: q,
    }, { status: 402 });
  }

  const model = (parsed.data.model ?? 'imagen-4.0-generate-001') as ImagenModel;
  const numImages = parsed.data.numberOfImages ?? 1;

  try {
    const result = await generateImageImagen({
      prompt: parsed.data.prompt,
      model,
      aspectRatio: parsed.data.aspectRatio ?? '1:1',
      numberOfImages: numImages,
    });

    // Track usage
    await svc.from('usage_events').insert({
      org_id: orgId,
      user_id: user.id,
      kind: 'image_generation',
      quantity: numImages,
      metadata: { model, prompt: parsed.data.prompt.slice(0, 200) },
    } as never);

    // Upload to storage
    const uploaded = await Promise.all(result.images.map(async (img, i) => {
      const buf = Buffer.from(img.base64, 'base64');
      const ext = img.mimeType.includes('png') ? 'png' : 'jpg';
      const path = `${orgId}/${Date.now()}-${i}.${ext}`;
      await svc.storage.from('images').upload(path, buf, {
        contentType: img.mimeType,
        upsert: true,
      });
      const { data } = await svc.storage.from('images').createSignedUrl(path, 60 * 60 * 24);
      return data?.signedUrl ?? null;
    }));

    return NextResponse.json({
      images: uploaded.filter(Boolean),
      model,
      cost: imagenCost(model) * numImages,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Image generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
EOFIMGAPI
echo "OK /api/image/imagen"

# ============================================================
# 3. SIDEBAR — Complete with ALL modules
# ============================================================
echo ">>> Rewriting sidebar with ALL modules..."

cat > src/components/layout/sidebar.tsx << 'EOFSB'
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Video,
  Mic, Zap, FileSpreadsheet, FileText, Brain, Sparkles, Plug,
  CreditCard, Settings, ChevronDown,
  type LucideIcon,
} from 'lucide-react';

type SubItem = { href: string; label: string; icon: LucideIcon };
type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  children?: SubItem[];
};
type Section = { group: string; items: Item[] };

const nav: Section[] = [
  {
    group: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderOpen },
      { href: '/chat', label: 'Creative Agent', icon: MessageSquare, badge: 'AI' },
    ],
  },
  {
    group: 'Studio',
    items: [
      { href: '/studio/image', label: 'Image Studio', icon: ImageIcon },
      { href: '/studio/video', label: 'Video Studio', icon: Video, badge: 'NEW' },
      { href: '/voice', label: 'Voice Mode', icon: Mic },
    ],
  },
  {
    group: 'Automate',
    items: [
      { href: '/workflows', label: 'Workflows', icon: Zap },
      { href: '/files', label: 'Files & Analysis', icon: FileSpreadsheet },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { href: '/knowledge', label: 'Knowledge', icon: FileText },
    ],
  },
  {
    group: 'Manage',
    items: [
      { href: '/assistants', label: 'Assistants', icon: Sparkles },
      {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        children: [
          { href: '/settings/integrations', label: 'Integrations', icon: Plug },
          { href: '/settings/memory', label: 'Memory', icon: Brain },
          { href: '/settings/billing', label: 'Billing', icon: CreditCard },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSettings, setOpenSettings] = useState(
    pathname.startsWith('/settings'),
  );

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r border-border bg-bg">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-md gold-grad flex items-center justify-center">
            <span className="font-display text-[17px] text-bg leading-none">O</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[17px] tracking-tight">Operator</span>
            <span className="text-[10.5px] uppercase tracking-[0.2em] text-fg-muted mt-1">AI</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((section) => (
          <div key={section.group}>
            <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">
              {section.group}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isSettings = item.href === '/settings';
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    !isSettings &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;

                if (item.children) {
                  const someChildActive = item.children.some((c) =>
                    pathname.startsWith(c.href),
                  );
                  const expanded = openSettings || someChildActive;
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => setOpenSettings((v) => !v)}
                        className={cn(
                          'w-full relative flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors',
                          someChildActive
                            ? 'bg-surface-2 text-fg'
                            : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
                        )}
                      >
                        {someChildActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full gold-grad" />
                        )}
                        <Icon
                          className={cn('h-4 w-4 shrink-0', someChildActive && 'text-gold')}
                          aria-hidden
                        />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
                        />
                      </button>
                      {expanded && (
                        <ul className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                          {item.children.map((c) => {
                            const subActive = pathname === c.href || pathname.startsWith(c.href + '/');
                            const SubIcon = c.icon;
                            return (
                              <li key={c.href}>
                                <Link
                                  href={c.href}
                                  className={cn(
                                    'flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[12.5px] transition-colors',
                                    subActive
                                      ? 'text-gold bg-gold/8'
                                      : 'text-fg-muted hover:text-fg hover:bg-surface-2/40',
                                  )}
                                >
                                  <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{c.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors',
                        active
                          ? 'bg-surface-2 text-fg'
                          : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full gold-grad" />
                      )}
                      <Icon className={cn('h-4 w-4 shrink-0', active && 'text-gold')} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 h-4 text-[9.5px] tracking-[0.12em] uppercase rounded bg-gold/15 text-gold flex items-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="surface-raised p-3.5">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-gold mb-1">Plan</div>
          <div className="text-[12.5px] text-fg-muted leading-snug">Explore Operator AI.</div>
          <Link
            href="/pricing"
            className="mt-2 inline-block text-[12px] text-fg hover:text-gold transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </aside>
  );
}
EOFSB
echo "OK sidebar complete"

# ============================================================
# 4. NEXT CONFIG — PWA headers
# ============================================================
echo ">>> Updating next.config for PWA..."
python3 << 'PYNEXT'
path = 'next.config.mjs'
try:
    src = open(path, 'r').read()
except:
    path = 'next.config.js'
    src = open(path, 'r').read()

if 'sw.js' not in src and 'headers' not in src:
    # Add headers config for service worker scope
    src = src.replace(
        'const nextConfig = {',
        """const nextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },"""
    )
    open(path, 'w').write(src)
    print(f'{path} updated with PWA headers')
PYNEXT
echo "OK next.config"

# ============================================================
# TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "================================================================"
echo "  Operator AI v3 — Fase C bootstrap complete."
echo "================================================================"
echo ""
echo "WHAT YOU GOT:"
echo "  ✓ PWA: manifest.json + service worker + icons + meta tags"
echo "    → Installable on iPhone/Android (Add to Home Screen)"
echo "  ✓ Imagen 4: 3 models (Fast $0.02, Standard $0.04, Ultra $0.06)"
echo "    → /api/image/imagen endpoint ready"
echo "    → Uses your existing GOOGLE_API_KEY"
echo "  ✓ Sidebar: complete with ALL 12 modules"
echo "    → Workspace: Overview, Projects, Creative Agent"
echo "    → Studio: Image, Video (NEW badge), Voice"
echo "    → Automate: Workflows, Files & Analysis"
echo "    → Intelligence: Knowledge"
echo "    → Manage: Assistants, Settings (Integrations/Memory/Billing)"
echo ""
echo "NEXT STEPS:"
echo ""
echo "  1. PUSH:"
echo "     git add -A"
echo "     git commit -m 'feat: v3C - PWA + Imagen 4 + sidebar complete'"
echo "     git push"
echo ""
echo "  2. TEST PWA (after Vercel deploy):"
echo "     - Open https://operator-ai-delta.vercel.app on iPhone Safari"
echo "     - Tap Share button (box with arrow)"
echo "     - Tap 'Add to Home Screen'"
echo "     - Now you have Operator AI as an app icon!"
echo ""
echo "  3. TEST IMAGEN 4 (via API or integrate into Image Studio UI):"
echo "     The /api/image/imagen endpoint is ready."
echo "     Next bootstrap can wire it into the Image Studio UI"
echo "     with a model selector (Flux 2 Pro vs Imagen 4)."
echo ""
