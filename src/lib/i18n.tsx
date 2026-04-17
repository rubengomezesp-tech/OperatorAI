'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'es';

const translations: Record<string, { en: string; es: string }> = {
  'nav.workspace': { en: 'Workspace', es: 'Espacio' },
  'nav.studio': { en: 'Studio', es: 'Estudio' },
  'nav.automate': { en: 'Automate', es: 'Automatizar' },
  'nav.intelligence': { en: 'Intelligence', es: 'Inteligencia' },
  'nav.manage': { en: 'Manage', es: 'Gestión' },
  'nav.overview': { en: 'Overview', es: 'Inicio' },
  'nav.missions': { en: 'Missions', es: 'Misiones' },
  'nav.projects': { en: 'Projects', es: 'Proyectos' },
  'nav.creative_agent': { en: 'Creative Agent', es: 'Agente Creativo' },
  'nav.image_studio': { en: 'Image Studio', es: 'Estudio de Imagen' },
  'nav.video_studio': { en: 'Video Studio', es: 'Estudio de Video' },
  'nav.voice_mode': { en: 'Voice Mode', es: 'Modo Voz' },
  'nav.workflows': { en: 'Workflows', es: 'Flujos' },
  'nav.files': { en: 'Files & Analysis', es: 'Archivos y Análisis' },
  'nav.knowledge': { en: 'Knowledge', es: 'Conocimiento' },
  'nav.assistants': { en: 'Assistants', es: 'Asistentes' },
  'nav.settings': { en: 'Settings', es: 'Ajustes' },
  'nav.integrations': { en: 'Integrations', es: 'Integraciones' },
  'nav.memory': { en: 'Memory', es: 'Memoria' },
  'nav.billing': { en: 'Billing', es: 'Facturación' },
  'plan': { en: 'Plan', es: 'Plan' },
  'upgrade': { en: 'Upgrade', es: 'Mejorar plan' },
  'explore': { en: 'Explore Operator AI.', es: 'Explora Operator AI.' },
  'cancel': { en: 'Cancel', es: 'Cancelar' },
  'save': { en: 'Save', es: 'Guardar' },
  'create': { en: 'Create', es: 'Crear' },
  'delete': { en: 'Delete', es: 'Eliminar' },
  'loading': { en: 'Loading...', es: 'Cargando...' },
  'deleted': { en: 'Deleted', es: 'Eliminado' },
  'failed': { en: 'Failed', es: 'Fallo' },
  'updated': { en: 'Updated', es: 'Actualizado' },
  'operator': { en: 'Operator', es: 'Operator' },
  'dash.hero_line_1': { en: 'Deploy missions.', es: 'Despliega misiones.' },
  'dash.hero_line_2': { en: 'Not prompts.', es: 'No prompts.' },
  'dash.hero_subtitle': { en: 'Your autonomous operations platform. Tell Operator what you want achieved — it orchestrates the work.', es: 'Tu plataforma de operaciones autónoma. Dile a Operator qué quieres conseguir — él orquesta el trabajo.' },
  'dash.new_paradigm': { en: 'New paradigm', es: 'Nuevo paradigma' },
  'dash.mission_title_prefix': { en: 'Your first', es: 'Tu primera' },
  'dash.mission_title_accent': { en: 'Mission', es: 'Misión' },
  'dash.mission_description': { en: 'Define an objective. Operator deploys agents, generates content, runs the workflow, and tracks outcomes. You approve. It executes.', es: 'Define un objetivo. Operator despliega agentes, genera contenido, ejecuta el flujo y mide los resultados. Tú apruebas. Él ejecuta.' },
  'dash.deploy_mission_cta': { en: 'Deploy a Mission', es: 'Desplegar Misión' },
  'dash.core_modules': { en: 'Core modules', es: 'Módulos principales' },
  'dash.also_here': { en: 'Also here', es: 'También aquí' },
  'dash.tile_chat_label': { en: 'Chat', es: 'Chat' },
  'dash.tile_chat_desc': { en: 'Talk to your brand AI. Ask, generate, execute — in one conversation.', es: 'Habla con la IA de tu marca. Pregunta, genera, ejecuta — todo en una conversación.' },
  'dash.tile_studio_label': { en: 'Studio', es: 'Studio' },
  'dash.tile_studio_desc': { en: 'Imagery and video, on-brand by default. Imagen 4, Flux 2 Pro, Veo 3.1.', es: 'Imagen y vídeo, fieles a tu marca. Imagen 4, Flux 2 Pro, Veo 3.1.' },
  'dash.tile_workflows_label': { en: 'Workflows', es: 'Flujos' },
  'dash.tile_workflows_desc': { en: 'Multi-step automations. Chain agents, integrations, and schedules.', es: 'Automatizaciones multi-paso. Encadena agentes, integraciones y programaciones.' },
  'dash.tile_brandos_label': { en: 'Brand OS', es: 'Brand OS' },
  'dash.tile_brandos_desc': { en: 'The rules your brand runs on. Colors, tone, words. Enforced on every output.', es: 'Las reglas de tu marca. Colores, tono, palabras. Aplicadas en cada salida.' },
  'dash.new_badge': { en: 'New', es: 'Nuevo' },
  'dash.quick_files': { en: 'Files', es: 'Archivos' },
  'dash.quick_voice': { en: 'Voice', es: 'Voz' },
  'dash.quick_agents': { en: 'Agents', es: 'Agentes' },
  'files.title': { en: 'Files & Analysis', es: 'Archivos y Análisis' },
  'files.subtitle': { en: 'Upload CSV, Excel, JSON. Ask questions in plain language. Get insights powered by GPT-4o.', es: 'Sube CSV, Excel, JSON. Pregunta en lenguaje natural. Obtén insights con GPT-4o.' },
  'files.upload': { en: 'Upload file', es: 'Subir archivo' },
  'files.your_files': { en: 'Your files', es: 'Tus archivos' },
  'files.none': { en: 'No files yet', es: 'Sin archivos aún' },
  'files.select_file': { en: 'Select a file to analyze', es: 'Selecciona un archivo para analizar' },
  'files.or_upload': { en: 'Or upload one to start.', es: 'O sube uno para empezar.' },
  'files.ask_question': { en: 'Ask a question', es: 'Haz una pregunta' },
  'files.question_placeholder': { en: 'e.g. Average revenue per region? Top 5 customers?', es: 'p. ej. ¿Ingreso medio por región? ¿Top 5 clientes?' },
  'files.suggest_summarize': { en: 'Summarize this file', es: 'Resume este archivo' },
  'files.suggest_top5': { en: 'Top 5 by value', es: 'Top 5 por valor' },
  'files.suggest_anomalies': { en: 'Spot any anomalies', es: 'Detecta anomalías' },
  'files.suggest_trends': { en: 'Trends over time', es: 'Tendencias en el tiempo' },
  'files.analyze': { en: 'Analyze', es: 'Analizar' },
  'files.answer': { en: 'Answer', es: 'Respuesta' },
  'files.rows': { en: 'rows', es: 'filas' },
  'files.delete_confirm': { en: 'Delete this file?', es: '¿Eliminar este archivo?' },
  'kb.documents': { en: 'Documents', es: 'Documentos' },
  'kb.file_one': { en: 'file', es: 'archivo' },
  'kb.file_many': { en: 'files', es: 'archivos' },
  'kb.empty': { en: 'No documents yet. Upload your first file to start.', es: 'Sin documentos aún. Sube tu primer archivo.' },
  'int.title': { en: 'Integrations', es: 'Integraciones' },
  'int.subtitle': { en: 'Give your assistant the keys to your stack. One AI for inbox, calendar, CRM, and docs.', es: 'Dale a tu asistente las llaves de tu stack. Una IA para email, calendario, CRM y docs.' },
  'int.connected': { en: 'Connected', es: 'Conectado' },
  'int.pending': { en: 'Pending', es: 'Pendiente' },
  'int.connect': { en: 'Connect', es: 'Conectar' },
  'int.can_ask': { en: 'You can ask things like', es: 'Puedes pedirle cosas como' },
  'int.examples': { en: 'Examples', es: 'Ejemplos' },
  'int.disconnect_confirm': { en: 'Disconnect this integration?', es: '¿Desconectar esta integración?' },
  'int.looking_for': { en: 'Looking for another tool?', es: '¿Buscas otra herramienta?' },
  'int.tell_us': { en: 'Tell us what to integrate next.', es: 'Dinos qué integrar.' },
  'wf.title': { en: 'Workflows', es: 'Flujos' },
  'wf.subtitle': { en: 'Multi-step automations powered by AI. By schedule, webhook, or email.', es: 'Automatizaciones multi-paso con IA. Por programación, webhook o email.' },
  'wf.from_template': { en: 'From template', es: 'Desde plantilla' },
  'wf.none': { en: 'No workflows yet', es: 'Sin flujos aún' },
  'wf.none_hint': { en: 'Start with a template — ready in 30 seconds.', es: 'Empieza con una plantilla — lista en 30 segundos.' },
  'wf.browse': { en: 'Browse templates', es: 'Ver plantillas' },
  'wf.runs': { en: 'runs', es: 'ejecuciones' },
  'wf.run_now': { en: 'Run now', es: 'Ejecutar' },
  'wf.delete_confirm': { en: 'Delete this workflow?', es: '¿Eliminar este flujo?' },
  'wf.templates_title': { en: 'Templates', es: 'Plantillas' },
  'wf.templates_hint': { en: 'Pick one to start. You can edit after.', es: 'Elige una. Podrás editar después.' },
  'wf.steps': { en: 'steps', es: 'pasos' },
  'proj.title': { en: 'Projects', es: 'Proyectos' },
  'proj.subtitle': { en: 'Workspaces per brand or client. Own chat history, documents, and context.', es: 'Espacios por marca o cliente. Historial, documentos y contexto propios.' },
  'proj.new': { en: 'New project', es: 'Nuevo proyecto' },
  'proj.name_placeholder': { en: 'Project name (e.g. Aurora Studio)', es: 'Nombre del proyecto (p. ej. Aurora Studio)' },
  'proj.desc_placeholder': { en: 'One-line description (optional)', es: 'Descripción breve (opcional)' },
  'proj.color': { en: 'Color', es: 'Color' },
  'proj.none': { en: 'No projects yet', es: 'Sin proyectos aún' },
  'proj.none_hint': { en: 'Create one for each brand or client.', es: 'Crea uno por cada marca o cliente.' },
  'proj.archive_confirm': { en: 'Archive this project?', es: '¿Archivar este proyecto?' },
  'mem.title': { en: 'Memory & voice', es: 'Memoria y voz' },
  'mem.kicker': { en: 'Your Operator', es: 'Tu Operator' },
  'mem.subtitle': { en: 'What your assistant remembers and how it writes like you.', es: 'Lo que tu asistente recuerda y cómo escribe como tú.' },
  'mem.your_voice': { en: 'Your voice', es: 'Tu voz' },
  'mem.analyzed_from': { en: 'Last analyzed from', es: 'Último análisis con' },
  'mem.messages': { en: 'messages.', es: 'mensajes.' },
  'mem.not_analyzed': { en: 'Not analyzed yet. Send a few messages first.', es: 'Aún no analizado. Envía algunos mensajes primero.' },
  'mem.learn': { en: 'Learn my voice', es: 'Aprender mi voz' },
  'mem.relearn': { en: 'Re-learn voice', es: 'Re-aprender voz' },
  'mem.tone': { en: 'Tone', es: 'Tono' },
  'mem.vocabulary': { en: 'Vocabulary', es: 'Vocabulario' },
  'mem.sentence_length': { en: 'Sentence length', es: 'Longitud de frase' },
  'mem.structure': { en: 'Structure', es: 'Estructura' },
  'mem.preferred': { en: 'Preferred phrases', es: 'Frases preferidas' },
  'mem.avoided': { en: 'Avoided phrases', es: 'Frases evitadas' },
  'mem.memories': { en: 'Memories', es: 'Recuerdos' },
  'mem.active_hint': { en: 'active · Saved automatically.', es: 'activos · Se guardan automáticamente.' },
  'mem.add': { en: 'Add memory', es: 'Añadir recuerdo' },
  'mem.placeholder': { en: 'I prefer concise summaries...', es: 'Prefiero resúmenes concisos...' },
  'mem.empty': { en: 'No memories yet. Chat and say "remember that..."', es: 'Sin recuerdos. Chatea y di "recuerda que..."' },
  'mem.delete_confirm': { en: 'Delete this memory?', es: '¿Eliminar este recuerdo?' },
  'mem.cat_preference': { en: 'Preference', es: 'Preferencia' },
  'mem.cat_fact': { en: 'Fact', es: 'Hecho' },
  'mem.cat_goal': { en: 'Goal', es: 'Objetivo' },
  'mem.cat_context': { en: 'Context', es: 'Contexto' },
  'mem.cat_general': { en: 'General', es: 'General' },
  'billing.title': { en: 'Billing', es: 'Facturación' },
  'billing.arrives': { en: 'Arrives in Week 8.', es: 'Llega en la Semana 8.' },
  'settings.title': { en: 'Settings', es: 'Ajustes' },
  'settings.kicker': { en: 'Operator', es: 'Operator' },
  'settings.subtitle': { en: 'Manage your workspace, integrations, and account.', es: 'Gestiona tu espacio, integraciones y cuenta.' },
  'settings.integrations': { en: 'Integrations', es: 'Integraciones' },
  'settings.integrations_desc': { en: 'Connect Gmail, Calendar, Notion, Slack, Drive and more.', es: 'Conecta Gmail, Calendar, Notion, Slack, Drive y más.' },
  'settings.memory_voice': { en: 'Memory & Voice', es: 'Memoria y Voz' },
  'settings.memory_desc': { en: 'What Operator knows about you.', es: 'Lo que Operator sabe de ti.' },
  'settings.billing': { en: 'Billing', es: 'Facturación' },
  'settings.billing_desc': { en: 'Plan, invoices, payment method.', es: 'Plan, facturas, método de pago.' },
  'profile.kicker': { en: 'Account', es: 'Cuenta' },
  'profile.title': { en: 'Profile', es: 'Perfil' },
  'profile.subtitle': { en: 'Manage how you appear in Operator AI.', es: 'Cómo apareces en Operator AI.' },
  'studio.title': { en: 'Studio', es: 'Estudio' },
  'studio.subtitle': { en: 'Create on-brand visuals in seconds.', es: 'Crea visuales fieles a tu marca en segundos.' },
  'studio.image_desc': { en: 'Editorial-grade imagery from text. Product, lifestyle, abstract, minimal.', es: 'Imágenes profesionales desde texto. Producto, lifestyle, abstracto, minimal.' },
  'studio.video_desc': { en: 'Cinematic AI video from a prompt. 4 or 8 seconds. ~60-90s render.', es: 'Vídeo cinematográfico con IA. 4 u 8 segundos. ~60-90s render.' },
  'studio.create_image': { en: 'Create image', es: 'Crear imagen' },
  'studio.create_video': { en: 'Create video', es: 'Crear vídeo' },
  'studio.chat_hint': { en: 'You can also generate from', es: 'También puedes generar desde el' },
  'studio.chat_link': { en: 'Chat', es: 'Chat' },
  'studio.chat_suffix': { en: '— just ask the agent.', es: '— solo pídelo al agente.' },
  'auth.welcome_back': { en: 'Welcome back', es: 'Bienvenido de nuevo' },
  'auth.sign_in_subtitle': { en: 'Sign in to Operator AI.', es: 'Inicia sesión en Operator AI.' },
  'auth.create_account_title': { en: 'Create your account', es: 'Crea tu cuenta' },
  'auth.sign_up_subtitle': { en: 'Start with Operator AI in minutes.', es: 'Empieza con Operator AI en minutos.' },
  'auth.continue_with_google': { en: 'Continue with Google', es: 'Continuar con Google' },
  'auth.continue_with_apple': { en: 'Continue with Apple', es: 'Continuar con Apple' },
  'auth.or': { en: 'or', es: 'o' },
  'auth.email': { en: 'Email', es: 'Correo electrónico' },
  'auth.password': { en: 'Password', es: 'Contraseña' },
  'auth.forgot': { en: 'Forgot?', es: '¿Olvidada?' },
  'auth.sign_in': { en: 'Sign in', es: 'Iniciar sesión' },
  'auth.sign_up': { en: 'Sign up', es: 'Registrarse' },
  'auth.new_here': { en: 'New here?', es: '¿Eres nuevo?' },
  'auth.create_account_link': { en: 'Create an account', es: 'Crear una cuenta' },
  'auth.full_name': { en: 'Full name', es: 'Nombre completo' },
  'auth.already_have_account': { en: 'Already have an account?', es: '¿Ya tienes cuenta?' },
  'auth.check_email': { en: 'Check your email to confirm', es: 'Revisa tu correo para confirmar' },
  'auth.create_account_btn': { en: 'Create account', es: 'Crear cuenta' },
  'auth.reset_subtitle': { en: 'We will email you a reset link.', es: 'Te enviaremos un enlace para restablecer.' },
  'auth.send_reset': { en: 'Send reset link', es: 'Enviar enlace' },
  'auth.back_to_login': { en: 'Back to login', es: 'Volver al inicio de sesión' },
  'topbar.sign_out': { en: 'Sign out', es: 'Cerrar sesión' },
  'topbar.account': { en: 'Account', es: 'Cuenta' },
  'topbar.notifications': { en: 'Notifications', es: 'Notificaciones' },
  'topbar.search': { en: 'Search or ask anything…', es: 'Busca o pregunta lo que quieras…' },
  'img.what_to_generate': { en: 'What to generate', es: 'Qué generar' },
  'img.generate': { en: 'Generate', es: 'Generar' },
  'img.generating': { en: 'Generating...', es: 'Generando...' },
  'img.library': { en: 'Library', es: 'Biblioteca' },
  'img.all': { en: 'All', es: 'Todas' },
  'img.starred': { en: 'Starred', es: 'Favoritas' },
  'img.delete_confirm': { en: 'Delete this image?', es: '¿Eliminar esta imagen?' },
  'img.references': { en: 'Reference images', es: 'Imágenes de referencia' },
  'img.optional': { en: '(optional)', es: '(opcional)' },
  'img.preset': { en: 'Preset', es: 'Preset' },
  'img.aspect_ratio': { en: 'Aspect ratio', es: 'Proporción' },
  'img.enhancer_on': { en: 'Prompt enhancer is on.', es: 'El mejorador está activo.' },
  'img.enhancer_off': { en: 'Prompt enhancer is off.', es: 'El mejorador está desactivado.' },
  'img.turn_off': { en: 'Turn off', es: 'Desactivar' },
  'img.turn_on': { en: 'Turn on', es: 'Activar' },
  'img.empty_all': { en: 'No images yet. First generation takes ~6 seconds.', es: 'Sin imágenes. La primera tarda ~6 segundos.' },
  'img.empty_starred': { en: 'No starred images yet.', es: 'Sin imágenes favoritas.' },
  'voice.title': { en: 'Voice Mode', es: 'Modo Voz' },
  'voice.subtitle': { en: 'Talk to your AI. Push-to-talk with memory.', es: 'Habla con tu IA. Push-to-talk con memoria.' },
  'assistants.title': { en: 'Assistants', es: 'Asistentes' },
  'assistants.subtitle': { en: 'Create and manage your AI assistants.', es: 'Crea y gestiona tus asistentes de IA.' },
};

type TranslationKey = string;

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
      aria-label={locale === 'en' ? 'Cambiar a español' : 'Switch to English'}
    >
      {locale === 'en' ? '🇪🇸 ES' : '🇬🇧 EN'}
    </button>
  );
}
