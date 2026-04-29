import { z } from 'zod';

export const imageGenerationTool = {
  name: 'generate_image',
  description: `Genera imágenes profesionales usando Flux. Úsalo cuando el usuario pida: crear imagen, diseñar visual, mockup, ad, campaña, story, logo, asset de marca, creatividad visual, producto, editorial.
  
Presets disponibles:
- product-shot: Fotografía de producto profesional, fondo limpio
- editorial: Editorial de moda/lifestyle, cinematográfico
- logo-design: Logo minimalista sobre fondo sólido
- social-media: Optimizado para Instagram/social
- architecture: Renders arquitectónicos, espacios
- startup: Tech startup aesthetic, moderno, limpio`,
  
  parameters: z.object({
    prompt: z.string().min(10).max(2000).describe('Descripción detallada de la imagen. Incluye: sujeto principal, estilo visual, colores específicos, iluminación, composición, mood. Mínimo 40 palabras para mejores resultados.'),
    preset: z.enum(['product-shot', 'editorial', 'logo-design', 'social-media', 'architecture', 'startup', 'none']).default('none').describe('Preset de estilo profesional. Usa "none" para prompt libre sin modificaciones.'),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5', '3:2']).default('1:1').describe('Relación de aspecto: 1:1 (Instagram post), 16:9 (landscape/web), 9:16 (stories/reels), 4:5 (feed vertical), 3:2 (fotografía)'),
    enhance: z.boolean().default(true).describe('Auto-mejorar el prompt con detalles profesionales (recomendado: true)')
  })
};

export type ImageGenerationParams = z.infer<typeof imageGenerationTool.parameters>;
