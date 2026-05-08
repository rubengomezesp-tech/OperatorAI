'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId =
  | 'operator-coach'
  | 'gpt-5.4'
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-5-20250929'
  | 'gemini-3.1-pro';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: 'openai' | 'anthropic' | 'google' | 'operator';
  hint: string;
  /** Marca de agente propio fine-tuned (solo OperatorAI Coach) */
  isOperator?: boolean;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'operator-coach',
    label: 'OperatorAI',
    provider: 'operator',
    hint: 'Tu agente entrenado — voz propia, conocimiento de negocio, gratis y local',
    isOperator: true,
  },
  { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', provider: 'anthropic', hint: 'Most intelligent — best for strategy, creative direction, complex reasoning' },
  { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'openai', hint: 'OpenAI flagship — versatile, fast, great for varied tasks' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic', hint: 'Balanced — fast and reliable for everyday work' },
  { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', provider: 'google', hint: 'Multimodal — excellent vision and long context' },
];

interface ChatState {
  selectedModel: ModelId;
  setModel: (id: ModelId) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedModel: 'operator-coach',
      setModel: (id) => set({ selectedModel: id }),
    }),
    { name: 'operator.chat' },
  ),
);
