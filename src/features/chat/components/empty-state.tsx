'use client';

/**
 * EmptyState — ChatGPT-style minimalist
 * Suggestions appear as text rows with small icons (no cards)
 * Just above the composer
 */

import { motion } from 'framer-motion';
import { Image as ImageIcon, Pencil, Globe, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface SuggestionItem {
  icon: typeof ImageIcon;
  labelEn: string;
  labelEs: string;
  promptEn: string;
  promptEs: string;
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    icon: ImageIcon,
    labelEn: 'Create an image',
    labelEs: 'Crea una imagen',
    promptEn: 'Help me create an image for my next campaign',
    promptEs: 'Ayúdame a crear una imagen para mi próxima campaña',
  },
  {
    icon: Pencil,
    labelEn: 'Write or edit',
    labelEs: 'Escribir o editar',
    promptEn: 'I have copy I want to improve',
    promptEs: 'Tengo un copy que quiero mejorar',
  },
  {
    icon: Globe,
    labelEn: 'Search something',
    labelEs: 'Buscar algo',
    promptEn: 'Help me research something for my brand',
    promptEs: 'Ayúdame a investigar algo para mi marca',
  },
  {
    icon: Sparkles,
    labelEn: 'Launch a campaign',
    labelEs: 'Lanzar una campaña',
    promptEn: 'I want to launch a new campaign for my brand',
    promptEs: 'Quiero lanzar una campaña nueva para mi marca',
  },
];

interface EmptyStateProps {
  onSuggestion: (prompt: string) => void;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const { locale } = useI18n();
  const isEs = locale === 'es';

  return (
    <div className="flex flex-col h-full w-full">
      {/* Spacer para empujar las sugerencias hacia abajo */}
      <div className="flex-1" />

      {/* Sugerencias justo encima del composer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 pb-3 space-y-1"
      >
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              onClick={() => onSuggestion(isEs ? s.promptEs : s.promptEn)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left"
            >
              <Icon className="h-5 w-5 text-fg-muted flex-shrink-0" strokeWidth={1.6} />
              <span className="text-[15px] text-fg leading-snug">
                {isEs ? s.labelEs : s.labelEn}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
