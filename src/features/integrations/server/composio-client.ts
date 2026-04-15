import 'server-only';
import { serverEnv } from '@/lib/env';

const COMPOSIO_BASE = 'https://backend.composio.dev/api/v1';

export interface ComposioConnection {
  connectedAccountId: string;
  redirectUrl: string;
}

export interface ComposioToolResult {
  successful: boolean;
  data?: unknown;
  error?: string;
}

function getApiKey(): string | null {
  const key = (serverEnv as unknown as Record<string, string | undefined>).COMPOSIO_API_KEY;
  return key ?? null;
}

async function composioFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error('COMPOSIO_API_KEY not configured');

  const res = await fetch(COMPOSIO_BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': key,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Composio ' + res.status + ': ' + text.slice(0, 200));
  }
  return (await res.json()) as T;
}

/**
 * Initiate OAuth connection for a provider.
 * Returns redirect URL the user must visit to authorize.
 */
export async function initiateConnection(params: {
  entityId: string;
  appName: string;
  redirectUrl: string;
}): Promise<ComposioConnection> {
  type InitResp = {
    connectionStatus: string;
    connectedAccountId: string;
    redirectUrl: string;
  };

  const result = await composioFetch<InitResp>('/connectedAccounts', {
    method: 'POST',
    body: JSON.stringify({
      entityId: params.entityId,
      appName: params.appName.toLowerCase(),
      redirectUri: params.redirectUrl,
    }),
  });

  return {
    connectedAccountId: result.connectedAccountId,
    redirectUrl: result.redirectUrl,
  };
}

/**
 * Check connection status.
 */
export async function getConnectionStatus(connectionId: string): Promise<{
  status: string;
  appName: string;
}> {
  type StatusResp = { status: string; appName: string };
  return composioFetch<StatusResp>('/connectedAccounts/' + connectionId);
}

/**
 * Execute a tool action.
 */
export async function executeTool(params: {
  entityId: string;
  appName: string;
  actionName: string;
  input: Record<string, unknown>;
}): Promise<ComposioToolResult> {
  type ExecResp = {
    successful: boolean;
    data?: unknown;
    error?: string;
  };

  return composioFetch<ExecResp>('/actions/execute', {
    method: 'POST',
    body: JSON.stringify({
      entityId: params.entityId,
      appName: params.appName.toLowerCase(),
      actionName: params.actionName,
      input: params.input,
    }),
  });
}

/**
 * List available actions for an app (returns OpenAI-compatible function specs).
 */
export async function listActions(appName: string): Promise<Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}>> {
  type ActionsResp = {
    items: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>;
  };
  const result = await composioFetch<ActionsResp>('/actions?appNames=' + appName.toLowerCase());
  return result.items ?? [];
}

/**
 * Disconnect an integration.
 */
export async function disconnectAccount(connectionId: string): Promise<void> {
  await composioFetch('/connectedAccounts/' + connectionId, { method: 'DELETE' });
}
