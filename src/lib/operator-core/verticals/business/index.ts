import type { VerticalConfig } from '../../types';

export const BUSINESS_VERTICAL: VerticalConfig = {
  id: 'business',
  label: { en: 'Business', es: 'Negocio' },
  triggers: [
    'servicio', 'service',
    'consultoría', 'consulting',
    'agencia', 'agency',
    'restaurante', 'restaurant',
    'hotel', 'spa',
  ],
  subramas: {
    service_offering: {
      id: 'service_offering',
      label: { en: 'Service offering', es: 'Oferta de servicio' },
      triggers: ['servicio', 'service', 'consultoría'],
      required_inputs: [
        { key: 'service_type', label: { en: 'Service type', es: 'Tipo de servicio' }, type: 'text', required: true },
      ],
      questions: [],
      workflow_steps: ['detect_missing_inputs', 'ask_questions', 'generate'],
      tools: ['text_generator'],
    },
  },
};
