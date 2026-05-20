/**
 * Coach Orchestrator — Specialized Prompts
 *
 * Construye system prompts focalizados según el intent detectado.
 *
 * Filosofía:
 *   El master prompt define IDENTIDAD (quién eres, cómo hablas, marco mental).
 *   Los specialized prompts añaden CONTEXTO de ejecución sólo de la rama
 *   relevante. El coach nunca ve tools que no aplican al intent actual.
 *
 * Cada función devuelve el system prompt completo listo para enviar al modelo.
 */

import { OPERATOR_MASTER_PROMPT } from '@/lib/models/operator-prompt';
import type { CoachToolName, Intent } from './types';

/* -------------------------------------------------------------------------- */
/*  BLOQUES DE TOOLS POR NOMBRE                                                */
/* -------------------------------------------------------------------------- */

const TOOL_BLOCKS: Record<CoachToolName, string> = {
  create_ad: `### create_ad — anuncio publicitario completo
Úsalo cuando el usuario pide un ad/anuncio/publicidad/campaña terminado.
Argumentos OBLIGATORIOS:
  - user_prompt (string): la petición del usuario, literal o resumida fielmente, en 1-2 frases. Incluye producto/oferta/audiencia si lo dice.
  - formats (array): SOLO valores de esta lista exacta: ["1:1"], ["9:16"], ["16:9"], ["4:5"]. Default ["1:1"].
Argumentos OPCIONALES:
  - preset_override (string): SOLO uno de "luxury-minimal" | "aggressive" | "clean-conversion" | "product-demo". Úsalo SOLO si el usuario lo pidió explícitamente con esas palabras.

EJEMPLO CORRECTO:
<tool_call>{"name":"create_ad","arguments":{"user_prompt":"Anuncio para Instagram cuadrado de mi marca","formats":["1:1"]}}</tool_call>

EJEMPLO con story vertical:
<tool_call>{"name":"create_ad","arguments":{"user_prompt":"Story vertical para mi nuevo lanzamiento","formats":["9:16"]}}</tool_call>

PROHIBIDO:
  - Inventar formats como "square", "instagram_square", "story", "post". Usa SOLO los 4 ratios canónicos.
  - Inventar presets fuera de los 4 nombres exactos.
  - Llamar a "compose_ad" o "analyze_assets" — esas tools no existen para ti.`,

  image: `### image — imagen sola sin texto/CTA
Úsalo SOLO cuando el usuario pide una foto, render, ilustración o wallpaper SIN texto encima ni publicidad.
Argumentos OBLIGATORIOS:
  - prompt (string): descripción detallada de 40-80 palabras en inglés o español. Incluye: sujeto, cámara/lente (35mm/50mm/etc.), iluminación (natural/studio/cinematic), colores específicos, composición, mood.
  - aspect_ratio (string): SOLO uno de "1:1" | "16:9" | "9:16" | "4:5" | "3:2".
Argumentos OPCIONALES:
  - num_images (1-4): default 1.
  - reference_image_url (string): URL de imagen base si el usuario adjuntó algo o quiere editar.

EJEMPLO CORRECTO:
<tool_call>{"name":"image","arguments":{"prompt":"Photorealistic luxury watch on dark marble surface, dramatic top-down lighting, gold and black tones, shallow depth of field, 50mm lens, premium product photography, ultra sharp details, magazine quality","aspect_ratio":"1:1"}}</tool_call>

PROHIBIDO:
  - Usar prompts cortos genéricos tipo "un coche rojo". Siempre detalla.
  - Pedir esta tool si el usuario quiere PUBLICIDAD — para eso es create_ad.`,

  video: `### video — vídeo corto cinematográfico (~4 segundos)
Úsalo cuando el usuario pide vídeo/clip/reel/animación.
Argumentos OBLIGATORIOS:
  - prompt (string): descripción de la escena, sujeto, movimiento de cámara, mood.
  - duration (number): SOLO 4 o 8. Default 4.

EJEMPLO:
<tool_call>{"name":"video","arguments":{"prompt":"Slow-motion shot of luxury watch rotating on glossy black surface, cinematic lighting, gold reflections, 4K","duration":4}}</tool_call>`,

  knowledge_search: `### knowledge_search — buscar en documentos del usuario
Úsalo cuando el usuario pregunta sobre sus PDFs, brand docs, o material que ha subido.
Argumentos:
  - query (string): qué buscar. Una frase clara y específica.

EJEMPLO:
<tool_call>{"name":"knowledge_search","arguments":{"query":"política de devoluciones"}}</tool_call>`,

  file_analysis: `### file_analysis — analizar CSV/Excel/JSON subido
Úsalo cuando el usuario quiere insights de datos en un archivo.
Argumentos:
  - file_id (string): ID del archivo subido.
  - question (string): pregunta concreta sobre los datos.

EJEMPLO:
<tool_call>{"name":"file_analysis","arguments":{"file_id":"abc123","question":"¿Qué producto se vendió más en marzo?"}}</tool_call>`,

  coding_mission: `### coding_mission — runtime tipo Codex para repo/código
Úsalo cuando el usuario pide conectar al repo, revisar código, inspeccionar GitHub, mirar errores de build/deploy, buscar archivos, analizar diffs o planear cambios técnicos.
Este runtime NO vive dentro del modelo: es una herramienta separada conectada al Mac mediante el puente seguro.

Argumentos OBLIGATORIOS:
  - task (string): la misión técnica concreta del usuario, fiel a su mensaje.

Argumentos OPCIONALES:
  - mode: "plan" | "dry-run". Default "dry-run". Usa "dry-run" para inspeccionar y recomendar sin escribir.
  - max_files (number): 20-300. Default 120.
  - max_matches (number): 10-120. Default 40.

EJEMPLO:
<tool_call>{"name":"coding_mission","arguments":{"task":"Conectate al repo y dime si existe el runtime estilo Codex","mode":"dry-run","max_files":120,"max_matches":40}}</tool_call>

REGLAS:
  - Si el usuario solo pregunta si puedes ver el repo, usa esta tool con mode "dry-run".
  - No prometas escribir archivos ni hacer commits desde el chat normal.
  - Si la tool dice que el bridge no está disponible, explica que hay que encender el puente del Mac.`,

  get_brand_assets: `### get_brand_assets — recuperar contexto de marca
Úsalo CUANDO necesites saber colores, logo, tono o audiencia de la marca del usuario antes de generar algo.
NO toma argumentos.

EJEMPLO:
<tool_call>{"name":"get_brand_assets","arguments":{}}</tool_call>`,

  web_search: `### web_search — búsqueda web actualizada
Úsalo cuando necesitas información FRESCA, datos actuales, noticias, ranking, comparativas, o investigación.
NO uses esto si la pregunta es de conocimiento general estable.
Argumentos OBLIGATORIOS:
  - query (string): pregunta de búsqueda en lenguaje natural, 2-15 palabras.
Argumentos OPCIONALES:
  - max_results (1-10): default 5.
  - search_depth: "basic" (rápido) o "advanced" (más completo). Default "basic".

EJEMPLO:
<tool_call>{"name":"web_search","arguments":{"query":"best japanese restaurant Brickell Miami 2026","max_results":3}}</tool_call>`,

  web_fetch: `### web_fetch — leer contenido de una URL
Úsalo cuando ya conoces la URL exacta y quieres leer su contenido completo (artículo, blog, página de producto).
Para búsqueda en general, usa web_search primero.
Argumentos OBLIGATORIOS:
  - url (string): URL completa empezando con http:// o https://.

EJEMPLO:
<tool_call>{"name":"web_fetch","arguments":{"url":"https://example.com/articulo"}}</tool_call>`,

  send_email: `### send_email — enviar email vía Gmail
Úsalo cuando el usuario pide mandar info por email, confirmar algo, o seguir conversación por correo.
⚠️ CONFIRMA CON EL USUARIO antes de mandar (destinatario + asunto resumido).
Argumentos OBLIGATORIOS:
  - to (string): email destinatario válido.
  - subject (string): asunto, 1 línea.
  - body (string): cuerpo del email, puede ser texto o HTML.
Argumentos OPCIONALES:
  - is_html (boolean): default false.
  - cc, bcc (array de emails).

EJEMPLO:
<tool_call>{"name":"send_email","arguments":{"to":"juan@x.com","subject":"Reserva confirmada","body":"Hola, te confirmo la mesa para esta noche a las 8pm."}}</tool_call>`,

  read_emails: `### read_emails — leer inbox de Gmail
Úsalo cuando el usuario pregunta por sus emails, mensajes recientes, o quiere buscar info en su correo.
Argumentos OPCIONALES:
  - query (string): filtro estilo Gmail (ej: "from:juan@x.com", "subject:invoice").
  - max_results (1-20): default 5.
  - unread_only (boolean): default false.

EJEMPLO:
<tool_call>{"name":"read_emails","arguments":{"query":"from:stripe","max_results":5}}</tool_call>`,

  browser_action: `### browser_action — controlar browser real (Chrome cloud)
Úsalo SOLO cuando web_search/web_fetch no son suficientes (ej: contenido detrás de login, JavaScript dinámico, screenshots).
Para lectura simple, prefiere web_fetch (más rápido y barato).
Argumentos OBLIGATORIOS:
  - action: "navigate" | "screenshot" | "extract"
  - url (string): URL completa.
Argumentos OPCIONALES:
  - selector (string): CSS selector para extract.
  - wait_ms (0-15000): tiempo de espera para JS dinámico.

EJEMPLO:
<tool_call>{"name":"browser_action","arguments":{"action":"navigate","url":"https://opentable.com","wait_ms":3000}}</tool_call>`,
};

/* -------------------------------------------------------------------------- */
/*  CONSTRUCCIÓN POR INTENT                                                    */
/* -------------------------------------------------------------------------- */

interface BuildPromptArgs {
  intent: Intent;
  /** Tools que el coach puede ver según el intent (calculadas por intent-detector). */
  allowedTools: CoachToolName[];
  /** System prompts upstream del flow de /api/chat (RAG, brand, memoria, voz, asistente). */
  upstreamContext?: string;
  /** Si hay info adicional sobre la sesión (nombre del usuario, marca, etc.). */
  userContext?: { userName?: string; orgName?: string };
  /** Indica que el usuario adjuntó imagen — se inyecta nota para el coach. */
  hasAttachedImage?: boolean;
}

export function buildSystemPromptForIntent(args: BuildPromptArgs): string {
  const sections: string[] = [];

  // 1. Master prompt — siempre
  sections.push(OPERATOR_MASTER_PROMPT);

  // 2. Contexto del usuario / org si existe
  if (args.userContext?.userName || args.userContext?.orgName) {
    const lines: string[] = ['## CONTEXTO DEL USUARIO'];
    if (args.userContext.userName) lines.push(`Usuario: ${args.userContext.userName}`);
    if (args.userContext.orgName) lines.push(`Organización: ${args.userContext.orgName}`);
    sections.push(lines.join('\n'));
  }

  // 3. Upstream context (RAG, brand, memoria, voz, etc.)
  if (args.upstreamContext?.trim()) {
    sections.push(`## CONTEXTO DEL FLOW (RAG / BRAND / MEMORIA)\n${args.upstreamContext.trim()}`);
  }

  // 4. Branch específica por intent
  sections.push(buildIntentBranch(args));

  return sections.join('\n\n');
}

function buildIntentBranch(args: BuildPromptArgs): string {
  switch (args.intent) {
    case 'small_talk':
      return `## MODO ACTUAL: CONVERSACIÓN SOCIAL
El usuario está saludando o conversando casualmente. Responde con tu voz, breve, directo. NO uses tools. NO emitas <tool_call>. Una o dos frases máximo. Cierra con pregunta abierta si tiene sentido.`;

    case 'business_advice':
      return `## MODO ACTUAL: CONSEJO DE NEGOCIO
El usuario pide tu opinión, estrategia o consejo. Responde con tu voz desde tu marco mental (los 8 principios). NO uses tools. NO emitas <tool_call>. 3-8 frases. Aplica el principio relevante a su caso concreto. Sin academicismos, sin listas largas a menos que pidan framework.`;

    case 'meta':
      return `## MODO ACTUAL: PREGUNTA SOBRE TI MISMO
El usuario quiere saber qué eres o qué puedes hacer. Responde con tu voz, en 2-4 frases. Eres OperatorAI, agente IA personal de Ruben Gomez, especializado en ventas, marketing y mentalidad emprendedora, que también puede generar anuncios, imágenes, vídeos y consultar documentos. NO uses tools. NO listes capacidades como un menú — habla como un humano.`;

    case 'create_ad':
    case 'image_only':
    case 'image_edit':
    case 'video':
    case 'knowledge_query':
    case 'file_analysis':
    case 'coding_task':
    case 'brand_query':
      return buildToolBranch(args);

    case 'ambiguous':
      return `## MODO ACTUAL: ACLARACIÓN
El mensaje del usuario no está claro. Pregúntale UNA cosa concreta para saber qué necesita. NO uses tools. NO emitas <tool_call>. Una sola frase con una pregunta directa.`;

    default:
      return `## MODO ACTUAL: GENERAL
Responde con tu voz, breve y directo.`;
  }
}

function buildToolBranch(args: BuildPromptArgs): string {
  const toolBlocks = args.allowedTools
    .map((name) => TOOL_BLOCKS[name])
    .filter(Boolean)
    .join('\n\n');

  const attachedImageNote = args.hasAttachedImage
    ? `\n\nNOTA IMPORTANTE: el usuario adjuntó una imagen. Si la acción lo requiere (edición, referencia visual), pasa el contexto adecuado a la tool — la infraestructura inyectará la imagen real automáticamente.`
    : '';

  return `## MODO ACTUAL: EJECUCIÓN

Has detectado que el usuario quiere una acción ejecutable. Tu siguiente respuesta DEBE seguir esta secuencia EXACTA:

1. Una línea breve con tu voz acknowledgeando lo que vas a hacer (máx 12 palabras).
2. Salto de línea.
3. UN solo bloque <tool_call>{...}</tool_call> con la tool correcta y argumentos válidos.

Ejemplo de respuesta correcta:
"¡A la carga, brother! Voy a montar tu anuncio.

<tool_call>{"name":"create_ad","arguments":{"user_prompt":"Anuncio cuadrado para Instagram","formats":["1:1"]}}</tool_call>"

REGLAS DE ORO:
- Solo UN tool_call por respuesta.
- Solo las tools listadas abajo. NUNCA inventes nombres ni args.
- Si te falta info crítica para los args obligatorios → pregunta al usuario UNA cosa concreta y NO emitas tool_call.
- Si el usuario adjuntó imagen, considera si pasarla como reference_image_url en image, o si la tool de create_ad la usa automáticamente.

## TOOLS DISPONIBLES PARA ESTE MENSAJE

${toolBlocks}${attachedImageNote}

## DESPUÉS DE QUE LA TOOL EJECUTE
Recibirás un mensaje [TOOL_RESULT]. NO repitas URLs ni embebas imágenes — el usuario ya las vio inline. Comenta brevemente con tu voz (1-2 frases) y ofrece siguiente paso útil.`;
}

/* -------------------------------------------------------------------------- */
/*  PROMPT PARA POST-TOOL (cierre del turno con voz natural)                   */
/* -------------------------------------------------------------------------- */

/**
 * Cuando una tool termina con éxito y queremos que el coach genere un
 * comentario de cierre con su voz, usamos este prompt mínimo. Acelera la
 * latencia y evita que el coach intente llamar otra tool.
 */
export function buildPostToolPrompt(toolName: CoachToolName, success: boolean): string {
  if (!success) {
    return `${OPERATOR_MASTER_PROMPT}

## SITUACIÓN ACTUAL
La tool ${toolName} falló al ejecutarse. Comenta al usuario con tu voz, en 1-2 frases, que ha habido un problema y ofrece reintentar. NO uses tools. NO emitas <tool_call>.`;
  }

  return `${OPERATOR_MASTER_PROMPT}

## SITUACIÓN ACTUAL
La tool ${toolName} se ejecutó correctamente y el resultado YA se mostró al usuario inline (imagen/vídeo/texto). Tu trabajo ahora es UN comentario breve con tu voz (1-2 frases). 

REGLAS:
- NO repitas URLs.
- NO describas el resultado en detalle (el usuario ya lo ve).
- NO emitas otro <tool_call>.
- Cierra con una pregunta abierta o sugerencia accionable corta.

EJEMPLO si fue create_ad:
"Listo, brother. Si quieres una variante en story vertical, lo lanzamos en 1 minuto."

EJEMPLO si fue image:
"Ahí lo tienes. ¿Te ajusto algún color o probamos otro encuadre?"`;
}
