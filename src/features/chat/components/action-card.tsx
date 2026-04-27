'use client';

/**
 * ActionCard — Premium CTA shown in agent messages when intent
 * to generate a full campaign is detected.
 *
 * Renders as an inline card after the agent's text response.
 * Tap → navigate to /campaigns/new with prefilled context.
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ActionCardProps {
  /** Pre-extracted context from the conversation to seed the campaign brief */
  contextPrompt?: string;
}

export function ActionCard({ contextPrompt }: ActionCardProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const isEs = locale === 'es';

  function handleTap() {
    if (contextPrompt) {
      // Persist context for the campaign intake form to pick up
      try {
        sessionStorage.setItem('agentCampaignContext', contextPrompt);
      } catch {
        // ignore
      }
    }
    router.push('/campaigns/new');
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleTap}
      className="mt-3 w-full max-w-md group flex items-center gap-3 p-3.5 rounded-lg bg-gradient-to-br from-gold/10 via-surface-2 to-surface-2 border border-gold/30 hover:border-gold/60 transition-colors text-left"
    >
      <div className="h-10 w-10 rounded-md bg-gold/15 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-5 w-5 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium text-fg leading-tight">
          {isEs ? 'Generar campaña completa' : 'Generate full campaign'}
        </div>
        <div className="text-[12px] text-fg-muted mt-0.5 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {isEs
            ? 'Estrategia + 4 visuales · ~5 min'
            : 'Strategy + 4 visuals · ~5 min'}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-fg-muted group-hover:text-gold group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </motion.button>
  );
}
