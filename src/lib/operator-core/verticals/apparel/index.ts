import type { VerticalConfig } from '../../types';

export const APPAREL_VERTICAL: VerticalConfig = {
  id: 'apparel',
  label: { en: 'Apparel', es: 'Ropa' },
  triggers: [
    'camiseta', 'tshirt', 't-shirt', 'tee',
    'hoodie', 'sudadera',
    'tracksuit', 'chándal',
    'ropa', 'clothing', 'garment', 'apparel',
    'prenda', 'gym wear', 'streetwear',
  ],
  subramas: {
    tshirt_design: {
      id: 'tshirt_design',
      label: { en: 'T-shirt design', es: 'Diseño camiseta' },
      triggers: ['camiseta', 'tshirt', 't-shirt', 'tee'],
      required_inputs: [
        {
          key: 'color',
          label: { en: 'Color', es: 'Color' },
          type: 'color',
          required: true,
        },
        {
          key: 'fit',
          label: { en: 'Fit', es: 'Ajuste' },
          type: 'select',
          required: true,
          options: [
            { value: 'oversized', label: { en: 'Oversized', es: 'Oversized' } },
            { value: 'regular', label: { en: 'Regular', es: 'Regular' } },
            { value: 'fitted', label: { en: 'Fitted', es: 'Ajustada' } },
          ],
        },
        {
          key: 'style',
          label: { en: 'Style', es: 'Estilo' },
          type: 'select',
          required: true,
          options: [
            { value: 'streetwear', label: { en: 'Streetwear', es: 'Streetwear' } },
            { value: 'minimal', label: { en: 'Minimal', es: 'Minimalista' } },
            { value: 'luxury', label: { en: 'Luxury', es: 'Lujo' } },
            { value: 'sport', label: { en: 'Sport', es: 'Deportivo' } },
          ],
        },
        {
          key: 'logo',
          label: { en: 'Logo / Graphic', es: 'Logo / Gráfico' },
          type: 'image',
          required: false,
        },
      ],
      questions: [
        {
          key: 'style',
          question: {
            en: 'What style fits your brand?',
            es: '¿Qué estilo encaja con tu marca?',
          },
          inputType: 'select',
          options: [
            { value: 'streetwear', label: { en: 'Streetwear', es: 'Streetwear' } },
            { value: 'minimal', label: { en: 'Minimal', es: 'Minimalista' } },
            { value: 'luxury', label: { en: 'Luxury', es: 'Lujo' } },
          ],
        },
        {
          key: 'color',
          question: {
            en: 'Main color?',
            es: '¿Color principal?',
          },
          inputType: 'color',
        },
        {
          key: 'fit',
          question: {
            en: 'Fit?',
            es: '¿Ajuste?',
          },
          inputType: 'select',
          options: [
            { value: 'oversized', label: { en: 'Oversized', es: 'Oversized' } },
            { value: 'regular', label: { en: 'Regular', es: 'Regular' } },
            { value: 'fitted', label: { en: 'Fitted', es: 'Ajustada' } },
          ],
        },
      ],
      workflow_steps: [
        'detect_missing_inputs',
        'ask_questions',
        'request_assets',
        'generate',
        'iterate',
      ],
      tools: ['image_generator', 'style_engine'],
    },
    hoodie_design: {
      id: 'hoodie_design',
      label: { en: 'Hoodie design', es: 'Diseño hoodie' },
      triggers: ['hoodie', 'sudadera'],
      required_inputs: [
        { key: 'color', label: { en: 'Color', es: 'Color' }, type: 'color', required: true },
        {
          key: 'style',
          label: { en: 'Style', es: 'Estilo' },
          type: 'select',
          required: true,
          options: [
            { value: 'streetwear', label: { en: 'Streetwear', es: 'Streetwear' } },
            { value: 'minimal', label: { en: 'Minimal', es: 'Minimalista' } },
            { value: 'oversized', label: { en: 'Oversized', es: 'Oversized' } },
          ],
        },
        { key: 'logo', label: { en: 'Logo', es: 'Logo' }, type: 'image', required: false },
      ],
      questions: [],
      workflow_steps: ['detect_missing_inputs', 'ask_questions', 'generate', 'iterate'],
      tools: ['image_generator', 'style_engine'],
    },
  },
};
