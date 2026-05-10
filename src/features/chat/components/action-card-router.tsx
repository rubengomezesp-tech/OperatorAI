'use client';

/**
 * 🎬 ACTION CARD ROUTER
 *
 * Recibe el result de un tool integration y decide qué card renderizar.
 * Usado dentro de ToolResult cuando part.result.__action_pending__ === true.
 */

import { useCallback } from 'react';
import { EmailPreviewCard } from './email-preview-card';
import { CalendarEventCard } from './calendar-event-card';
import { SlackMessageCard } from './slack-message-card';

interface PendingAction {
  __action_pending__: true;
  kind: 'email' | 'calendar' | 'slack';
  preview: Record<string, unknown>;
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface Props {
  action: PendingAction;
}

async function executePending(toolName: string, toolInput: Record<string, unknown>) {
  const res = await fetch('/api/integrations/execute-pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool_name: toolName, tool_input: toolInput }),
  });
  const body = await res.json();
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? `Failed (${res.status})`);
  }
  return body.result;
}

export function ActionCardRouter({ action }: Props) {
  const { kind, preview, tool_name, tool_input } = action;

  const handleSendEmail = useCallback(
    async (overrides?: { to?: string; subject?: string; body?: string }) => {
      const finalInput = {
        ...tool_input,
        ...(overrides?.to ? { recipient_email: overrides.to } : {}),
        ...(overrides?.subject ? { subject: overrides.subject } : {}),
        ...(overrides?.body ? { body: overrides.body } : {}),
      };
      await executePending(tool_name, finalInput);
    },
    [tool_name, tool_input],
  );

  const handleConfirmEvent = useCallback(
    async (overrides?: Record<string, unknown>) => {
      const finalInput = {
        ...tool_input,
        ...(overrides?.summary ? { summary: overrides.summary } : {}),
        ...(overrides?.startDatetime ? { start_datetime: overrides.startDatetime } : {}),
        ...(overrides?.endDatetime ? { end_datetime: overrides.endDatetime } : {}),
        ...(overrides?.location ? { location: overrides.location } : {}),
      };
      await executePending(tool_name, finalInput);
    },
    [tool_name, tool_input],
  );

  const handleSendSlack = useCallback(
    async (overrides?: { channel?: string; text?: string }) => {
      const finalInput = {
        ...tool_input,
        ...(overrides?.channel ? { channel: overrides.channel } : {}),
        ...(overrides?.text ? { text: overrides.text } : {}),
      };
      await executePending(tool_name, finalInput);
    },
    [tool_name, tool_input],
  );

  if (kind === 'email') {
    return (
      <EmailPreviewCard
        to={(preview.to as string) ?? ''}
        subject={(preview.subject as string) ?? ''}
        body={(preview.body as string) ?? ''}
        onSend={handleSendEmail}
      />
    );
  }

  if (kind === 'calendar') {
    return (
      <CalendarEventCard
        summary={(preview.summary as string) ?? ''}
        description={preview.description as string | undefined}
        startDatetime={(preview.start_datetime as string) ?? ''}
        endDatetime={(preview.end_datetime as string) ?? ''}
        attendees={preview.attendees as string[] | undefined}
        location={preview.location as string | undefined}
        onConfirm={handleConfirmEvent}
      />
    );
  }

  if (kind === 'slack') {
    return (
      <SlackMessageCard
        channel={(preview.channel as string) ?? ''}
        text={(preview.text as string) ?? ''}
        onSend={handleSendSlack}
      />
    );
  }

  return null;
}
