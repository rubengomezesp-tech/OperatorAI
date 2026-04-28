import type { VerticalConfig } from '../../types';

export const CONTENT_VERTICAL: VerticalConfig = {
  id: 'content',
  label: { en: 'Content', es: 'Contenido' },
  triggers: [
    'reel', 'reels', 'tiktok',
    'post', 'instagram',
    'ad', 'ads', 'anuncio', 'campaña',
    'hook', 'guion', 'script',
    'caption', 'copy',
  ],
  subramas: {
    reel_creation: {
      id: 'reel_creation',
      label: { en: 'Reel creation', es: 'Crear reel' },
      triggers: ['reel', 'reels', 'tiktok', 'video corto'],
      required_inputs: [
        { key: 'topic', label: { en: 'Topic', es: 'Tema' }, type: 'text', required: true },
        {
          key: 'tone',
          label: { en: 'Tone', es: 'Tono' },
          type: 'select',
          required: true,
          options: [
            { value: 'educational', label: { en: 'Educational', es: 'Educativo' } },
            { value: 'inspirational', label: { en: 'Inspirational', es: 'Inspiracional' } },
            { value: 'funny', label: { en: 'Funny', es: 'Divertido' } },
          ],
        },
      ],
      questions: [],
      workflow_steps: ['detect_missing_inputs', 'ask_questions', 'generate'],
      tools: ['text_generator'],
    },
    ad_creation: {
      id: 'ad_creation',
      label: { en: 'Ad creation', es: 'Crear anuncio' },
      triggers: ['ad', 'ads', 'anuncio', 'campaña'],
      required_inputs: [
        { key: 'product', label: { en: 'Product', es: 'Producto' }, type: 'text', required: true },
        { key: 'platform', label: { en: 'Platform', es: 'Plataforma' }, type: 'select', required: true, options: [] },
      ],
      questions: [],
      workflow_steps: ['detect_missing_inputs', 'ask_questions', 'generate', 'iterate'],
      tools: ['campaign_generator', 'image_generator'],
    },
  },
};
