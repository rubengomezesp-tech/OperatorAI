'use client';

import { useState } from 'react';
import { Zap, Thermometer, FileText, Sparkles, Target, Scale, Save, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MODELS = [
  { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', provider: 'Anthropic', hint: 'Best for strategy & creative direction' },
  { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'OpenAI', hint: 'Versatile, fast, great for varied tasks' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'Anthropic', hint: 'Balanced — fast and reliable' },
  { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', provider: 'Google', hint: 'Multimodal — excellent vision & long context' },
];

interface ChatBehaviorConfig {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  behaviorPreset: 'creative' | 'precise' | 'balanced';
}

const BEHAVIOR_PRESETS = {
  creative: {
    label: 'Creative',
    icon: Sparkles,
    desc: 'More variety and unexpected angles. Higher temperature.',
    temperature: 0.9,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  precise: {
    label: 'Precise',
    icon: Target,
    desc: 'Focused, factual, consistent output. Lower temperature.',
    temperature: 0.3,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  balanced: {
    label: 'Balanced',
    icon: Scale,
    desc: 'Good mix of creativity and reliability.',
    temperature: 0.7,
    color: 'text-gold',
    bg: 'bg-gold/10',
  },
};

const DEFAULT_CONFIG: ChatBehaviorConfig = {
  defaultModel: 'claude-opus-4-7',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: '',
  behaviorPreset: 'balanced',
};

export function ChatBehaviorPanel() {
  const [config, setConfig] = useState<ChatBehaviorConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar config existente
  useState(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setConfig({
            defaultModel: data.settings.default_model || DEFAULT_CONFIG.defaultModel,
            temperature: data.settings.chat_temperature ?? DEFAULT_CONFIG.temperature,
            maxTokens: data.settings.chat_max_tokens || DEFAULT_CONFIG.maxTokens,
            systemPrompt: data.settings.chat_system_prompt || '',
            behaviorPreset: data.settings.chat_behavior || 'balanced',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_model: config.defaultModel,
          chat_temperature: config.temperature,
          chat_max_tokens: config.maxTokens,
          chat_system_prompt: config.systemPrompt,
          chat_behavior: config.behaviorPreset,
        }),
      });
      if (res.ok) {
        toast.success('Chat behavior saved');
      } else {
        throw new Error('Save failed');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(preset: 'creative' | 'precise' | 'balanced') {
    const p = BEHAVIOR_PRESETS[preset];
    setConfig(prev => ({
      ...prev,
      behaviorPreset: preset,
      temperature: p.temperature,
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] tracking-tight mb-1">Chat Behavior</h2>
        <p className="text-[13px] text-fg-muted">
          Configure how the AI agent behaves, which model it uses, and how creative or precise it is.
        </p>
      </div>

      {/* Behavior Presets */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(BEHAVIOR_PRESETS) as [keyof typeof BEHAVIOR_PRESETS, typeof BEHAVIOR_PRESETS['creative']][]).map(([key, preset]) => {
          const Icon = preset.icon;
          const isActive = config.behaviorPreset === key;
          return (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                isActive
                  ? 'border-gold/30 bg-gold/5 ring-1 ring-gold/20'
                  : 'border-border bg-surface-2 hover:border-gold/20'
              )}
            >
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center mb-3', preset.bg)}>
                <Icon className={cn('h-4 w-4', preset.color)} />
              </div>
              <div className={cn('text-[14px] font-display', isActive ? 'text-gold' : 'text-fg')}>{preset.label}</div>
              <div className="text-[11px] text-fg-muted mt-1">{preset.desc}</div>
              <div className="text-[10px] text-fg-subtle mt-2">Temperature: {preset.temperature}</div>
            </button>
          );
        })}
      </div>

      {/* Default Model */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-gold" />
          </div>
          <div>
            <div className="font-display text-[15px]">Default Model</div>
            <div className="text-[11px] text-fg-muted">The AI model used for new conversations</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setConfig(prev => ({ ...prev, defaultModel: model.id }))}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                config.defaultModel === model.id
                  ? 'border-gold/30 bg-gold/5'
                  : 'border-border bg-surface-3 hover:border-gold/20'
              )}
            >
              <div className="text-[13px] font-medium text-fg">{model.label}</div>
              <div className="text-[10px] text-fg-subtle uppercase mt-0.5">{model.provider}</div>
              <div className="text-[11px] text-fg-muted mt-1">{model.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature & Max Tokens */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Thermometer className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <div className="font-display text-[15px]">Temperature</div>
              <div className="text-[11px] text-fg-muted">Creativity level (0-2)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="flex-1 accent-gold"
            />
            <span className="text-[18px] font-display text-gold w-10 text-center">{config.temperature}</span>
          </div>
          <div className="flex justify-between text-[10px] text-fg-subtle mt-1">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="font-display text-[15px]">Max Tokens</div>
              <div className="text-[11px] text-fg-muted">Maximum response length</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="512"
              max="8192"
              step="512"
              value={config.maxTokens}
              onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
              className="flex-1 accent-gold"
            />
            <span className="text-[16px] font-display text-gold w-14 text-center">{config.maxTokens}</span>
          </div>
          <div className="flex justify-between text-[10px] text-fg-subtle mt-1">
            <span>512</span>
            <span>8192</span>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FileText className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-display text-[15px]">System Prompt</div>
            <div className="text-[11px] text-fg-muted">Custom instructions injected at the start of every chat (optional)</div>
          </div>
        </div>
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
          placeholder="You are Operator AI, a creative marketing agent..."
          rows={5}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface-3 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none font-mono"
        />
        <p className="text-[10px] text-fg-subtle mt-2">
          Leave empty to use the default Operator AI system prompt.
        </p>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full h-11 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        <span>{saving ? 'Saving...' : 'Save Chat Behavior'}</span>
      </button>
    </div>
  );
}
