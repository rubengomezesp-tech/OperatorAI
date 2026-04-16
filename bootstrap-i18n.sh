#!/usr/bin/env bash
set -euo pipefail

echo ">>> Adding ES/EN language toggle..."
cd "$(dirname "$0")"

# ============================================================
# 1. Translations + Context
# ============================================================
mkdir -p src/lib

cat > src/lib/i18n.tsx << 'EOFI18N'
'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'es';

const translations = {
  // Sidebar groups
  'nav.workspace': { en: 'Workspace', es: 'Espacio' },
  'nav.studio': { en: 'Studio', es: 'Estudio' },
  'nav.automate': { en: 'Automate', es: 'Automatizar' },
  'nav.intelligence': { en: 'Intelligence', es: 'Inteligencia' },
  'nav.manage': { en: 'Manage', es: 'Gestión' },

  // Sidebar items
  'nav.overview': { en: 'Overview', es: 'Inicio' },
  'nav.projects': { en: 'Projects', es: 'Proyectos' },
  'nav.creative_agent': { en: 'Creative Agent', es: 'Agente Creativo' },
  'nav.image_studio': { en: 'Image Studio', es: 'Estudio de Imagen' },
  'nav.video_studio': { en: 'Video Studio', es: 'Estudio de Video' },
  'nav.voice_mode': { en: 'Voice Mode', es: 'Modo Voz' },
  'nav.workflows': { en: 'Workflows', es: 'Flujos de Trabajo' },
  'nav.files': { en: 'Files & Analysis', es: 'Archivos y Análisis' },
  'nav.knowledge': { en: 'Knowledge', es: 'Conocimiento' },
  'nav.assistants': { en: 'Assistants', es: 'Asistentes' },
  'nav.settings': { en: 'Settings', es: 'Ajustes' },
  'nav.integrations': { en: 'Integrations', es: 'Integraciones' },
  'nav.memory': { en: 'Memory', es: 'Memoria' },
  'nav.billing': { en: 'Billing', es: 'Facturación' },

  // Dashboard
  'dash.title': { en: 'Operator Studio', es: 'Operator Studio' },
  'dash.headline': { en: 'Run your brand like a', es: 'Gestiona tu marca como un' },
  'dash.headline_accent': { en: 'studio', es: 'estudio' },
  'dash.subtitle': { en: 'Chat, imagery, video, voice, workflows, and data analysis — unified under one AI that knows your brand.', es: 'Chat, imágenes, video, voz, automatizaciones y análisis de datos — todo bajo una IA que conoce tu marca.' },
  'dash.modules': { en: 'Modules', es: 'Módulos' },
  'dash.tools': { en: 'tools', es: 'herramientas' },

  // Dashboard tile descriptions
  'tile.creative_agent': { en: 'Chat, imagery, campaigns, and research.', es: 'Chat, imágenes, campañas e investigación.' },
  'tile.image_studio': { en: 'Editorial-grade imagery with Flux 2 Pro.', es: 'Imágenes profesionales con Flux 2 Pro.' },
  'tile.video_studio': { en: 'Cinematic AI video powered by Veo 3.1.', es: 'Video cinematográfico con Veo 3.1.' },
  'tile.voice_mode': { en: 'Talk to your AI. Push-to-talk with memory.', es: 'Habla con tu IA. Push-to-talk con memoria.' },
  'tile.workflows': { en: 'Multi-step automations powered by AI.', es: 'Automatizaciones multi-paso con IA.' },
  'tile.files': { en: 'Upload CSV, Excel, JSON — get AI insights.', es: 'Sube CSV, Excel, JSON — obtén insights con IA.' },
  'tile.projects': { en: 'Workspaces per brand or client.', es: 'Espacios de trabajo por marca o cliente.' },
  'tile.knowledge': { en: 'Your business docs, searchable.', es: 'Tus documentos de negocio, buscables.' },
  'tile.memory': { en: 'What Operator knows about you.', es: 'Lo que Operator sabe de ti.' },
  'tile.integrations': { en: 'Gmail, Calendar, Notion, Slack and more.', es: 'Gmail, Calendar, Notion, Slack y más.' },
  'tile.campaigns': { en: 'Multi-tone launch kits.', es: 'Kits de lanzamiento multi-tono.' },
  'tile.copywriter': { en: 'Taglines, emails, stories.', es: 'Eslóganes, emails, historias.' },

  // Common
  'plan': { en: 'Plan', es: 'Plan' },
  'upgrade': { en: 'Upgrade', es: 'Mejorar plan' },
  'explore': { en: 'Explore Operator AI.', es: 'Explora Operator AI.' },
  'generate_video': { en: 'Generate video', es: 'Generar video' },
  'your_videos': { en: 'Your videos', es: 'Tus videos' },
  'no_videos': { en: 'No videos yet. Generate your first.', es: 'Sin videos aún. Genera el primero.' },
  'new_project': { en: 'New project', es: 'Nuevo proyecto' },
  'no_projects': { en: 'No projects yet', es: 'Sin proyectos aún' },
  'upload_file': { en: 'Upload file', es: 'Subir archivo' },
  'no_files': { en: 'No files yet', es: 'Sin archivos aún' },
  'from_template': { en: 'From template', es: 'Desde plantilla' },
  'no_workflows': { en: 'No workflows yet', es: 'Sin flujos aún' },
  'settings.title': { en: 'Settings', es: 'Ajustes' },
  'settings.subtitle': { en: 'Manage your workspace, integrations, and account.', es: 'Gestiona tu espacio, integraciones y cuenta.' },
  'settings.integrations_desc': { en: 'Connect Gmail, Calendar, Notion, Slack, Drive and more.', es: 'Conecta Gmail, Calendar, Notion, Slack, Drive y más.' },
  'settings.memory_desc': { en: 'What Operator knows about you. Your voice fingerprint.', es: 'Lo que Operator sabe de ti. Tu huella de voz.' },
  'settings.billing_desc': { en: 'Plan, invoices, payment method.', es: 'Plan, facturas, método de pago.' },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('operator.locale') as Locale | null;
    if (saved === 'es' || saved === 'en') setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('operator.locale', l);
  }

  function t(key: TranslationKey): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[locale] ?? entry.en ?? key;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
      className="h-8 px-2.5 rounded-md border border-border bg-surface-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted hover:text-gold hover:border-gold/40 transition-colors flex items-center gap-1.5"
      title={locale === 'en' ? 'Cambiar a español' : 'Switch to English'}
    >
      {locale === 'en' ? '🇪🇸 ES' : '🇬🇧 EN'}
    </button>
  );
}
EOFI18N
echo "OK i18n.tsx"

# ============================================================
# 2. Wrap app in I18nProvider
# ============================================================
echo ">>> Wrapping app in I18nProvider..."

python3 << 'PYPROV'
path = 'src/app/layout.tsx'
src = open(path, 'r').read()

# Add import
if "I18nProvider" not in src:
    src = src.replace(
        "import { Toaster } from 'sonner';",
        "import { Toaster } from 'sonner';\nimport { I18nProvider } from '@/lib/i18n';"
    )
    # If no Toaster import, try another anchor
    if "I18nProvider" not in src:
        # Add at top of imports
        first_import = src.index("import ")
        src = src[:first_import] + "import { I18nProvider } from '@/lib/i18n';\n" + src[first_import:]

# Wrap children in I18nProvider (find the body content)
if "<I18nProvider>" not in src:
    # Try wrapping {children}
    src = src.replace(
        "{children}",
        "<I18nProvider>{children}</I18nProvider>",
        1
    )

open(path, 'w').write(src)
print("layout.tsx wrapped with I18nProvider")
PYPROV
echo "OK layout wrapped"

# ============================================================
# 3. Add LanguageToggle to topbar/header
# ============================================================
echo ">>> Adding language toggle to header..."

# Find the topbar/header component
TOPBAR=$(find src -name "topbar*" -o -name "header*" -o -name "top-bar*" | head -1)
if [ -z "$TOPBAR" ]; then
  # Check for app-header or breadcrumb-bar
  TOPBAR=$(find src/components -name "*.tsx" | xargs grep -l "breadcrumb\|Breadcrumb\|topbar\|TopBar" 2>/dev/null | head -1 || echo "")
fi

if [ -n "$TOPBAR" ]; then
  python3 << PYTOP
path = "$TOPBAR"
src = open(path, 'r').read()
if "LanguageToggle" not in src:
    src = "import { LanguageToggle } from '@/lib/i18n';\n" + src
    # Try to add before the avatar/user section
    if "RU" in src or "avatar" in src.lower() or "user" in src.lower():
        src = src.replace("</nav>", "<LanguageToggle />\n</nav>", 1)
    else:
        # Add before closing of the header flex
        src = src.replace("</header>", "<LanguageToggle />\n</header>", 1)
    open(path, 'w').write(src)
    print(f"Added LanguageToggle to {path}")
PYTOP
else
  echo "No topbar found — will add toggle to sidebar instead"
  python3 << 'PYSBTOG'
path = 'src/components/layout/sidebar.tsx'
src = open(path, 'r').read()
if "LanguageToggle" not in src:
    src = src.replace(
        "import { cn } from '@/lib/utils';",
        "import { cn } from '@/lib/utils';\nimport { LanguageToggle } from '@/lib/i18n';"
    )
    # Add toggle above the plan footer
    src = src.replace(
        '<div className="p-4 border-t border-border">',
        '<div className="px-3 pb-2"><LanguageToggle /></div>\n      <div className="p-4 border-t border-border">'
    )
    open(path, 'w').write(src)
    print("Added LanguageToggle to sidebar")
PYSBTOG
fi
echo "OK language toggle"

# ============================================================
# TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -10

echo ""
echo "================================================================"
echo "  Language toggle (ES/EN) added!"
echo "================================================================"
echo ""
echo "Push:"
echo "  git add -A"
echo "  git commit -m 'feat: ES/EN language toggle'"
echo "  git push"
echo ""
