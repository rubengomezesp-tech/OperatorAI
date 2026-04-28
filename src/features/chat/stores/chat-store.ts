'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId =
  | 'gpt-4o'
  | 'claude-sonnet-4-5-20250929'
  | 'gemini-2.5-flash';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: 'openai' | 'anthropic' | 'google';
  hint: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', hint: 'Fast, versatile, great for chat and copy' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic', hint: 'Best for images, strategy, and complex tasks' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google', hint: 'Ultra-fast, multimodal, latest Google AI' },
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
