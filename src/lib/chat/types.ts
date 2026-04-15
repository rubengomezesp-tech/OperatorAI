export type UiMessageRole = 'user' | 'assistant';

export interface UiMessage {
  id: string;
  role: UiMessageRole;
  content: string;
  createdAt: string;
  status?: 'streaming' | 'complete' | 'failed';
  error?: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  last_message_at: string | null;
  message_count: number;
  is_starred: boolean;
}
