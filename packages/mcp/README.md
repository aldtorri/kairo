# @kairo/mcp

Kairo MCP server — closes the loop between code generation and test verification.

## Usage

Add to your MCP client config (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "kairo": {
      "command": "npx",
      "args": ["-y", "@kairo/mcp"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `analyze_project` | Detect stack, routes, endpoints, and auth strategy |
| `generate_tests` | Generate Playwright tests via OpenAI |
| `run_tests` | Execute tests with double-run flakiness detection |
| `classify_failures` | Categorize failures: bug / flaky / env / security |
| `get_fixes` | Get fix recommendations (excludes flaky/env) |

## Environment Variables

- `OPENAI_API_KEY` — required for `generate_tests` and `get_fixes`
