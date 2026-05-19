# OperatorAI Coding Runtime

Infraestructura interna para usar un unico Qwen local como un pequeno equipo tipo Codex:

```txt
Boss -> Repo -> Coder -> Debugger -> Reviewer
       mismo modelo local, roles/prompts distintos
```

El runtime vive en:

- `src/lib/coding-runtime/`
- `src/app/api/operator/coding-mission/route.ts`

## Requisitos

Levanta un servidor local compatible con OpenAI:

```bash
# LM Studio: server en http://localhost:1234/v1

# Ollama, si expones API compatible:
ollama run qwen2.5-coder:14b

# vLLM:
vllm serve Qwen/Qwen2.5-Coder-14B-Instruct
```

Variables utiles:

```bash
OPERATOR_COACH_URL=http://localhost:1234
OPERATOR_COACH_MODEL=operator-qwen14b
OPERATOR_COACH_API_KEY=
OPERATOR_COACH_AUTH_HEADER=Authorization
CODING_RUNTIME_ENABLED=true
CODING_RUNTIME_WORKSPACE_ROOT=/Users/rubenymarina/Development/OperatorAI
```

`LOCAL_OPERATOR_URL`, `LOCAL_OPERATOR_MODEL` y `LOCAL_OPERATOR_API_KEY` siguen
funcionando como alias antiguos, pero el runtime nuevo comparte configuracion
con el coach mediante `OPERATOR_COACH_*`.

## Produccion con Qwen en tu Mac

Si OperatorAI esta desplegado fuera de tu Mac, `localhost` ya no apunta a tu Mac:
apunta al propio servidor donde corre OperatorAI. Para usar tu Qwen local en
produccion necesitas publicar el servicio del Mac con una URL alcanzable, por
ejemplo Cloudflare Tunnel, ngrok, Tailscale/Fly en la misma red privada, o
ejecutar OperatorAI directamente en ese Mac.

En ese caso configura el deploy asi:

```bash
OPERATOR_COACH_URL=https://tu-url-del-mac.example.com
OPERATOR_COACH_MODEL=operator-qwen14b
OPERATOR_COACH_API_KEY=un-secreto-compartido-si-tu-proxy-lo-valida
CODING_RUNTIME_ENABLED=true
```

En desarrollo el endpoint queda disponible localmente. En produccion exige:

```txt
CODING_RUNTIME_ENABLED=true
usuario admin
```

## Endpoint

Health:

```bash
curl http://localhost:3000/api/operator/coding-mission
```

Plan only:

```bash
curl -X POST http://localhost:3000/api/operator/coding-mission \
  -H "Content-Type: application/json" \
  -d '{"task":"Find why web browse is disabled","mode":"plan"}'
```

Dry run, sin escribir archivos:

```bash
curl -X POST http://localhost:3000/api/operator/coding-mission \
  -H "Content-Type: application/json" \
  -d '{"task":"Inspect chat route and suggest fixes for OpenAI/Gemini cleanup","mode":"dry-run"}'
```

Run con escritura y terminal permitidos:

```bash
curl -X POST http://localhost:3000/api/operator/coding-mission \
  -H "Content-Type: application/json" \
  -d '{
    "task":"Fix the web browse stub using the existing Tavily adapter",
    "mode":"run",
    "allowWrites":true,
    "allowTerminal":true,
    "maxSteps":6,
    "maxToolRounds":4
  }'
```

## Agentes

| Agent | Rol | Tools |
| --- | --- | --- |
| `boss` | parte la mision en pasos | lectura ligera |
| `repo` | entiende estructura y archivos | `list_files`, `read_file`, `search_code`, `git_status` |
| `coder` | modifica archivos | lectura + `edit_file`/`write_file` si `allowWrites` |
| `debugger` | corre checks y repara | coder + `terminal_exec` si `allowTerminal` |
| `reviewer` | revisa diff y riesgos | lectura + `git_diff` |
| `terminal` | comandos seguros | allowlist |
| `memory` | resume decisiones duraderas | lectura |

## Seguridad

Por defecto:

- No escribe archivos.
- No ejecuta terminal.
- Bloquea rutas sensibles: `.env*`, `.git`, `node_modules`, `.next`, `dist`, `out`, claves y secretos.
- `terminal_exec` solo permite prefijos seguros: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, `pnpm test:e2e`, `git status`, `git diff`, `git log`, `rg`.
- Rechaza operadores shell como `;`, `&&`, pipes, redirecciones, backticks y subshells.

## Formato de tool calling

Qwen no depende de function calling nativo. Cada agente responde JSON:

```json
{
  "message": "I need to inspect the chat route.",
  "done": false,
  "tool_calls": [
    {
      "name": "read_file",
      "arguments": {
        "path": "src/app/api/chat/route.ts",
        "startLine": 300,
        "endLine": 460
      }
    }
  ]
}
```

El runtime parsea JSON, valida permisos, ejecuta tools y devuelve observaciones al mismo agente.

## Proximo paso natural

Crear una pequena UI interna en `src/components/dev/` para lanzar misiones y ver eventos en vivo. El endpoint ya devuelve `events`, asi que la UI puede renderizar:

- plan
- mensajes por agente
- tool calls
- resultados
- diff final
