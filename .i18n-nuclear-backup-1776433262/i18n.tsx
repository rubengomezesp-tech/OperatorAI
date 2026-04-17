'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'es';

const translations = {
  // ── Sidebar groups ──
  'nav.workspace': { en: 'Workspace', es: 'Espacio' },
  'nav.studio': { en: 'Studio', es: 'Estudio' },
  'nav.automate': { en: 'Automate', es: 'Automatizar' },
  'nav.intelligence': { en: 'Intelligence', es: 'Inteligencia' },
  'nav.manage': { en: 'Manage', es: 'Gestión' },

  // ── Sidebar items ──
  'nav.overview': { en: 'Overview', es: 'Inicio' },
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

  // ── Dashboard (Missions + Brand OS layout) ──
  'dash.hero_line_1': { en: 'Deploy missions.', es: 'Despliega misiones.' },
  'dash.hero_line_2': { en: 'Not prompts.', es: 'No prompts.' },
  'dash.hero_subtitle': {
    en: 'Your autonomous operations platform. Tell Operator what you want achieved — it orchestrates the work.',
    es: 'Tu plataforma de operaciones autónoma. Dile a Operator qué quieres conseguir — él orquesta el trabajo.',
  },
  'dash.new_paradigm': { en: 'New paradigm', es: 'Nuevo paradigma' },
  'dash.mission_title_prefix': { en: 'Your first', es: 'Tu primera' },
  'dash.mission_title_accent': { en: 'Mission', es: 'Misión' },
  'dash.mission_description': {
    en: 'Define an objective. Operator deploys agents, generates content, runs the workflow, and tracks outcomes. You approve. It executes.',
    es: 'Define un objetivo. Operator despliega agentes, genera contenido, ejecuta el flujo y mide los resultados. Tú apruebas. Él ejecuta.',
  },
  'dash.deploy_mission_cta': { en: 'Deploy a Mission', es: 'Desplegar Misión' },
  'dash.core_modules': { en: 'Core modules', es: 'Módulos principales' },
  'dash.also_here': { en: 'Also here', es: 'También aquí' },
  'dash.tile_chat_label': { en: 'Chat', es: 'Chat' },
  'dash.tile_chat_desc': {
    en: 'Talk to your brand AI. Ask, generate, execute — in one conversation.',
    es: 'Habla con la IA de tu marca. Pregunta, genera, ejecuta — todo en una conversación.',
  },
  'dash.tile_studio_label': { en: 'Studio', es: 'Studio' },
  'dash.tile_studio_desc': {
    en: 'Imagery and video, on-brand by default. Imagen 4, Flux 2 Pro, Veo 3.1.',
    es: 'Imagen y vídeo, fieles a tu marca por defecto. Imagen 4, Flux 2 Pro, Veo 3.1.',
  },
  'dash.tile_workflows_label': { en: 'Workflows', es: 'Flujos' },
  'dash.tile_workflows_desc': {
    en: 'Multi-step automations. Chain agents, integrations, and schedules.',
    es: 'Automatizaciones multi-paso. Encadena agentes, integraciones y programaciones.',
  },
  'dash.tile_brandos_label': { en: 'Brand OS', es: 'Brand OS' },
  'dash.tile_brandos_desc': {
    en: 'The rules your brand runs on. Colors, tone, words. Enforced on every output.',
    es: 'Las reglas de tu marca. Colores, tono, palabras. Aplicadas en cada salida.',
  },
  'dash.new_badge': { en: 'New', es: 'Nuevo' },
  'dash.quick_files': { en: 'Files', es: 'Archivos' },
  'dash.quick_voice': { en: 'Voice', es: 'Voz' },
  'dash.quick_agents': { en: 'Agents', es: 'Agentes' },

  // ── Chat composer ──
  'chat.message_placeholder': { en: 'Message Operator...', es: 'Escribe a Operator...' },
  'chat.footer_hint': {
    en: 'Operator AI — Enter to send, Shift+Enter for new line',
    es: 'Operator AI — Enter para enviar, Shift+Enter para nueva línea',
  },

  // ── Image Studio ──
  'img.what_to_generate': { en: 'What to generate', es: 'Qué generar' },
  'img.prompt_placeholder': {
    en: 'A minimalist still life of a crystal perfume bottle on warm marble, soft morning light...',
    es: 'Un bodegón minimalista de un frasco de perfume de cristal sobre mármol cálido, luz suave de mañana...',
  },
  'img.enhancer_on': {
    en: 'Prompt enhancer is on — your brief gets rewritten with expert detail.',
    es: 'El mejorador de prompt está activo — tu idea se reescribe con detalle experto.',
  },
  'img.enhancer_off': {
    en: 'Prompt enhancer is off — your text is used raw.',
    es: 'El mejorador está desactivado — se usa tu texto tal cual.',
  },
  'img.turn_off': { en: 'Turn off', es: 'Desactivar' },
  'img.turn_on': { en: 'Turn on', es: 'Activar' },
  'img.references': { en: 'Reference images', es: 'Imágenes de referencia' },
  'img.optional': { en: '(optional)', es: '(opcional)' },
  'img.preset': { en: 'Preset', es: 'Preset' },
  'img.aspect_ratio': { en: 'Aspect ratio', es: 'Proporción' },
  'img.with_refs_time': { en: '~9 sec with references', es: '~9 seg con referencias' },
  'img.no_refs_time': { en: '~6 sec', es: '~6 seg' },
  'img.generate': { en: 'Generate', es: 'Generar' },
  'img.generating': { en: 'Generating...', es: 'Generando...' },
  'img.image_ready': { en: 'Image ready', es: 'Imagen lista' },
  'img.generation_failed': { en: 'Generation failed', es: 'Fallo al generar' },
  'img.delete_confirm': { en: 'Delete this image?', es: '¿Eliminar esta imagen?' },
  'img.library': { en: 'Library', es: 'Biblioteca' },
  'img.filter_all': { en: 'All', es: 'Todas' },
  'img.filter_starred': { en: 'Starred', es: 'Favoritas' },
  'img.empty_starred': { en: 'No starred images yet.', es: 'No hay imágenes favoritas.' },
  'img.empty_all': {
    en: 'No images yet. Your first generation takes ~6 seconds.',
    es: 'Sin imágenes aún. La primera generación tarda ~6 segundos.',
  },

  // ── Files ──
  'files.title': { en: 'Files & Analysis', es: 'Archivos y Análisis' },
  'files.kicker': { en: 'Operator', es: 'Operator' },
  'files.subtitle': {
    en: 'Upload CSV, Excel, JSON. Ask questions in plain language. Get insights, summaries, comparisons — powered by GPT-4o.',
    es: 'Sube CSV, Excel, JSON. Pregunta en lenguaje natural. Obtén insights, resúmenes y comparativas — con GPT-4o.',
  },
  'files.upload': { en: 'Upload file', es: 'Subir archivo' },
  'files.your_files': { en: 'Your files', es: 'Tus archivos' },
  'files.none': { en: 'No files yet', es: 'Sin archivos aún' },
  'files.uploaded': { en: 'Uploaded', es: 'Subido' },
  'files.upload_failed': { en: 'Upload failed', es: 'Error al subir' },
  'files.select_file': { en: 'Select a file to analyze', es: 'Selecciona un archivo para analizar' },
  'files.or_upload': { en: 'Or upload one to start.', es: 'O sube uno para empezar.' },
  'files.ask_question': { en: 'Ask a question', es: 'Haz una pregunta' },
  'files.question_placeholder': {
    en: 'e.g. What\u2019s the average revenue per region? Top 5 customers by total spend? Trends month over month?',
    es: 'p. ej. ¿Cuál es el ingreso medio por región? ¿Top 5 clientes por gasto total? ¿Tendencias mes a mes?',
  },
  'files.suggest_summarize': { en: 'Summarize this file', es: 'Resume este archivo' },
  'files.suggest_top5': { en: 'Top 5 by value', es: 'Top 5 por valor' },
  'files.suggest_anomalies': { en: 'Spot any anomalies', es: 'Detecta anomalías' },
  'files.suggest_trends': { en: 'Trends over time', es: 'Tendencias en el tiempo' },
  'files.analyze': { en: 'Analyze', es: 'Analizar' },
  'files.analysis_failed': { en: 'Analysis failed', es: 'Fallo el análisis' },
  'files.answer': { en: 'Answer', es: 'Respuesta' },
  'files.delete_confirm': { en: 'Delete this file?', es: '¿Eliminar este archivo?' },
  'files.deleted': { en: 'Deleted', es: 'Eliminado' },
  'files.failed': { en: 'Failed', es: 'Fallo' },
  'files.rows': { en: 'rows', es: 'filas' },

  // ── Knowledge ──
  'kb.documents': { en: 'Documents', es: 'Documentos' },
  'kb.file_one': { en: 'file', es: 'archivo' },
  'kb.file_many': { en: 'files', es: 'archivos' },
  'kb.loading': { en: 'Loading...', es: 'Cargando...' },
  'kb.empty': {
    en: 'No documents yet. Upload your first file to start.',
    es: 'Sin documentos aún. Sube tu primer archivo para empezar.',
  },
  'kb.delete_failed': { en: 'Delete failed', es: 'Error al eliminar' },
  'kb.deleted': { en: 'Deleted', es: 'Eliminado' },

  // ── Integrations ──
  'int.title': { en: 'Integrations', es: 'Integraciones' },
  'int.kicker': { en: 'Operator', es: 'Operator' },
  'int.subtitle': {
    en: 'Give your assistant the keys to your stack. One AI that reads your inbox, books your calendar, updates your CRM, and works your docs.',
    es: 'Dale a tu asistente las llaves de tu stack. Una IA que lee tu email, agenda tu calendario, actualiza tu CRM y trabaja con tus documentos.',
  },
  'int.connected': { en: 'Connected', es: 'Conectado' },
  'int.pending': { en: 'Pending', es: 'Pendiente' },
  'int.connect': { en: 'Connect', es: 'Conectar' },
  'int.can_ask_things': { en: 'You can ask things like', es: 'Puedes pedirle cosas como' },
  'int.examples': { en: 'Examples', es: 'Ejemplos' },
  'int.disconnect_confirm': { en: 'Disconnect this integration?', es: '¿Desconectar esta integración?' },
  'int.disconnected': { en: 'Disconnected', es: 'Desconectada' },
  'int.disconnect_failed': { en: 'Failed to disconnect', es: 'Error al desconectar' },
  'int.connect_failed': { en: 'Failed to connect', es: 'Error al conectar' },
  'int.not_configured': {
    en: 'Integrations not configured yet. Add COMPOSIO_API_KEY to your environment.',
    es: 'Las integraciones aún no están configuradas. Añade COMPOSIO_API_KEY a tu entorno.',
  },
  'int.request_integration_prompt': {
    en: 'Looking for another tool?',
    es: '¿Buscas otra herramienta?',
  },
  'int.request_integration_cta': {
    en: 'Tell us what to integrate next.',
    es: 'Dinos qué integrar a continuación.',
  },

  // ── Workflows ──
  'wf.title': { en: 'Workflows', es: 'Flujos' },
  'wf.kicker': { en: 'Operator', es: 'Operator' },
  'wf.subtitle': {
    en: 'Multi-step automations powered by AI. Trigger by schedule, webhook, or email. Chain web search, agents, emails, and integrations.',
    es: 'Automatizaciones multi-paso con IA. Se activan por programación, webhook o email. Encadena búsquedas web, agentes, emails e integraciones.',
  },
  'wf.from_template': { en: 'From template', es: 'Desde plantilla' },
  'wf.none': { en: 'No workflows yet', es: 'Sin flujos aún' },
  'wf.none_hint': {
    en: 'Start with a template — ready to use in 30 seconds.',
    es: 'Empieza con una plantilla — lista en 30 segundos.',
  },
  'wf.browse': { en: 'Browse templates', es: 'Ver plantillas' },
  'wf.runs': { en: 'runs', es: 'ejecuciones' },
  'wf.last_label': { en: 'last', es: 'última' },
  'wf.run_now': { en: 'Run now', es: 'Ejecutar ahora' },
  'wf.active': { en: 'Active', es: 'Activo' },
  'wf.paused': { en: 'Paused', es: 'Pausado' },
  'wf.created': { en: 'Workflow created', es: 'Flujo creado' },
  'wf.delete_confirm': { en: 'Delete this workflow?', es: '¿Eliminar este flujo?' },
  'wf.deleted': { en: 'Deleted', es: 'Eliminado' },
  'wf.failed': { en: 'Failed', es: 'Fallo' },
  'wf.limit_reached': { en: 'Limit reached', es: 'Límite alcanzado' },
  'wf.run_success_prefix': { en: 'Workflow ran successfully —', es: 'Flujo ejecutado correctamente —' },
  'wf.run_success_suffix': { en: 'steps', es: 'pasos' },
  'wf.run_failed': { en: 'Run failed', es: 'Fallo en ejecución' },
  'wf.templates_title': { en: 'Templates', es: 'Plantillas' },
  'wf.templates_hint': { en: 'Pick one to start. You can edit after.', es: 'Elige una para empezar. Podrás editar después.' },
  'wf.steps_label': { en: 'steps', es: 'pasos' },

  // ── Projects ──
  'proj.title': { en: 'Projects', es: 'Proyectos' },
  'proj.kicker': { en: 'Operator', es: 'Operator' },
  'proj.subtitle': {
    en: 'Workspaces per brand or client. Each project gets its own chat history, documents, and context.',
    es: 'Espacios por marca o cliente. Cada proyecto tiene su propio historial, documentos y contexto.',
  },
  'proj.new_project': { en: 'New project', es: 'Nuevo proyecto' },
  'proj.name_placeholder': { en: 'Project name (e.g. Aurora Studio)', es: 'Nombre del proyecto (p. ej. Aurora Studio)' },
  'proj.description_placeholder': { en: 'One-line description (optional)', es: 'Descripción de una línea (opcional)' },
  'proj.color_label': { en: 'Color', es: 'Color' },
  'proj.cancel': { en: 'Cancel', es: 'Cancelar' },
  'proj.create': { en: 'Create', es: 'Crear' },
  'proj.created': { en: 'Project created', es: 'Proyecto creado' },
  'proj.updated': { en: 'Updated', es: 'Actualizado' },
  'proj.archived': { en: 'Archived', es: 'Archivado' },
  'proj.archive_confirm': { en: 'Archive this project? Conversations and documents stay.', es: '¿Archivar este proyecto? Las conversaciones y documentos se mantienen.' },
  'proj.none_title': { en: 'No projects yet', es: 'Sin proyectos aún' },
  'proj.none_hint': { en: 'Create one for each brand or client you operate.', es: 'Crea uno por cada marca o cliente con el que trabajes.' },
  'proj.failed': { en: 'Failed', es: 'Fallo' },

  // ── Memory ──
  'mem.kicker': { en: 'Your Operator', es: 'Tu Operator' },
  'mem.title': { en: 'Memory & voice', es: 'Memoria y voz' },
  'mem.subtitle': {
    en: 'What your assistant remembers about you, and how it has learned to write like you.',
    es: 'Lo que tu asistente recuerda de ti, y cómo ha aprendido a escribir como tú.',
  },
  'mem.your_voice': { en: 'Your voice', es: 'Tu voz' },
  'mem.last_analyzed_prefix': { en: 'Last analyzed from', es: 'Último análisis con' },
  'mem.last_analyzed_suffix': { en: 'messages.', es: 'mensajes.' },
  'mem.not_analyzed': { en: 'Not analyzed yet. Send a few messages first, then click Learn my voice.', es: 'Aún no analizado. Envía algunos mensajes y pulsa Aprender mi voz.' },
  'mem.learn_voice': { en: 'Learn my voice', es: 'Aprender mi voz' },
  'mem.relearn_voice': { en: 'Re-learn voice', es: 'Volver a aprender voz' },
  'mem.voice_learned': { en: 'Voice learned', es: 'Voz aprendida' },
  'mem.tone': { en: 'Tone', es: 'Tono' },
  'mem.vocabulary': { en: 'Vocabulary', es: 'Vocabulario' },
  'mem.sentence_length': { en: 'Sentence length', es: 'Longitud de frase' },
  'mem.structure': { en: 'Structure', es: 'Estructura' },
  'mem.preferred_phrases': { en: 'Preferred phrases', es: 'Frases preferidas' },
  'mem.avoided_phrases': { en: 'Avoided phrases', es: 'Frases evitadas' },
  'mem.memories': { en: 'Memories', es: 'Recuerdos' },
  'mem.active_suffix': { en: 'active · Saved automatically when meaningful or when you ask.', es: 'activos · Se guardan automáticamente cuando son relevantes o cuando lo pides.' },
  'mem.add_memory': { en: 'Add memory', es: 'Añadir recuerdo' },
  'mem.save': { en: 'Save', es: 'Guardar' },
  'mem.memory_placeholder': { en: 'I prefer concise bullet summaries over paragraphs...', es: 'Prefiero resúmenes concisos en lista antes que párrafos...' },
  'mem.memory_saved': { en: 'Memory saved', es: 'Recuerdo guardado' },
  'mem.empty': { en: 'No memories yet. Chat a bit and say "remember that..." or add manually.', es: 'Sin recuerdos aún. Chatea un poco y di "recuerda que..." o añade uno manualmente.' },
  'mem.delete_confirm': { en: 'Delete this memory?', es: '¿Eliminar este recuerdo?' },
  'mem.deleted': { en: 'Deleted', es: 'Eliminado' },
  'mem.update_failed': { en: 'Update failed', es: 'Error al actualizar' },
  'mem.delete_failed': { en: 'Delete failed', es: 'Error al eliminar' },
  'mem.need_more_prefix': { en: 'Need', es: 'Necesitas' },
  'mem.need_more_middle': { en: '+ conversations first. You have', es: '+ conversaciones antes. Tienes' },
  'mem.cat_preference': { en: 'Preference', es: 'Preferencia' },
  'mem.cat_fact': { en: 'Fact', es: 'Hecho' },
  'mem.cat_goal': { en: 'Goal', es: 'Objetivo' },
  'mem.cat_context': { en: 'Context', es: 'Contexto' },
  'mem.cat_general': { en: 'General', es: 'General' },

  // ── Billing stub ──
  'billing.title': { en: 'Billing', es: 'Facturación' },
  'billing.arrives_week_8': { en: 'Arrives in Week 8.', es: 'Llega en la Semana 8.' },

  // ── Settings page ──
  'settings.title': { en: 'Settings', es: 'Ajustes' },
  'settings.kicker': { en: 'Operator', es: 'Operator' },
  'settings.subtitle': {
    en: 'Manage your workspace, integrations, and account.',
    es: 'Gestiona tu espacio, integraciones y cuenta.',
  },
  'settings.integrations': { en: 'Integrations', es: 'Integraciones' },
  'settings.integrations_desc': {
    en: 'Connect Gmail, Calendar, Notion, Slack, Drive and more.',
    es: 'Conecta Gmail, Calendar, Notion, Slack, Drive y más.',
  },
  'settings.memory_voice': { en: 'Memory & Voice', es: 'Memoria y Voz' },
  'settings.memory_desc': {
    en: 'What Operator knows about you. Your voice fingerprint.',
    es: 'Lo que Operator sabe de ti. Tu huella de voz.',
  },
  'settings.billing': { en: 'Billing', es: 'Facturación' },
  'settings.billing_desc': {
    en: 'Plan, invoices, payment method.',
    es: 'Plan, facturas, método de pago.',
  },

  // ── Profile page ──
  'profile.kicker': { en: 'Account', es: 'Cuenta' },
  'profile.title': { en: 'Profile', es: 'Perfil' },
  'profile.subtitle': { en: 'Manage how you appear in Operator AI.', es: 'Gestiona cómo apareces en Operator AI.' },

  // ── Auth ──
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
  'auth.check_email': { en: 'Check your email to confirm your account', es: 'Revisa tu correo para confirmar tu cuenta' },
  'auth.create_account_btn': { en: 'Create account', es: 'Crear cuenta' },

  // ── Topbar ──
  'topbar.sign_out': { en: 'Sign out', es: 'Cerrar sesión' },
  'topbar.account': { en: 'Account', es: 'Cuenta' },
  'topbar.notifications': { en: 'Notifications', es: 'Notificaciones' },
  'topbar.search': { en: 'Search or ask anything…', es: 'Busca o pregunta lo que quieras…' },

  // ── Common ──
  'plan': { en: 'Plan', es: 'Plan' },
  'upgrade': { en: 'Upgrade', es: 'Mejorar plan' },

  // (Legacy keys kept below for backward compatibility) ─
  'dash.title': { en: 'Operator Studio', es: 'Operator Studio' },
  'dash.headline': { en: 'Run your brand like a', es: 'Gestiona tu marca como un' },
  'dash.headline_accent': { en: 'studio', es: 'estudio' },
  'dash.subtitle': {
    en: 'Chat, imagery, video, voice, workflows, and data analysis — unified under one AI that knows your brand.',
    es: 'Chat, imágenes, video, voz, automatizaciones y análisis de datos — todo bajo una IA que conoce tu marca.',
  },
  'dash.modules': { en: 'Modules', es: 'Módulos' },
  'dash.tools': { en: 'tools', es: 'herramientas' },
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
      aria-label={locale === 'en' ? 'Cambiar a español' : 'Switch to English'}
    >
      {locale === 'en' ? '🇪🇸 ES' : '🇬🇧 EN'}
    </button>
  );
}
