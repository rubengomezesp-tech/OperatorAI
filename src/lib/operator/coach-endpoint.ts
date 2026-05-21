export interface OperatorCoachConfig {
  url: string;
  model: string;
  apiKey: string;
  authHeader: string;
  timeoutMs: number;
}

export interface OperatorCoachProbe {
  ok: boolean;
  config: OperatorCoachConfig;
  models?: string[];
  errorStage?: 'models' | 'model' | 'completion' | 'network';
  errorMessage?: string;
}

interface ModelsResponse {
  data?: Array<{ id?: string }>;
}

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function authHeaderValue(config: OperatorCoachConfig): string | null {
  if (!config.apiKey) return null;
  if (config.authHeader.toLowerCase() !== 'authorization') return config.apiKey;
  if (/^(bearer|basic)\s+/i.test(config.apiKey)) return config.apiKey;
  return `Bearer ${config.apiKey}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function responsePreview(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  return text ? text.slice(0, 280) : response.statusText;
}

export function getOperatorCoachConfig(): OperatorCoachConfig {
  return {
    url: normalizeUrl(
      readEnv('OPERATOR_COACH_URL')
        || readEnv('LOCAL_OPERATOR_URL')
        || 'http://localhost:1234',
    ),
    model:
      readEnv('OPERATOR_COACH_MODEL')
      || readEnv('LOCAL_OPERATOR_MODEL')
      || 'operator-qwen14b-v6',
    apiKey:
      readEnv('OPERATOR_COACH_API_KEY')
      || readEnv('OPERATOR_COACH_PROXY_TOKEN')
      || readEnv('LOCAL_OPERATOR_API_KEY'),
    authHeader: readEnv('OPERATOR_COACH_AUTH_HEADER') || 'Authorization',
    timeoutMs: Number(readEnv('OPERATOR_COACH_TIMEOUT_MS') || 45_000),
  };
}

export function getOperatorCoachHeaders(
  config: OperatorCoachConfig = getOperatorCoachConfig(),
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = authHeaderValue(config);
  if (auth) headers[config.authHeader] = auth;
  return headers;
}

export function getOperatorCoachPublicConfig() {
  const config = getOperatorCoachConfig();
  return {
    url: config.url,
    model: config.model,
    authHeader: config.authHeader,
    hasApiKey: Boolean(config.apiKey),
  };
}

export async function probeOperatorCoach(): Promise<OperatorCoachProbe> {
  const config = getOperatorCoachConfig();
  const headers = getOperatorCoachHeaders(config);
  let models: string[] | undefined;

  try {
    const modelsResponse = await fetch(`${config.url}/v1/models`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!modelsResponse.ok) {
      return {
        ok: false,
        config,
        errorStage: 'models',
        errorMessage: `GET /v1/models returned ${modelsResponse.status}: ${await responsePreview(modelsResponse)}`,
      };
    }

    const modelsJson = (await modelsResponse.json().catch(() => ({}))) as ModelsResponse;
    models = modelsJson.data
      ?.map((model) => model.id)
      .filter((id): id is string => Boolean(id));

    if (models?.length && !models.includes(config.model)) {
      return {
        ok: false,
        config,
        models,
        errorStage: 'model',
        errorMessage: `Model ${config.model} is not listed by the coach endpoint.`,
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
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!completionResponse.ok) {
      return {
        ok: false,
        config,
        models,
        errorStage: 'completion',
        errorMessage: `POST /v1/chat/completions returned ${completionResponse.status}: ${await responsePreview(completionResponse)}`,
      };
    }

    return { ok: true, config, models };
  } catch (error) {
    return {
      ok: false,
      config,
      models,
      errorStage: 'network',
      errorMessage: errorMessage(error),
    };
  }
}
