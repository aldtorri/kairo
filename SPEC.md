# kairo — SPEC.md
> Versión: 1.0 — FINAL
> Última actualización: 2026-04-02

---

## Propósito

kairo es un **MCP server** que cierra el loop entre generación de código y verificación.
Se integra en Claude Code o Cursor, testea frontend (UI/E2E), backend (API/contratos) y
seguridad básica, clasifica los fallos, y devuelve **fix recommendations estructuradas
directamente al agente** para que aplique las correcciones sin intervención manual.

El usuario no escribe tests. No revisa logs. Solo aprueba los fixes que el agente propone.

---

## Distribución del stack

```
LOCAL (tu máquina)
├── packages/mcp          → MCP server, orquesta todo, expone tools al IDE
├── packages/analyzer     → infiere stack del proyecto objetivo sin config
├── packages/generator    → OpenAI API → genera .spec.ts priorizados
├── packages/runner       → Playwright (browser + API + security), doble-run
├── packages/classifier   → clasifica bug / flaky / env / security
└── packages/fixer        → OpenAI API → genera fix recommendations

RAILWAY (cloud)
├── apps/api              → Express, 3 endpoints, persiste resultados en SQLite
└── apps/dashboard        → React + Vite, consume apps/api, replay paso a paso
```

**Una sola plataforma. Un solo bill. Control total.**

---

## El loop autónomo (core del producto)

```
[Agente genera código]
        ↓
analyze_project     → infiere stack, rutas, endpoints, auth strategy
generate_tests      → crea .spec.ts: frontend, backend, security
run_tests           → Playwright local, critical path primero (máx. 3 iteraciones)
classify_failures   → bug / flaky (requiere 2 runs) / env / security
get_fixes           → fix recommendations con archivo, línea, evidencia, confidence
        ↓
[Agente recibe fixes y aplica correcciones]
        ↓
run_tests           → re-ejecuta solo los tests que fallaron
        ↓
[Loop hasta que pasan o se alcanza el límite]
        ↓
[Runner envía resultados a apps/api → Dashboard muestra evidencia]
```

---

## Exit conditions del loop

| Condición | Acción |
|---|---|
| Todos los tests pasan | Loop termina exitosamente |
| Iteración 3 sin convergencia | Para — reporta tests irresueltos con contexto |
| Todos los fallos son `flaky` o `env` | Para — no hay código que corregir |
| App no responde | Para inmediatamente con diagnóstico |

---

## MCP Tools expuestos al IDE

| Tool | Input | Output |
|---|---|---|
| `analyze_project` | path del proyecto | mapa de rutas, endpoints, auth strategy, stack |
| `generate_tests` | mapa del proyecto | `.spec.ts` frontend, backend, security |
| `run_tests` | tipo: `frontend` / `backend` / `security` / `all` | resultados + traces + response diffs |
| `classify_failures` | resultados del run | lista: `bug`, `flaky`, `env`, `security` |
| `get_fixes` | fallos `bug` y `security` | array de fix recommendations |

### Formato de fix recommendation

```json
{
  "file": "src/auth/login.controller.ts",
  "line": 42,
  "type": "bug",
  "test_failed": "POST /auth/login debería retornar 401 para credenciales inválidas",
  "evidence": "Expected 401, received 200. Response: { token: null }",
  "suggested_fix": "El guard no valida cuando password es null. Agregar validación antes del bcrypt.compare en línea 42.",
  "confidence": "high",
  "iteration": 1
}
```

---

## Cobertura de testing

### Frontend (Playwright Browser — local)
- Critical path: auth, core feature, navegación principal
- Estados UI: loading, error, empty, success
- Responsividad básica
- Accesibilidad: aria-labels, roles, keyboard navigation

### Backend (Playwright API — local)
- Contratos de endpoints: status codes, schemas de respuesta
- Autenticación y autorización por rol
- Edge cases: inputs inválidos, campos faltantes, valores límite
- Response time básico (> 3s = warning)

### Security básico (Playwright — local) — v1
- Rutas protegidas accesibles sin autenticación
- IDOR: usuario A accediendo recursos de usuario B
- Tokens o passwords expuestos en responses o headers
- Headers faltantes: `CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`
- XSS reflejo básico

### Security avanzado — roadmap v2
- OWASP ZAP: SQL injection, CSRF, SSRF
- npm audit automatizado
- Rate limiting y brute force detection

---

## Auth handling

Credenciales inyectadas via variables de entorno en el proyecto objetivo:

```bash
FORGE_TEST_USER=test@example.com
FORGE_TEST_PASSWORD=test-password-123
FORGE_TEST_ADMIN_USER=admin@example.com
FORGE_TEST_ADMIN_PASSWORD=admin-password-123
```

Si no se encuentran → genera tests solo para rutas públicas y notifica al agente.

---

## Flakiness detection

- Falla run 1 + pasa run 2 sin cambios → `flaky`
- Falla run 1 + falla run 2 → `bug`
- Nunca se clasifica `flaky` sin ejecutar el segundo run

---

## Priorización de ejecución

```
1. Critical path (auth + core feature)
2. Backend API contracts
3. Security checks
4. Edge cases y estados UI secundarios
```

---

## apps/api — endpoints (Express)

Solo 3 endpoints en v1:

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/runs` | Recibe y persiste un run completo con sus resultados |
| `GET` | `/runs` | Lista historial de runs |
| `GET` | `/runs/:id` | Retorna un run completo con traces y fixes |

SQLite con `better-sqlite3`. Volumen persistente en Railway.
Migración a Postgres en v2 si el volumen de datos lo justifica.

---

## apps/dashboard — vistas (React)

| Vista | Qué muestra |
|---|---|
| `/` | Historial de runs con estado general |
| `/runs/:id` | Detalle del run: tests por categoría, resultado |
| `/runs/:id/replay` | Playwright Trace Viewer embebido — replay paso a paso |
| `/runs/:id/fixes` | Fix recommendations con estado: pendiente / aplicado / descartado |

---

## Stack completo

| Capa | Herramienta | Versión |
|---|---|---|
| MCP Server | `@modelcontextprotocol/sdk` | latest |
| Runtime | Node.js | 20.x |
| Lenguaje | TypeScript (strict) | 5.x |
| Testing | Playwright (browser + API) | 1.44+ |
| Generación + Fixes IA | OpenAI API — gpt-4o | latest |
| API | Express | 4.x |
| Base de datos | SQLite (better-sqlite3) → Postgres v2 | latest |
| Dashboard | React + Vite + HeroUI v3 (Tailwind v4 + Framer Motion incluidos) | latest |
| Trace viewer | Playwright Trace Viewer embebido | nativo |
| Hosting | Railway (API + Dashboard) | - |
| Monorepo | pnpm workspaces | latest |
| Security v2 | OWASP ZAP | roadmap |

---

## Estructura de directorios

```
kairo/
├── apps/
│   ├── api/                # Express — 3 endpoints, SQLite (Railway)
│   └── dashboard/          # React — historial, replays, fixes (Railway)
├── packages/
│   ├── mcp/                # MCP server — orquesta, expone tools al IDE
│   ├── analyzer/           # Infiere stack sin config requerida
│   ├── generator/          # OpenAI API → .spec.ts priorizados
│   ├── runner/             # Playwright local — browser, API, security
│   ├── classifier/         # Clasifica: bug / flaky / env / security
│   └── fixer/              # OpenAI API → fix recommendations
├── prompts/                # Templates: ui-flow, api-contract, security, edge-case
├── kairo.config.ts         # Opcional — overrides en el proyecto objetivo
├── SPEC.md
├── RULES.md
└── TASKS.md
```

---

## Qué NO hace kairo (v1)

- No aplica fixes — los propone, el agente decide
- No hostea el proyecto objetivo
- No hace security avanzado — eso es v2
- No genera unit tests del proyecto objetivo
- No tiene multi-tenant — v1 single user
- No soporta mobile — v1 solo web

---

## Criterios de éxito (v1)

- [ ] Claude Code ejecuta el loop completo con un prompt en lenguaje natural
- [ ] Infiere stack sin `kairo.config.ts`
- [ ] Genera tests de frontend, backend y security sin intervención
- [ ] Flakiness detection con doble-run funciona correctamente
- [ ] Fix recommendations con archivo, línea, evidencia y confidence
- [ ] Loop siempre termina — máximo 3 iteraciones
- [ ] Security detecta headers faltantes, rutas sin auth e IDOR básico
- [ ] Dashboard accesible desde URL pública en Railway
- [ ] Tiempo total del loop < 3 min para proyecto mediano

---

## Roadmap

| Versión | Features |
|---|---|
| v1 | Loop autónomo + frontend + backend + security básico + dashboard en Railway |
| v2 | OWASP ZAP + multi-tenant + Postgres + npm audit |
| v3 | GitHub Actions nativo + staging URL support + mobile web |
