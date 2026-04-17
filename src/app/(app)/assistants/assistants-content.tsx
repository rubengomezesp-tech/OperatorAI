'use client';
import Link from 'next/link';
import { Plus, Sparkles, Pencil, BadgeCheck } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface Assistant {
  id: string;
  name: string;
  business_name: string;
  is_default: boolean;
  industry: string | null;
  tone: string[] | null;
  audience: string | null;
}

export function AssistantsContent({ assistants }: { assistants: Assistant[] }) {
  const { t } = useI18n();
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('assistants.kicker')}</div>
          <h1 className="font-display text-[32px]">{t('assistants.title')}</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5">{t('assistants.subtitle')}</p>
        </div>
        <Link href="/setup-assistant">
          <Button size="md" variant="outline">
            <Plus className="h-4 w-4" />
            <span>{t('assistants.new')}</span>
          </Button>
        </Link>
      </div>

      {assistants.length === 0 && (
        <Card>
          <CardBody className="text-center py-16">
            <Sparkles className="h-10 w-10 text-gold mx-auto mb-4" />
            <h3 className="font-display text-[20px] mb-2">{t('assistants.none_title')}</h3>
            <p className="text-[13.5px] text-fg-muted mb-5">{t('assistants.none_desc')}</p>
            <Link href="/setup-assistant">
              <Button size="md">{t('assistants.create')}</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {assistants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assistants.map((a) => (
            <Card key={a.id}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-md shrink-0 gold-grad flex items-center justify-center">
                      <span className="font-display text-[17px] text-bg leading-none">O</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-[17px] truncate">{a.name}</h3>
                        {a.is_default && (
                          <span className="inline-flex items-center gap-1 px-1.5 h-4 rounded text-[9.5px] tracking-[0.12em] uppercase bg-gold/15 text-gold">
                            <BadgeCheck className="h-2.5 w-2.5" />
                            {t('assistants.default')}
                          </span>
                        )}
                      </div>
                      <div className="text-[12.5px] text-fg-muted truncate">{a.business_name}</div>
                    </div>
                  </div>
                  <Link href={'/assistants/' + a.id + '/edit'}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                      <span>{t('assistants.edit')}</span>
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {a.industry && (
                    <div className="text-[12.5px]">
                      <span className="text-fg-subtle">{t('assistants.industry')}</span>
                      <span className="ml-2 text-fg-soft">{a.industry}</span>
                    </div>
                  )}
                  {a.tone && a.tone.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.tone.slice(0, 5).map((t_val) => (
                        <span key={t_val} className="h-5 px-2 rounded bg-surface-3 border border-border text-[10.5px] text-fg-muted uppercase tracking-[0.08em] flex items-center">
                          {t_val}
                        </span>
                      ))}
                      {a.tone.length > 5 && (
                        <span className="h-5 px-2 text-[10.5px] text-fg-subtle uppercase tracking-[0.08em] flex items-center">
                          +{a.tone.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                  {a.audience && (
                    <p className="text-[12.5px] text-fg-muted leading-relaxed line-clamp-2">{a.audience}</p>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
