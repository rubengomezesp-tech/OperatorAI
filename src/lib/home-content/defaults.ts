/**
 * Home content — defaults + types
 *
 * El admin puede sobrescribir cualquier campo desde
 * app_settings.extra.home. Si no hay override, se usan estos defaults.
 */

export interface HomeContent {
  // Hero
  badge: { es: string; en: string };
  hero_title: { es: string; en: string };
  hero_title_accent: { es: string; en: string };
  hero_subtitle: { es: string; en: string };
  cta_primary: { es: string; en: string };
  cta_secondary: { es: string; en: string };
  trial_badge: { es: string; en: string };

  // How it works
  how_kicker: { es: string; en: string };
  how_title: { es: string; en: string };
  how_subtitle: { es: string; en: string };
  steps: Array<{
    number: number;
    title: { es: string; en: string };
    desc: { es: string; en: string };
    timing: { es: string; en: string };
  }>;

  // Verticals
  verticals_kicker: { es: string; en: string };
  verticals_title: { es: string; en: string };
  verticals_subtitle: { es: string; en: string };
  verticals: Array<{
    key: string;
    label: { es: string; en: string };
    pitch: { es: string; en: string };
  }>;

  // Capabilities (lo que Operator hace)
  capabilities_kicker: { es: string; en: string };
  capabilities_title: { es: string; en: string };
  capabilities_subtitle: { es: string; en: string };
  capabilities: Array<{
    icon: 'sparkles' | 'target' | 'palette' | 'video' | 'brain' | 'zap';
    title: { es: string; en: string };
    desc: { es: string; en: string };
  }>;

  // CTA final
  final_kicker: { es: string; en: string };
  final_title: { es: string; en: string };
  final_subtitle: { es: string; en: string };
  final_cta: { es: string; en: string };
  final_note: { es: string; en: string };

  // Manifesto / positioning
  manifesto: { es: string; en: string };
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  badge: {
    es: 'Nuevo · AI Operator para creadores y negocios',
    en: 'New · AI Operator for creators and businesses',
  },
  hero_title: {
    es: 'Tu director de marketing.',
    en: 'Your marketing director.',
  },
  hero_title_accent: {
    es: 'En tu bolsillo.',
    en: 'In your pocket.',
  },
  hero_subtitle: {
    es: 'Operator no genera anuncios. Dirige tu negocio como un socio. Estrategia, ideas, diseño y ejecución — en una sola conversación.',
    en: 'Operator does not generate ads. It directs your business like a partner. Strategy, ideas, design and execution — in one conversation.',
  },
  cta_primary: {
    es: 'Probar 3 días gratis',
    en: 'Try free for 3 days',
  },
  cta_secondary: {
    es: 'Ver Operator en acción',
    en: 'See Operator in action',
  },
  trial_badge: {
    es: '3 días gratis · Sin tarjeta · Cancela cuando quieras',
    en: '3 days free · No card · Cancel anytime',
  },

  how_kicker: {
    es: 'CÓMO FUNCIONA',
    en: 'HOW IT WORKS',
  },
  how_title: {
    es: 'Habla. Operator hace el resto.',
    en: 'Talk. Operator does the rest.',
  },
  how_subtitle: {
    es: 'Sin briefs eternos. Sin plantillas. Sin agencia que tarde semanas.',
    en: 'No endless briefs. No templates. No agency that takes weeks.',
  },
  steps: [
    {
      number: 1,
      title: { es: 'Habla normal', en: 'Talk normally' },
      desc: {
        es: 'Cuéntale tu idea, sube referencias, pregunta. Como hablar con tu CMO.',
        en: 'Tell it your idea, upload references, ask. Like talking to your CMO.',
      },
      timing: { es: 'En segundos', en: 'In seconds' },
    },
    {
      number: 2,
      title: { es: 'Operator dirige', en: 'Operator directs' },
      desc: {
        es: 'Investiga, piensa la estrategia, escribe el copy, diseña los anuncios. Todo personalizado a tu marca.',
        en: 'Researches, plans the strategy, writes the copy, designs the ads. All personalized to your brand.',
      },
      timing: { es: '2-3 minutos', en: '2-3 minutes' },
    },
    {
      number: 3,
      title: { es: 'Edita, aprueba, lanza', en: 'Edit, approve, launch' },
      desc: {
        es: 'Revisa lo que ha creado, ajusta lo que quieras y publica donde necesites.',
        en: 'Review what it created, adjust what you want and publish where you need.',
      },
      timing: { es: 'En minutos', en: 'In minutes' },
    },
  ],

  verticals_kicker: {
    es: 'PARA CUALQUIER NEGOCIO',
    en: 'FOR ANY BUSINESS',
  },
  verticals_title: {
    es: 'Lenguaje propio para cada industria.',
    en: 'A unique language for every industry.',
  },
  verticals_subtitle: {
    es: 'Operator no usa plantillas genéricas. Entiende tu vertical y crea con códigos visuales reales del sector.',
    en: 'Operator does not use generic templates. It understands your vertical and creates with real visual codes from your industry.',
  },
  verticals: [
    {
      key: 'fitness',
      label: { es: 'Fitness', en: 'Fitness' },
      pitch: { es: 'Más inscritos, más retención, más ventas.', en: 'More signups, more retention, more sales.' },
    },
    {
      key: 'beauty',
      label: { es: 'Beauty', en: 'Beauty' },
      pitch: { es: 'Destaca tu marca y llena tu agenda.', en: 'Stand out and fill your calendar.' },
    },
    {
      key: 'real-estate',
      label: { es: 'Real Estate', en: 'Real Estate' },
      pitch: { es: 'Más leads cualificados, más cierres.', en: 'More qualified leads, more closings.' },
    },
    {
      key: 'restaurants',
      label: { es: 'Restaurantes', en: 'Restaurants' },
      pitch: { es: 'Más reservas, más visitas, más pedidos.', en: 'More reservations, more visits, more orders.' },
    },
    {
      key: 'ecommerce',
      label: { es: 'E-commerce', en: 'E-commerce' },
      pitch: { es: 'Anuncios que venden y escalan.', en: 'Ads that sell and scale.' },
    },
    {
      key: 'jewelry',
      label: { es: 'Joyería', en: 'Jewelry' },
      pitch: { es: 'Atrae clientes de alto valor todos los días.', en: 'Attract high-value clients every day.' },
    },
    {
      key: 'saas',
      label: { es: 'SaaS & Tech', en: 'SaaS & Tech' },
      pitch: { es: 'Explica tu valor, genera pruebas y demos.', en: 'Explain your value, drive trials and demos.' },
    },
    {
      key: 'health',
      label: { es: 'Salud & Wellness', en: 'Health & Wellness' },
      pitch: { es: 'Educa, conecta y convierte pacientes.', en: 'Educate, connect and convert patients.' },
    },
    {
      key: 'travel',
      label: { es: 'Hoteles & Viajes', en: 'Hotels & Travel' },
      pitch: { es: 'Más reservas directas, más experiencias.', en: 'More direct bookings, more experiences.' },
    },
  ],

  capabilities_kicker: {
    es: 'POR QUÉ OPERATOR',
    en: 'WHY OPERATOR',
  },
  capabilities_title: {
    es: 'Tu equipo de marketing. Sin pagar un equipo.',
    en: 'Your marketing team. Without paying a team.',
  },
  capabilities_subtitle: {
    es: 'Operator combina estrategia, creatividad, datos y memoria de marca para que consigas resultados de verdad.',
    en: 'Operator combines strategy, creativity, data and brand memory so you get real results.',
  },
  capabilities: [
    {
      icon: 'target',
      title: { es: 'Estrategia en minutos', en: 'Strategy in minutes' },
      desc: {
        es: 'Operator analiza tu objetivo y crea la estrategia completa: público, ángulo, plan de acción.',
        en: 'Operator analyzes your goal and creates a full strategy: audience, angle, action plan.',
      },
    },
    {
      icon: 'sparkles',
      title: { es: 'Anuncios listos para publicar', en: 'Ads ready to publish' },
      desc: {
        es: 'Creatividades profesionales que llaman la atención y venden. Optimizadas por plataforma.',
        en: 'Professional creatives that grab attention and sell. Optimized per platform.',
      },
    },
    {
      icon: 'video',
      title: { es: 'Video y contenido', en: 'Video and content' },
      desc: {
        es: 'Hooks, guiones y contenido para tus redes. Operator entiende lo que hace que un video pare el scroll.',
        en: 'Hooks, scripts and social content. Operator gets what makes a video stop the scroll.',
      },
    },
    {
      icon: 'palette',
      title: { es: 'Tu marca, siempre consistente', en: 'Your brand, always consistent' },
      desc: {
        es: 'Brand OS asegura que todo lo que creamos sigue tus reglas, colores y tono.',
        en: 'Brand OS ensures everything we create follows your rules, colors and tone.',
      },
    },
    {
      icon: 'brain',
      title: { es: 'Memoria viva', en: 'Living memory' },
      desc: {
        es: 'Operator recuerda tu negocio, tu audiencia y lo que ha funcionado. Cada conversación lo hace más tuyo.',
        en: 'Operator remembers your business, your audience and what worked. Each chat makes it more yours.',
      },
    },
    {
      icon: 'zap',
      title: { es: 'Más rápido. Más resultados.', en: 'Faster. More results.' },
      desc: {
        es: 'De idea a campaña publicable en minutos, no en semanas. Sin plantillas. Sin esperas.',
        en: 'From idea to publishable campaign in minutes, not weeks. No templates. No waiting.',
      },
    },
  ],

  final_kicker: {
    es: 'EMPIEZA HOY',
    en: 'START TODAY',
  },
  final_title: {
    es: '¿Listo para crear contigo mismo?',
    en: 'Ready to create with yourself?',
  },
  final_subtitle: {
    es: 'Operator es la primera vez que tu marketing avanza solo. Sin agencias. Sin plantillas. Sin esperas.',
    en: 'Operator is the first time your marketing moves on its own. No agencies. No templates. No waiting.',
  },
  final_cta: {
    es: 'Probar 3 días gratis ahora',
    en: 'Try 3 days free now',
  },
  final_note: {
    es: '3 días gratis · Sin tarjeta · Cancela cuando quieras',
    en: '3 days free · No card · Cancel anytime',
  },

  manifesto: {
    es: 'Hecho para los que mueven su marca todos los días.',
    en: 'Built for those who move their brand every day.',
  },
};
