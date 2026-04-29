'use client';

/**
 * EmptyState — Hero shown when conversation is empty.
 *
 * The first impression of the app. Mobile-first.
 * Big greeting, suggestion chips, no clutter.
 */

import { motion } from 'framer-motion';
import { Sparkles, Target, MessageSquare, Lightbulb } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Aurora } from '@/components/ui/aurora';

interface SuggestionChip {
  icon: typeof Sparkles;
  labelEn: string;
  labelEs: string;
  promptEn: string;
  promptEs: string;
}

const SUGGESTIONS: SuggestionChip[] = [
  {
    icon: Target,
    labelEn: 'Launch a campaign',
    labelEs: 'Lanzar una campaña',
    promptEn: 'I want to launch a new campaign for my brand. Help me plan it.',
    promptEs: 'Quiero lanzar una campaña nueva para mi marca. Ayúdame a planearla.',
  },
  {
    icon: Lightbulb,
    labelEn: 'Content ideas this week',
    labelEs: 'Ideas de contenido esta semana',
    promptEn: 'Give me 5 content ideas for Instagram this week.',
    promptEs: 'Dame 5 ideas de contenido para Instagram esta semana.',
  },
  {
    icon: MessageSquare,
    labelEn: 'Improve my hook',
    labelEs: 'Mejorar mi hook',
    promptEn: 'I have a hook I want to improve. Can you help me rewrite it stronger?',
    promptEs: 'Tengo un hook que quiero mejorar. ¿Puedes ayudarme a reescribirlo más fuerte?',
  },
  {
    icon: Sparkles,
    labelEn: 'Audience analysis',
    labelEs: 'Análisis de audiencia',
    promptEn: 'Help me understand my target audience better.',
    promptEs: 'Ayúdame a entender mejor a mi audiencia objetivo.',
  },
];

interface EmptyStateProps {
  /** Called with the suggestion's prompt text when user clicks a chip */
  onSuggestion: (prompt: string) => void;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const { locale } = useI18n();
  const isEs = locale === 'es';

  const greeting = isEs ? '¿En qué estamos hoy?' : 'What do we build today?';
  const subtitle = isEs
    ? 'Estrategia, ideas, campañas completas. Solo dime.'
    : 'Strategy, ideas, full campaigns. Just tell me.';

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full px-4">
      {/* Subtle aurora behind */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <Aurora intensity="subtle" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 max-w-3xl w-full text-center space-y-8 px-4"
      >
        {/* Greeting */}
        <motion.div variants={fadeUp} className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl text-fg leading-tight tracking-tight">
            {greeting}
          </h1>
          <p className="text-fg-muted text-[15px] sm:text-base">{subtitle}</p>
        </motion.div>

        {/* Suggestion chips */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto"
        >
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={i}
                onClick={() => onSuggestion(isEs ? s.promptEs : s.promptEn)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-2 border border-border hover:border-gold/40 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-md bg-surface-3 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors">
                  <Icon className="h-4 w-4 text-fg-muted group-hover:text-gold transition-colors" />
                </div>
                <span className="text-[13.5px] text-fg-soft group-hover:text-fg leading-snug">
                  {isEs ? s.labelEs : s.labelEn}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
