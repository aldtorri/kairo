# Kairo

Kairo is an MCP server that closes the loop between code generation and test verification.

It autonomously **analyzes** a project → **generates** Playwright tests via OpenAI → **runs** them → **classifies** failures → **recommends fixes** — iterating up to 3 times.

## How it works

```
analyze → generate tests → run → classify → fix → rerun (max 3x)
```

**Exit conditions:** all pass · iteration 3 reached · only flaky/env failures · app unresponsive

## Install

```bash
npm install -g @kairo/mcp
```

Or use via npx (no install needed):

```json
{
  "mcpServers": {
    "kairo": {
      "command": "npx",
      "args": ["-y", "@kairo/mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `analyze_project` | Detect stack, routes, endpoints, auth strategy |
| `generate_tests` | Generate Playwright tests via OpenAI |
| `run_tests` | Execute with double-run flakiness detection |
| `classify_failures` | bug / flaky / env / security |
| `get_fixes` | Fix recommendations with confidence levels |

## Dashboard

Start the API:
```bash
cd apps/api && pnpm dev
```

Start the dashboard:
```bash
cd apps/dashboard && pnpm dev
# → http://localhost:5173
```

## Development

```bash
pnpm install
pnpm typecheck     # typecheck all packages
pnpm build         # build all packages
pnpm test          # run all tests
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for test generation and fix recommendations |
| `DATABASE_URL` | No | SQLite path (default: `./kairo.db`) |
| `PORT` | No | API port (default: `3000`) |

## Stack

- **packages/analyzer** — Project analysis (stack, routes, auth)
- **packages/generator** — OpenAI-powered test generation
- **packages/runner** — Playwright executor with double-run
- **packages/classifier** — Deterministic failure classification
- **packages/fixer** — OpenAI fix recommendations
- **packages/mcp** — MCP server + orchestration loop
- **apps/api** — Express REST API + SQLite
- **apps/dashboard** — React + Vite + HeroUI dashboard
