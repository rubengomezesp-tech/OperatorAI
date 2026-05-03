/**
 * Home content — defaults + types
 *
 * El admin puede sobrescribir cualquier campo desde
 * app_settings.extra.home. Si no hay override, se usan estos defaults.
 */

export interface VerticalDemoMessage {
  user: { es: string; en: string };
  operatorIntro: { es: string; en: string };
  items: Array<{ es: string; en: string }>;
}

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
    demo: VerticalDemoMessage;
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
    es: '3 días gratis · Cancela cuando quieras',
    en: '3 days free · Cancel anytime',
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
      demo: {
        user: {
          es: 'Quiero lanzar mi nuevo programa de transformación de 8 semanas',
          en: 'I want to launch my new 8-week transformation program',
        },
        operatorIntro: {
          es: 'Perfecto. He preparado tu campaña fitness:',
          en: 'Perfect. I prepared your fitness campaign:',
        },
        items: [
          { es: 'Estrategia: público 25-45 con interés en bienestar', en: 'Strategy: 25-45 audience interested in wellness' },
          { es: 'Copy con foco en transformación real', en: 'Copy focused on real transformation' },
          { es: '3 anuncios diseñados para Instagram y TikTok', en: '3 ads designed for Instagram and TikTok' },
        ],
      },
    },
    {
      key: 'beauty',
      label: { es: 'Beauty', en: 'Beauty' },
      pitch: { es: 'Destaca tu marca y llena tu agenda.', en: 'Stand out and fill your calendar.' },
      demo: {
        user: {
          es: 'Lanzamos una nueva línea de skincare premium',
          en: 'We are launching a new premium skincare line',
        },
        operatorIntro: {
          es: 'Lo tengo. Tu campaña beauty está lista:',
          en: 'Got it. Your beauty campaign is ready:',
        },
        items: [
          { es: 'Estética editorial estilo Vogue', en: 'Editorial Vogue-style aesthetic' },
          { es: 'Copy enfocado en confianza y autocuidado', en: 'Copy focused on confidence and self-care' },
          { es: '3 anuncios premium para feed y stories', en: '3 premium ads for feed and stories' },
        ],
      },
    },
    {
      key: 'real-estate',
      label: { es: 'Real Estate', en: 'Real Estate' },
      pitch: { es: 'Más leads cualificados, más cierres.', en: 'More qualified leads, more closings.' },
      demo: {
        user: {
          es: 'Necesito vender 3 propiedades de lujo en la costa',
          en: 'I need to sell 3 luxury coastal properties',
        },
        operatorIntro: {
          es: 'Aquí tienes tu campaña de captación:',
          en: 'Here is your lead generation campaign:',
        },
        items: [
          { es: 'Targeting: compradores 35-60 con alto patrimonio', en: 'Targeting: 35-60 high net worth buyers' },
          { es: 'Copy que vende estilo de vida, no metros cuadrados', en: 'Copy that sells lifestyle, not square meters' },
          { es: '3 anuncios cinematográficos con vistas y detalles', en: '3 cinematic ads with views and details' },
        ],
      },
    },
    {
      key: 'restaurants',
      label: { es: 'Restaurantes', en: 'Restaurants' },
      pitch: { es: 'Más reservas, más visitas, más pedidos.', en: 'More reservations, more visits, more orders.' },
      demo: {
        user: {
          es: 'Quiero llenar el restaurante los jueves y viernes',
          en: 'I want to fill the restaurant on Thursdays and Fridays',
        },
        operatorIntro: {
          es: 'Tu campaña de reservas:',
          en: 'Your reservations campaign:',
        },
        items: [
          { es: 'Targeting local geo-segmentado', en: 'Hyper-local geo-targeting' },
          { es: 'Copy con sensorial: aromas, texturas, ambiente', en: 'Sensory copy: aromas, textures, ambiance' },
          { es: '3 anuncios apetitosos con platos hero', en: '3 mouth-watering ads with hero dishes' },
        ],
      },
    },
    {
      key: 'ecommerce',
      label: { es: 'E-commerce', en: 'E-commerce' },
      pitch: { es: 'Anuncios que venden y escalan.', en: 'Ads that sell and scale.' },
      demo: {
        user: {
          es: 'Tengo una nueva colección que necesito escalar rápido',
          en: 'I have a new collection I need to scale fast',
        },
        operatorIntro: {
          es: 'Tu campaña de conversión está lista:',
          en: 'Your conversion campaign is ready:',
        },
        items: [
          { es: 'Funnel de awareness → consideración → compra', en: 'Funnel: awareness → consideration → purchase' },
          { es: 'Copy con urgencia y prueba social', en: 'Copy with urgency and social proof' },
          { es: '3 anuncios optimizados para Meta y Google', en: '3 ads optimized for Meta and Google' },
        ],
      },
    },
    {
      key: 'jewelry',
      label: { es: 'Joyería', en: 'Jewelry' },
      pitch: { es: 'Atrae clientes de alto valor todos los días.', en: 'Attract high-value clients every day.' },
      demo: {
        user: {
          es: 'Quiero promocionar nuestra colección de anillos de compromiso',
          en: 'I want to promote our engagement ring collection',
        },
        operatorIntro: {
          es: 'Aquí tu campaña editorial:',
          en: 'Here is your editorial campaign:',
        },
        items: [
          { es: 'Estética macro detalle con luz cálida', en: 'Macro detail aesthetic with warm light' },
          { es: 'Copy emocional sobre momentos únicos', en: 'Emotional copy about unique moments' },
          { es: '3 anuncios con storytelling de pareja', en: '3 ads with couple storytelling' },
        ],
      },
    },
    {
      key: 'saas',
      label: { es: 'SaaS & Tech', en: 'SaaS & Tech' },
      pitch: { es: 'Explica tu valor, genera pruebas y demos.', en: 'Explain your value, drive trials and demos.' },
      demo: {
        user: {
          es: 'Lanzamos un dashboard de analytics para fundadores',
          en: 'We are launching an analytics dashboard for founders',
        },
        operatorIntro: {
          es: 'Tu campaña B2B:',
          en: 'Your B2B campaign:',
        },
        items: [
          { es: 'Mensajes de pain point específicos', en: 'Specific pain-point messaging' },
          { es: 'Copy con beneficios cuantificables', en: 'Copy with quantifiable benefits' },
          { es: '3 anuncios con UI screenshots y testimonials', en: '3 ads with UI screenshots and testimonials' },
        ],
      },
    },
    {
      key: 'health',
      label: { es: 'Salud & Wellness', en: 'Health & Wellness' },
      pitch: { es: 'Educa, conecta y convierte pacientes.', en: 'Educate, connect and convert patients.' },
      demo: {
        user: {
          es: 'Soy nutricionista, quiero llenar mi consulta',
          en: 'I am a nutritionist, I want to fill my practice',
        },
        operatorIntro: {
          es: 'Tu campaña de captación:',
          en: 'Your acquisition campaign:',
        },
        items: [
          { es: 'Targeting: personas buscando cambio de hábitos', en: 'Targeting: people seeking habit change' },
          { es: 'Copy con autoridad y empatía', en: 'Copy with authority and empathy' },
          { es: '3 anuncios educativos con before/after', en: '3 educational ads with before/after' },
        ],
      },
    },
    {
      key: 'travel',
      label: { es: 'Hoteles & Viajes', en: 'Hotels & Travel' },
      pitch: { es: 'Más reservas directas, más experiencias.', en: 'More direct bookings, more experiences.' },
      demo: {
        user: {
          es: 'Necesito llenar nuestro hotel boutique en temporada baja',
          en: 'I need to fill our boutique hotel in low season',
        },
        operatorIntro: {
          es: 'Tu campaña de reservas directas:',
          en: 'Your direct bookings campaign:',
        },
        items: [
          { es: 'Targeting de viajeros por experiencia', en: 'Experience-driven traveler targeting' },
          { es: 'Copy aspiracional con transporting tone', en: 'Aspirational transporting tone' },
          { es: '3 anuncios cinematográficos con destinos', en: '3 cinematic destination ads' },
        ],
      },
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
    es: 'Empieza con tu Operator hoy.',
    en: 'Start with your Operator today.',
  },
  final_subtitle: {
    es: 'Sin agencias. Sin plantillas. Sin esperas. Solo tu marca avanzando, contigo y con tu Operator.',
    en: 'No agencies. No templates. No waiting. Just your brand moving forward, with you and your Operator.',
  },
  final_cta: {
    es: 'Probar 3 días gratis ahora',
    en: 'Try 3 days free now',
  },
  final_note: {
    es: '3 días gratis · Cancela cuando quieras',
    en: '3 days free · Cancel anytime',
  },

  manifesto: {
    es: 'Hecho para los que mueven su marca todos los días.',
    en: 'Built for those who move their brand every day.',
  },
};
