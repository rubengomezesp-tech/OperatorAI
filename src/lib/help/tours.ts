/**
 * 🎓 PRODUCT TOURS — data only (no React components)
 * Icons resolved client-side via TOUR_ICONS map (string key).
 */

export interface TourStep {
  title: string;
  description: string;
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
  iconKey: string;
  accentColor: string;
  ctaPath: string;
  ctaLabel: string;
  steps: TourStep[];
}

export const PRODUCT_TOURS: ProductTour[] = [
  {
    id: 'chat',
    slug: 'chat',
    title: 'Chat con tu agente',
    subtitle: 'Aprende a darle órdenes a tu operador AI en 5 pasos.',
    duration: '2 min',
    iconKey: 'message-square',
    accentColor: '#C9A863',
    ctaPath: '/chat',
    ctaLabel: 'Abrir Chat',
    steps: [
      { title: 'Habla en lenguaje natural', description: 'No necesitas comandos especiales. Habla con tu agente como hablarías con un colega senior. "Necesito 3 ideas para el lanzamiento del lunes" o "Resume los emails de esta semana".', visual: { type: 'icon', iconKey: 'sparkles' }, tip: 'Cuanto más contexto le des, mejor. Adjunta archivos arrastrándolos a la conversación.' },
      { title: 'El agente conoce tu marca', description: 'Tu agente lee automáticamente tu Brand OS (voz, paleta, audiencia, pilares de contenido) en cada conversación. No necesitas repetir el contexto en cada mensaje.', visual: { type: 'gradient', color: '#C9A863' }, tip: 'Si no extrae bien tu marca, edítala en /brand-os.' },
      { title: 'El agente actúa, no solo sugiere', description: 'Cuando conectas Gmail, Calendar, Drive o Slack, tu agente puede ejecutar acciones reales. "Programa una llamada con Anna el viernes a las 14:00" → crea el evento. "Envía este draft a marketing@" → envía el email (con confirmación).', visual: { type: 'icon', iconKey: 'plug' } },
      { title: 'Crea contenido visual sin salir', description: 'Pídele imágenes, ads, videos cortos. "Genera 3 anuncios verticales para Instagram, vibe luxury, paleta dorada" — entrega 4 variantes editables.', visual: { type: 'icon', iconKey: 'layers' }, tip: 'Pro: 150 imágenes/mes. Studio: 1500. Agency: 5000.' },
      { title: 'Cada conversación es un proyecto', description: 'El historial se guarda. Vuelve a una conversación de hace 3 días para retomar el trabajo. La memoria del agente persiste — recuerda contexto entre sesiones.', visual: { type: 'icon', iconKey: 'database' } },
    ],
  },
  {
    id: 'knowledge',
    slug: 'knowledge',
    title: 'Knowledge base',
    subtitle: 'Carga tus documentos y el agente los usa como contexto.',
    duration: '3 min',
    iconKey: 'database',
    accentColor: '#10B981',
    ctaPath: '/knowledge',
    ctaLabel: 'Ir a Knowledge',
    steps: [
      { title: 'Sube tus documentos clave', description: 'Brand guidelines, briefs, contratos, casos de éxito, especificaciones de producto, testimonios. Formatos: PDF, DOCX, TXT, MD, CSV.', visual: { type: 'icon', iconKey: 'database' }, tip: 'Empieza con tus 3-5 documentos más importantes.' },
      { title: 'Auto-clasificación inteligente', description: 'El agente lee cada documento y le asigna categoría: brand asset, product info, customer voice, legal, etc. Editable.', visual: { type: 'gradient', color: '#10B981' } },
      { title: 'Búsqueda semántica', description: 'No buscas por palabras exactas. Pregunta "¿qué dice el contrato de Acme sobre exclusividad?" y encuentra el chunk relevante aunque la palabra no aparezca.', visual: { type: 'icon', iconKey: 'sparkles' } },
      { title: 'El agente cita sus fuentes', description: 'Cuando responde con info de tus documentos, te muestra qué documento usó. Click para ir directo al original.', visual: { type: 'icon', iconKey: 'layers' } },
      { title: 'Límites por plan', description: 'Starter: 10 docs. Pro: 100. Studio: 1000+. Agency: ilimitado.', tip: 'Documentos viejos los puedes archivar sin borrarlos.' },
    ],
  },
  {
    id: 'brand-os',
    slug: 'brand-os',
    title: 'Brand OS',
    subtitle: 'Define una vez quién eres como marca. Todo se alinea solo.',
    duration: '2 min',
    iconKey: 'sparkles',
    accentColor: '#A855F7',
    ctaPath: '/brand-os',
    ctaLabel: 'Configurar marca',
    steps: [
      { title: 'Extracción automática desde tu web', description: 'Pega la URL de tu sitio. En 30 segundos extraemos: logo, paleta, tipografía, tono de voz, descripción, audiencia, industria.', visual: { type: 'gradient', color: '#A855F7' }, tip: 'Si no tienes web, modo manual disponible.' },
      { title: 'Voz de marca', description: 'Define el tono: profesional, juguetón, editorial, técnico. Keywords a evitar y palabras a usar. El agente aplica esto a cada copy.', visual: { type: 'icon', iconKey: 'sparkles' } },
      { title: 'Sistema visual', description: 'Colores principal/secundario/acento, fuentes display y body, estilo visual (minimal, editorial, bold, playful).', visual: { type: 'icon', iconKey: 'layers' } },
      { title: 'Pilares de contenido + audiencia', description: 'Los 3-5 temas core de tu marca. La audiencia objetivo. Esto guía qué contenido generar.', visual: { type: 'icon', iconKey: 'database' } },
      { title: 'Múltiples marcas en una org', description: 'Si manejas varios clientes, añade una marca por cada uno. Cambia desde el switcher en topbar.', visual: { type: 'icon', iconKey: 'layers' }, tip: 'Studio: 25 marcas. Agency: ilimitadas.' },
    ],
  },
  {
    id: 'campaigns',
    slug: 'campaigns',
    title: 'Campaigns',
    subtitle: 'Genera ads, posts y creatividades en tu estilo.',
    duration: '3 min',
    iconKey: 'layers',
    accentColor: '#F59E0B',
    ctaPath: '/campaigns/new',
    ctaLabel: 'Crear campaña',
    steps: [
      { title: 'Desde el chat (lo más rápido)', description: 'Abre /chat: "Hazme 3 ads verticales para Instagram, lanzamiento de la colección primavera, vibe luxury, paleta dorada y navy". Entrega 4 variantes editables.', visual: { type: 'icon', iconKey: 'sparkles' } },
      { title: 'Desde el wizard (más guiado)', description: 'En /campaigns/new tienes asistente paso-a-paso: vertical, tipo de campaña, brief, formato, generar.', visual: { type: 'icon', iconKey: 'layers' } },
      { title: '32 layouts × 60 style DNAs', description: '1.920 combinaciones únicas. El agente elige las adecuadas según marca, vertical, y tipo de campaña.', visual: { type: 'gradient', color: '#F59E0B' }, tip: 'Pídele estilos específicos: "editorial", "brutalist".' },
      { title: 'Variantes editables', description: 'Cada variante editable: cambiar copy, swap layout, ajustar paleta. La generación es solo el punto de partida.', visual: { type: 'icon', iconKey: 'sparkles' } },
      { title: 'Export en formatos pro', description: 'PNG, JPG, SVG, PDF. Resoluciones para cada placement: Instagram square, story vertical, banner web, billboard.', visual: { type: 'icon', iconKey: 'layers' } },
    ],
  },
  {
    id: 'integrations',
    slug: 'integrations',
    title: 'Integraciones',
    subtitle: 'Conecta Gmail, Calendar, Drive, Slack — y deja que tu agente actúe.',
    duration: '2 min',
    iconKey: 'plug',
    accentColor: '#3B82F6',
    ctaPath: '/settings/integrations',
    ctaLabel: 'Ver integraciones',
    steps: [
      { title: 'OAuth seguro vía Composio', description: 'OAuth 2.0 estándar. Tus credenciales nunca tocan nuestros servidores. Revoca acceso desde tu cuenta Google/Slack.', visual: { type: 'icon', iconKey: 'plug' } },
      { title: 'Gmail', description: 'Enviar emails (con confirmación), buscar inbox, redactar respuestas en tu voz, resumir emails no leídos.', visual: { type: 'gradient', color: '#3B82F6' }, tip: 'Para acciones destructivas siempre pide confirmación.' },
      { title: 'Google Calendar', description: 'Crea eventos desde lenguaje natural, lista próximos, encuentra hueco entre attendees.', visual: { type: 'icon', iconKey: 'sparkles' } },
      { title: 'Google Drive', description: 'Busca archivos por nombre o contenido, genera resúmenes, extrae datos de spreadsheets.' },
      { title: 'Slack', description: 'Envía mensajes a canales, busca conversaciones, summariza threads largos.', visual: { type: 'icon', iconKey: 'plug' } },
      { title: 'Más providers próximamente', description: 'Notion, Linear, GitHub, HubSpot, Salesforce, Stripe, Airtable. Pídelos a hi@operatoraiapp.com.', tip: 'Starter: 2. Pro: 10. Studio: 50. Agency: ilimitadas.' },
    ],
  },
];

export function getTourBySlug(slug: string): ProductTour | undefined {
  return PRODUCT_TOURS.find((t) => t.slug === slug);
}
