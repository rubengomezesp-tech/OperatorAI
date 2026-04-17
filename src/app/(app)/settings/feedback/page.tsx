'use client';
import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Heart, Flag, Loader2, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  feedback_type: string;
  message_preview: string | null;
  comment: string | null;
  created_at: string;
}

const typeIcon: Record<string, { icon: typeof ThumbsUp; color: string; label_en: string; label_es: string }> = {
  up: { icon: ThumbsUp, color: 'text-emerald-400', label_en: 'Good', label_es: 'Buena' },
  down: { icon: ThumbsDown, color: 'text-red-400', label_en: 'Bad', label_es: 'Mala' },
  heart: { icon: Heart, color: 'text-pink-400', label_en: 'Loved', label_es: 'Favorita' },
  report: { icon: Flag, color: 'text-orange-400', label_en: 'Report', label_es: 'Reporte' },
};

export default function FeedbackPage() {
  const { locale } = useI18n();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/feedback/list')
      .then(r => r.json())
      .then(data => setItems(data.feedback ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.feedback_type === filter);

  const counts = {
    all: items.length,
    up: items.filter(i => i.feedback_type === 'up').length,
    down: items.filter(i => i.feedback_type === 'down').length,
    heart: items.filter(i => i.feedback_type === 'heart').length,
    report: items.filter(i => i.feedback_type === 'report').length,
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[860px] w-full mx-auto space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{locale === 'es' ? 'Panel de control' : 'Control panel'}</div>
        <h1 className="font-display text-[32px]">{locale === 'es' ? 'Feedback' : 'Feedback'}</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">{locale === 'es' ? 'Reacciones y reportes de los usuarios.' : 'User reactions and reports.'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { key: 'all', label: locale === 'es' ? 'Total' : 'All', icon: null, color: 'text-fg' },
          { key: 'up', label: '👍', icon: ThumbsUp, color: 'text-emerald-400' },
          { key: 'down', label: '👎', icon: ThumbsDown, color: 'text-red-400' },
          { key: 'heart', label: '❤️', icon: Heart, color: 'text-pink-400' },
          { key: 'report', label: '🚩', icon: Flag, color: 'text-orange-400' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={cn(
              'rounded-lg border p-3 text-center transition-all',
              filter === s.key ? 'border-gold/40 bg-gold/5' : 'border-border bg-surface hover:border-gold/20',
            )}
          >
            <div className={cn('text-[22px] font-display', s.color)}>
              {counts[s.key as keyof typeof counts]}
            </div>
            <div className="text-[11px] text-fg-muted mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 text-gold animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-12 text-center">
          <p className="text-[13.5px] text-fg-muted">{locale === 'es' ? 'Sin feedback aún' : 'No feedback yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const tc = typeIcon[item.feedback_type];
            const Icon = tc?.icon ?? Flag;
            return (
              <div key={item.id} className={cn(
                'rounded-lg border p-4 flex items-start gap-3',
                item.feedback_type === 'report' ? 'border-orange-500/20 bg-orange-500/5' : 'border-border bg-surface',
              )}>
                <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                  item.feedback_type === 'up' ? 'bg-emerald-500/15' :
                  item.feedback_type === 'down' ? 'bg-red-500/15' :
                  item.feedback_type === 'heart' ? 'bg-pink-500/15' :
                  'bg-orange-500/15'
                )}>
                  <Icon className={cn('h-3.5 w-3.5', tc?.color ?? 'text-fg-muted')} />
                </div>
                <div className="flex-1 min-w-0">
                  {item.message_preview && (
                    <p className="text-[13px] text-fg-soft line-clamp-2 mb-1">{item.message_preview}</p>
                  )}
                  {item.comment && (
                    <div className="rounded-md bg-surface-2 border border-border px-3 py-2 mt-1">
                      <p className="text-[12.5px] text-fg-muted italic">{item.comment}</p>
                    </div>
                  )}
                  <span className="text-[10.5px] text-fg-subtle mt-1 block">
                    {new Date(item.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
