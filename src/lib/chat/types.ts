export type UiMessageRole = 'user' | 'assistant';

export type ToolKind = 'image' | 'video' | 'file_analysis' | 'knowledge_search';
export type ToolStatus = 'running' | 'done' | 'failed';

export interface ToolPart {
  id: string;
  kind: ToolKind;
  status: ToolStatus;
  input: Record<string, unknown>;
  result?: {
    urls?: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
    text?: string;
    sources?: Array<{ title: string; id: string }>;
  };
  error?: string;
  attachmentUrls?: string[];
  createdAt: string;
}

export interface UiMessage {
  id: string;
  role: UiMessageRole;
  content: string;
  createdAt: string;
  status?: 'streaming' | 'complete' | 'failed';
  error?: string;
  attachmentUrls?: string[];
  /** Tool invocations attached to this assistant message, in order. */
  toolParts?: ToolPart[];
  /** Modelo que generó la respuesta (solo en assistant messages). */
  model?: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  last_message_at: string | null;
  message_count: number;
  is_starred: boolean;
}
