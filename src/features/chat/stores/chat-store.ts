'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId =
  | 'gpt-4o'
  | 'claude-sonnet-4-5-20250929'
  | 'gemini-3.1-pro-preview';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: 'openai' | 'anthropic' | 'google';
  hint: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', hint: 'Fast, reliable, general-purpose' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic', hint: 'Industry-leading reasoning and agentic work' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'google', hint: 'Deep reasoning, 1M context, multimodal' },
];

interface ChatState {
  selectedModel: ModelId;
  setModel: (id: ModelId) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedModel: 'gpt-4o',
      setModel: (id) => set({ selectedModel: id }),
    }),
    { name: 'operator.chat' },
  ),
);
