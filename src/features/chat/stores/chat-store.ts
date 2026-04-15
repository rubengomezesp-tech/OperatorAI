'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId = 'gpt-4o' | 'claude-3-5-sonnet-latest';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: 'openai' | 'anthropic';
  hint: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', hint: 'Fast, reliable, general-purpose' },
  { id: 'claude-3-5-sonnet-latest', label: 'Claude Sonnet 3.5', provider: 'anthropic', hint: 'Nuanced reasoning, longer outputs' },
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
