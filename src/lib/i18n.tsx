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
  'top.studio': { en: 'Studio', es: 'Estudio' },
  'top.creative_agent': { en: 'Creative Agent', es: 'Agente Creativo' },
  'top.image_studio': { en: 'Image Studio', es: 'Estudio de Imagen' },
  'top.video_studio': { en: 'Video Studio', es: 'Estudio de Video' },
  'top.campaigns': { en: 'Campaigns', es: 'Campañas' },
  'top.copywriter': { en: 'Copywriter', es: 'Copywriter' },
  'top.voice_mode': { en: 'Voice Mode', es: 'Modo Voz' },
  'top.workflows': { en: 'Workflows', es: 'Flujos' },
  'top.files': { en: 'Files & Analysis', es: 'Archivos y Análisis' },
  'top.projects': { en: 'Projects', es: 'Proyectos' },
  'top.knowledge': { en: 'Knowledge', es: 'Conocimiento' },
  'top.memory': { en: 'Memory', es: 'Memoria' },
  'top.library': { en: 'Library', es: 'Biblioteca' },
  'top.assistants': { en: 'Assistants', es: 'Asistentes' },
  'top.team': { en: 'Team', es: 'Equipo' },
  'top.analytics': { en: 'Analytics', es: 'Analítica' },
  'top.settings': { en: 'Settings', es: 'Ajustes' },
  'top.profile': { en: 'Profile', es: 'Perfil' },
  'top.integrations': { en: 'Integrations', es: 'Integraciones' },
  'top.billing': { en: 'Billing', es: 'Facturación' },
  'top.missions': { en: 'Missions', es: 'Misiones' },
  'top.brand_os': { en: 'Brand OS', es: 'Brand OS' },
  'dash.hero1': { en: 'Deploy missions.', es: 'Despliega misiones.' },
  'dash.hero2': { en: 'Not prompts.', es: 'No prompts.' },
  'dash.sub': { en: 'Your autonomous operations platform. Tell Operator what you want — it orchestrates the work.', es: 'Tu plataforma de operaciones autónoma. Dile a Operator qué quieres — él orquesta el trabajo.' },
  'dash.paradigm': { en: 'New paradigm', es: 'Nuevo paradigma' },
  'dash.first': { en: 'Your first', es: 'Tu primera' },
  'dash.mission': { en: 'Mission', es: 'Misión' },
  'dash.mission_desc': { en: 'Define an objective. Operator deploys agents, generates content, runs the workflow, and tracks outcomes. You approve. It executes.', es: 'Define un objetivo. Operator despliega agentes, genera contenido, ejecuta el flujo y mide resultados. Tú apruebas. Él ejecuta.' },
  'dash.deploy': { en: 'Deploy a Mission', es: 'Desplegar Misión' },
  'dash.core': { en: 'Core modules', es: 'Módulos principales' },
  'dash.also': { en: 'Also here', es: 'También aquí' },
  'dash.chat': { en: 'Chat', es: 'Chat' },
  'dash.chat_d': { en: 'Talk to your brand AI. Ask, generate, execute — in one conversation.', es: 'Habla con tu IA. Pregunta, genera, ejecuta — en una conversación.' },
  'dash.stud': { en: 'Studio', es: 'Studio' },
  'dash.stud_d': { en: 'Imagery and video, on-brand. Flux 2 Pro, Veo 3.1.', es: 'Imagen y vídeo, de marca. Flux 2 Pro, Veo 3.1.' },
  'dash.wf': { en: 'Workflows', es: 'Flujos' },
  'dash.wf_d': { en: 'Multi-step automations. Chain agents, integrations, schedules.', es: 'Automatizaciones multi-paso. Agentes, integraciones, programaciones.' },
  'dash.bos': { en: 'Brand OS', es: 'Brand OS' },
  'dash.bos_d': { en: 'The rules your brand runs on. Colors, tone, words.', es: 'Las reglas de tu marca. Colores, tono, palabras.' },
  'dash.new': { en: 'New', es: 'Nuevo' },
  'dash.files': { en: 'Files', es: 'Archivos' },
  'dash.voice': { en: 'Voice', es: 'Voz' },
  'dash.agents': { en: 'Agents', es: 'Agentes' },
  'set.title': { en: 'Settings', es: 'Ajustes' },
  'set.sub': { en: 'Manage your workspace, integrations, and account.', es: 'Gestiona tu espacio, integraciones y cuenta.' },
  'set.int': { en: 'Integrations', es: 'Integraciones' },
  'set.int_d': { en: 'Connect Gmail, Calendar, Notion, Slack, Drive and more.', es: 'Conecta Gmail, Calendar, Notion, Slack, Drive y más.' },
  'set.mem': { en: 'Memory & Voice', es: 'Memoria y Voz' },
  'set.mem_d': { en: 'What Operator knows about you. Your voice fingerprint.', es: 'Lo que Operator sabe de ti. Tu huella de voz.' },
  'set.bil': { en: 'Billing', es: 'Facturación' },
  'set.bil_d': { en: 'Plan, invoices, payment method.', es: 'Plan, facturas, método de pago.' },
  'billing.title': { en: 'Billing', es: 'Facturación' },
  'billing.coming': { en: 'Arrives in Week 8.', es: 'Llega en la Semana 8.' },
  'studio.title': { en: 'Studio', es: 'Estudio' },
  'studio.sub': { en: 'Create on-brand visuals in seconds.', es: 'Crea visuales de marca en segundos.' },
  'studio.img_d': { en: 'Generate editorial-grade imagery from text. Product, lifestyle, abstract, minimal.', es: 'Genera imágenes profesionales desde texto. Producto, lifestyle, abstracto, minimal.' },
  'studio.vid_d': { en: 'Generate cinematic AI video from a prompt. 4 or 8 seconds.', es: 'Genera vídeo cinematográfico desde un prompt. 4 u 8 seg.' },
  'studio.cr_img': { en: 'Create image', es: 'Crear imagen' },
  'studio.cr_vid': { en: 'Create video', es: 'Crear vídeo' },
  'studio.also': { en: 'You can also generate from Chat — just ask the agent.', es: 'También puedes generar desde el Chat — solo pídeselo al agente.' },
  'profile.kicker': { en: 'Account', es: 'Cuenta' },
  'profile.title': { en: 'Profile', es: 'Perfil' },
  'profile.sub': { en: 'Manage how you appear in Operator AI.', es: 'Gestiona cómo apareces en Operator AI.' },
  'plan': { en: 'Plan', es: 'Plan' },
  'upgrade': { en: 'Upgrade', es: 'Mejorar plan' },
  'explore': { en: 'Explore Operator AI.', es: 'Explora Operator AI.' },
  'operator': { en: 'Operator', es: 'Operator' },
};

interface I18nContextType { locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string; }

const I18nContext = createContext<I18nContextType>({ locale: 'en', setLocale: () => {}, t: (key) => key });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  useEffect(() => { const s = localStorage.getItem('operator.locale') as Locale | null; if (s === 'es' || s === 'en') setLocaleState(s); }, []);
  function setLocale(l: Locale) { setLocaleState(l); localStorage.setItem('operator.locale', l); }
  function t(key: string): string { const e = translations[key]; if (!e) return key; return e[locale] ?? e.en ?? key; }
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <button type="button" onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
      className="h-8 px-2.5 rounded-md border border-border bg-surface-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted hover:text-gold hover:border-gold/40 transition-colors flex items-center gap-1.5"
      title={locale === 'en' ? 'Cambiar a español' : 'Switch to English'}>
      {locale === 'en' ? '🇪🇸 ES' : '🇬🇧 EN'}
    </button>
  );
}
