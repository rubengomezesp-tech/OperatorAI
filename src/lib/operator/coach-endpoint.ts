import 'server-only';

const DEFAULT_OPERATOR_URL = 'http://localhost:1234';
const DEFAULT_OPERATOR_MODEL = 'operator-qwen14b';
const DEFAULT_AUTH_HEADER = 'Authorization';

export type OperatorCoachProbeStage = 'models' | 'completion' | 'network';

export interface OperatorCoachConfig {
  url: string;
  model: string;
  apiKey?: string;
  authHeader: string;
}

export interface OperatorCoachPublicConfig {
  url: string;
  model: string;
  authHeader: string;
  hasApiKey: boolean;
}

export interface OperatorCoachProbeResult {
  ok: boolean;
  config: OperatorCoachPublicConfig;
  models: string[];
  errorStage?: OperatorCoachProbeStage;
  errorMessage?: string;
}

function cleanEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getOperatorCoachConfig(): OperatorCoachConfig {
  const url = cleanEnv(process.env.OPERATOR_COACH_URL)
    ?? cleanEnv(process.env.LOCAL_OPERATOR_URL)
    ?? DEFAULT_OPERATOR_URL;
  const model = cleanEnv(process.env.OPERATOR_COACH_MODEL)
    ?? cleanEnv(process.env.LOCAL_OPERATOR_MODEL)
    ?? DEFAULT_OPERATOR_MODEL;
  const apiKey = cleanEnv(process.env.OPERATOR_COACH_API_KEY)
    ?? cleanEnv(process.env.LOCAL_OPERATOR_API_KEY);
  const authHeader = cleanEnv(process.env.OPERATOR_COACH_AUTH_HEADER) ?? DEFAULT_AUTH_HEADER;

  return {
    url: trimTrailingSlash(url),
    model,
    apiKey,
    authHeader,
  };
}

export function getOperatorCoachPublicConfig(
  config: OperatorCoachConfig = getOperatorCoachConfig(),
): OperatorCoachPublicConfig {
  return {
    url: config.url,
    model: config.model,
    authHeader: config.authHeader,
    hasApiKey: Boolean(config.apiKey),
  };
}

export function getOperatorCoachHeaders(
  config: OperatorCoachConfig = getOperatorCoachConfig(),
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers[config.authHeader] = config.authHeader.toLowerCase() === 'authorization'
      ? `Bearer ${config.apiKey}`
      : config.apiKey;
  }

  return headers;
}

async function readErrorText(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  return text.slice(0, 600);
}

export async function probeOperatorCoach(): Promise<OperatorCoachProbeResult> {
  const config = getOperatorCoachConfig();
  const publicConfig = getOperatorCoachPublicConfig(config);
  const headers = getOperatorCoachHeaders(config);

  try {
    const modelsResponse = await fetch(`${config.url}/v1/models`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000),
    });

    if (!modelsResponse.ok) {
      return {
        ok: false,
        config: publicConfig,
        models: [],
        errorStage: 'models',
        errorMessage: `Models endpoint returned HTTP ${modelsResponse.status}: ${await readErrorText(modelsResponse)}`,
      };
    }

    const modelsData = await modelsResponse.json();
    const models = Array.isArray(modelsData.data)
      ? modelsData.data.map((model: { id?: unknown }) => String(model.id ?? '')).filter(Boolean)
      : [];

    if (!models.includes(config.model)) {
      return {
        ok: false,
        config: publicConfig,
        models,
        errorStage: 'models',
        errorMessage: `Configured model "${config.model}" is not listed by ${config.url}/v1/models.`,
      };
    }

    const completionResponse = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        temperature: 0,
        stream: false,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!completionResponse.ok) {
      return {
        ok: false,
        config: publicConfig,
        models,
        errorStage: 'completion',
        errorMessage: `Completion endpoint returned HTTP ${completionResponse.status}: ${await readErrorText(completionResponse)}`,
      };
    }

    return {
      ok: true,
      config: publicConfig,
      models,
    };
  } catch (error) {
    return {
      ok: false,
      config: publicConfig,
      models: [],
      errorStage: 'network',
      errorMessage: error instanceof Error ? error.message : 'Unknown network error.',
    };
  }
}
