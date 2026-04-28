import type { VerticalConfig } from '../../types';

export const PRODUCT_VERTICAL: VerticalConfig = {
  id: 'product',
  label: { en: 'Product', es: 'Producto' },
  triggers: [
    'producto', 'product', 'lanzamiento',
    'packaging', 'envase',
    'naming', 'nombre',
  ],
  subramas: {
    packaging_design: {
      id: 'packaging_design',
      label: { en: 'Packaging', es: 'Packaging' },
      triggers: ['packaging', 'envase', 'caja', 'box'],
      required_inputs: [
        { key: 'product_type', label: { en: 'Product type', es: 'Tipo de producto' }, type: 'text', required: true },
        { key: 'aesthetic', label: { en: 'Aesthetic', es: 'Estética' }, type: 'select', required: true, options: [] },
      ],
      questions: [],
      workflow_steps: ['detect_missing_inputs', 'ask_questions', 'generate'],
      tools: ['image_generator'],
    },
  },
};
