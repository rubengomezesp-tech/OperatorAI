/**
 * 🎓 PRODUCT TOURS
 *
 * Catálogo de tours interactivos de Operator AI.
 * Cada tour es una secuencia de steps con:
 *   - title + description
 *   - imageQuery (para mockups visuales)
 *   - tip opcional
 *   - cta para probar la feature
 *
 * Renderizados en /help/tour/[feature]
 */

import {
  MessageSquare,
  Database,
  Sparkles,
  Layers,
  Plug,
  type LucideIcon,
} from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  /** Visual representation: 'screenshot' | 'illustration' | 'animation' */
  visual?: {
    type: 'gradient' | 'icon';
    color?: string;
    iconKey?: string;
  };
  tip?: string;
}

export interface ProductTour {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: LucideIcon;
  accentColor: string;
  ctaPath: string;
  ctaLabel: string;
  steps: TourStep[];
}

export const PRODUCT_TOURS: ProductTour[] = [
  // ═══ CHAT ═══
  {
    id: 'chat',
    slug: 'chat',
    title: 'Chat con tu agente',
    subtitle: 'Aprende a darle órdenes a tu operador AI en 5 pasos.',
    duration: '2 min',
    icon: MessageSquare,
    accentColor: '#C9A863',
    ctaPath: '/chat',
    ctaLabel: 'Abrir Chat',
    steps: [
      {
        title: 'Habla en lenguaje natural',
        description:
          'No necesitas comandos especiales ni prompts complicados. Habla con tu agente como hablarías con un colega senior. "Necesito 3 ideas para el lanzamiento del lunes" o "Resume los emails de esta semana".',
        visual: { type: 'icon', iconKey: 'sparkles' },
        tip: 'Cuanto más contexto le des, mejor. Adjunta archivos arrastrándolos a la conversación.',
      },
      {
        title: 'El agente conoce tu marca',
        description:
          'Tu agente lee automáticamente tu Brand OS (voz, paleta, audiencia, pilares de contenido) en cada conversación. No necesitas repetir "somos una marca de lujo, escribe en tono editorial" en cada mensaje.',
        visual: { type: 'gradient', color: '#C9A863' },
        tip: 'Si no extrae bien tu marca, edítala en /brand-os.',
      },
      {
        title: 'El agente actúa, no solo sugiere',
        description:
          'Cuando conectas Gmail, Calendar, Drive o Slack, tu agente puede ejecutar acciones reales. "Programa una llamada con Anna el viernes a las 14:00" → crea el evento. "Envía este draft a marketing@" → envía el email (con confirmación).',
        visual: { type: 'icon', iconKey: 'plug' },
      },
      {
        title: 'Crea contenido visual sin salir',
        description:
          'Pídele imágenes, ads, videos cortos. "Genera 3 anuncios verticales para Instagram, vibe luxury, paleta dorada" — entrega 4 variantes editables. Puedes rehacer cualquier elemento.',
        visual: { type: 'icon', iconKey: 'layers' },
        tip: 'Con plan Pro tienes 150 imágenes/mes. Studio: 1500. Agency: 5000.',
      },
      {
        title: 'Cada conversación es un proyecto',
        description:
          'El historial se guarda. Vuelve a una conversación de hace 3 días para retomar el trabajo donde lo dejaste. La memoria del agente persiste — recuerda contexto entre sesiones.',
        visual: { type: 'icon', iconKey: 'database' },
      },
    ],
  },

  // ═══ KNOWLEDGE ═══
  {
    id: 'knowledge',
    slug: 'knowledge',
    title: 'Knowledge base',
    subtitle: 'Carga tus documentos y el agente los usa como contexto en cada conversación.',
    duration: '3 min',
    icon: Database,
    accentColor: '#10B981',
    ctaPath: '/knowledge',
    ctaLabel: 'Ir a Knowledge',
    steps: [
      {
        title: 'Sube tus documentos clave',
        description:
          'Brand guidelines, briefs, contratos, casos de éxito, especificaciones de producto, testimonios. Formatos soportados: PDF, DOCX, TXT, MD, CSV.',
        visual: { type: 'icon', iconKey: 'database' },
        tip: 'Empieza con tus 3-5 documentos más importantes. Más es mejor pero no necesitas subir TODO.',
      },
      {
        title: 'Auto-clasificación inteligente',
        description:
          'Cuando subes un documento, el agente lo lee y le asigna automáticamente una categoría: brand asset, product info, customer voice, legal, etc. Puedes corregirlo si quieres.',
        visual: { type: 'gradient', color: '#10B981' },
      },
      {
        title: 'Búsqueda semántica',
        description:
          'No buscas por palabras exactas. Pregunta "¿qué dice el contrato de Acme sobre exclusividad?" y el sistema encuentra el chunk relevante aunque la palabra "exclusividad" no aparezca literalmente.',
        visual: { type: 'icon', iconKey: 'sparkles' },
      },
      {
        title: 'El agente cita sus fuentes',
        description:
          'Cuando el agente responde con info de tus documentos, te muestra qué documento usó y en qué sección. Puedes hacer click para ir directo al original.',
        visual: { type: 'icon', iconKey: 'layers' },
      },
      {
        title: 'Límites por plan',
        description:
          'Starter: 10 documentos. Pro: 100. Studio: 1000+. Agency: ilimitado. Sin límite en tamaño de archivo individual (hasta 25MB).',
        tip: 'Documentos viejos los puedes archivar sin borrarlos para no contar contra el límite.',
      },
    ],
  },

  // ═══ BRAND OS ═══
  {
    id: 'brand-os',
    slug: 'brand-os',
    title: 'Brand OS',
    subtitle: 'Define una vez quién eres como marca. Todo lo demás se alinea solo.',
    duration: '2 min',
    icon: Sparkles,
    accentColor: '#A855F7',
    ctaPath: '/brand-os',
    ctaLabel: 'Configurar marca',
    steps: [
      {
        title: 'Extracción automática desde tu web',
        description:
          'Pega la URL de tu sitio. En 30 segundos extraemos: logo, paleta de colores, tipografía, tono de voz, descripción, audiencia probable, industria.',
        visual: { type: 'gradient', color: '#A855F7' },
        tip: 'Si no tienes web aún, crea la marca en modo manual.',
      },
      {
        title: 'Voz de marca',
        description:
          'Define el tono: profesional, juguetón, editorial, técnico. Añade keywords a evitar y palabras que sí debe usar. El agente aplica esto a cada copy que genere.',
        visual: { type: 'icon', iconKey: 'sparkles' },
      },
      {
        title: 'Sistema visual',
        description:
          'Colores principal/secundario/acento, fuentes display y body, estilo visual (minimal, editorial, bold, playful). Usado en todos los visuales generados.',
        visual: { type: 'icon', iconKey: 'layers' },
      },
      {
        title: 'Pilares de contenido + audiencia',
        description:
          'Los 3-5 temas core que definen tu marca. La audiencia objetivo (demografía, intereses, dolor). Esto guía qué contenido generar y para quién.',
        visual: { type: 'icon', iconKey: 'database' },
      },
      {
        title: 'Múltiples marcas en una org',
        description:
          'Si manejas varios clientes, añade una marca por cada uno. Cambia entre ellas con el switcher en el topbar. Cada marca es un universo independiente.',
        visual: { type: 'icon', iconKey: 'layers' },
        tip: 'Studio plan: 25 marcas. Agency: ilimitadas.',
      },
    ],
  },

  // ═══ CAMPAIGNS ═══
  {
    id: 'campaigns',
    slug: 'campaigns',
    title: 'Campaigns',
    subtitle: 'Genera ads, posts y creatividades en tu estilo de marca.',
    duration: '3 min',
    icon: Layers,
    accentColor: '#F59E0B',
    ctaPath: '/campaigns/new',
    ctaLabel: 'Crear campaña',
    steps: [
      {
        title: 'Desde el chat (lo más rápido)',
        description:
          'Abre /chat y escribe: "Hazme 3 ads verticales para Instagram, lanzamiento de la colección primavera, vibe luxury, paleta dorada y navy". El agente entrega 4 variantes editables.',
        visual: { type: 'icon', iconKey: 'sparkles' },
      },
      {
        title: 'Desde el wizard (más guiado)',
        description:
          'En /campaigns/new tienes un asistente paso-a-paso: vertical (fashion, SaaS, food, etc), tipo de campaña (launch, promo, brand awareness), brief, formato, generar.',
        visual: { type: 'icon', iconKey: 'layers' },
      },
      {
        title: '32 layout archetypes × 60 style DNAs',
        description:
          '1.920 combinaciones únicas. El agente elige las más adecuadas según tu marca, vertical, y tipo de campaña. Nunca verás dos creatividades iguales.',
        visual: { type: 'gradient', color: '#F59E0B' },
        tip: 'Si quieres un estilo específico, pídelo: "estilo editorial" o "estilo brutalist".',
      },
      {
        title: 'Variantes editables',
        description:
          'Cada variante puedes editarla: cambiar copy, swap layout, ajustar paleta, añadir elementos. La generación es solo el punto de partida — la edición humana es donde brilla.',
        visual: { type: 'icon', iconKey: 'sparkles' },
      },
      {
        title: 'Export en formatos pro',
        description:
          'Descarga en PNG (web/social), JPG (print), SVG (vector editable), PDF (print pro). Resoluciones para cada placement: Instagram square, story vertical, banner web, billboard, etc.',
        visual: { type: 'icon', iconKey: 'layers' },
      },
    ],
  },

  // ═══ INTEGRATIONS ═══
  {
    id: 'integrations',
    slug: 'integrations',
    title: 'Integraciones',
    subtitle: 'Conecta Gmail, Calendar, Drive, Slack — y deja que tu agente actúe.',
    duration: '2 min',
    icon: Plug,
    accentColor: '#3B82F6',
    ctaPath: '/settings/integrations',
    ctaLabel: 'Ver integraciones',
    steps: [
      {
        title: 'OAuth seguro vía Composio',
        description:
          'Las integraciones usan OAuth 2.0 estándar. Tus credenciales nunca tocan nuestros servidores — son almacenadas por Composio.dev (provider especializado en MCP). Puedes revocar acceso desde tu cuenta de Google/Slack en cualquier momento.',
        visual: { type: 'icon', iconKey: 'plug' },
      },
      {
        title: 'Gmail',
        description:
          'Tu agente puede: enviar emails (con confirmación previa), buscar inbox por sender/subject/keywords, redactar respuestas en tu voz, resumir emails no leídos.',
        visual: { type: 'gradient', color: '#3B82F6' },
        tip: 'Para acciones destructivas (envío masivo) siempre pide confirmación.',
      },
      {
        title: 'Google Calendar',
        description:
          'Crea eventos desde lenguaje natural ("Reunión con Anna viernes 14:00"), lista próximos eventos, encuentra hueco entre attendees, te brieffa antes de cada meeting con context relevante.',
        visual: { type: 'icon', iconKey: 'sparkles' },
      },
      {
        title: 'Google Drive',
        description:
          'Busca archivos por nombre o contenido, genera resúmenes de docs, extrae datos de spreadsheets. Útil para "encuentra el contrato de Acme y resume las cláusulas clave".',
      },
      {
        title: 'Slack',
        description:
          'Envía mensajes a canales, busca conversaciones, summariza threads largos. Ideal para "publica este update en #marketing" o "dame los puntos clave del thread de pricing".',
        visual: { type: 'icon', iconKey: 'plug' },
      },
      {
        title: 'Más providers próximamente',
        description:
          'Notion, Linear, GitHub, HubSpot, Salesforce, Stripe, Airtable — en roadmap. Si necesitas alguno urgente, escríbenos a hi@operatoraiapp.com.',
        tip: 'Plan Starter: 2 integraciones. Pro: 10. Studio: 50. Agency: ilimitadas.',
      },
    ],
  },
];

export function getTourBySlug(slug: string): ProductTour | undefined {
  return PRODUCT_TOURS.find((t) => t.slug === slug);
}
