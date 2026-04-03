# kairo — TASKS.md
> Versión: 1.0
> Última actualización: 2026-04-02
> Metodología: cada tarea = un prompt al agente. Nunca mezclar tareas de distintos sprints.

---

## Reglas de uso

- Completar cada tarea antes de pasar a la siguiente.
- Hacer `git commit` después de cada tarea que pase sus criterios.
- Si una tarea falla después de 2 intentos, abrir como blocker antes de continuar.
- El orden de sprints respeta dependencias — no saltarse sprints.

---

## Sprint 0 — Scaffolding del monorepo
> Objetivo: proyecto corriendo, typechecking limpio, estructura lista.

- [ ] **S0-1** Inicializar monorepo con `pnpm workspaces`
  - `pnpm-workspace.yaml` con `apps/*` y `packages/*`
  - `package.json` raíz con scripts: `dev`, `build`, `typecheck`, `lint`
  - `.gitignore`: `node_modules`, `dist`, `generated`, `reports`, `.env`

- [ ] **S0-2** Configurar TypeScript base
  - `tsconfig.base.json` en raíz con `strict: true`
  - Cada package y app extiende el base
  - `typecheck` en raíz corre todos los packages

- [ ] **S0-3** Crear estructura de packages vacíos
  - `packages/mcp`, `packages/analyzer`, `packages/generator`
  - `packages/runner`, `packages/classifier`, `packages/fixer`
  - Cada uno con `package.json`, `tsconfig.json`, `src/index.ts` vacío

- [ ] **S0-4** Crear estructura de apps vacías
  - `apps/api`: Express + better-sqlite3 + TypeScript
  - `apps/dashboard`: React + Vite + Tailwind
  - Ambas con scripts `dev` y `build` funcionando

- [ ] **S0-5** Definir tipos compartidos
  - `packages/mcp/src/types.ts` — fuente de verdad
  - Tipos: `ProjectMap`, `TestSpec`, `RunResult`, `TestFailure`, `FixRecommendation`, `RunReport`
  - Todos los packages importan desde aquí — ninguno define sus propios tipos base

- [ ] **S0-6** Configurar variables de entorno
  - `.env.example` en raíz con todas las variables requeridas
  - `OPENAI_API_KEY`, `FORGE_API_URL`, `FORGE_TEST_USER`, `FORGE_TEST_PASSWORD`
  - `FORGE_TEST_ADMIN_USER`, `FORGE_TEST_ADMIN_PASSWORD`
  - Validación de env vars al iniciar el MCP server con `zod`

---

## Sprint 1 — packages/analyzer
> Objetivo: dado un path de proyecto, retorna un `ProjectMap` confiable sin config.

- [ ] **S1-1** Detectar stack del proyecto
  - Lee `package.json` del proyecto objetivo
  - Identifica: framework frontend (React, Vue, Next.js), framework backend (Express, Fastify, NestJS)
  - Retorna `{ frontend, backend, hasTypeScript, packageManager }`

- [ ] **S1-2** Inferir rutas frontend
  - Detecta React Router: lee `App.tsx` o archivo de rutas
  - Extrae: path, componente, si requiere auth (busca guards/redirects)
  - Retorna array de `{ path, component, protected: boolean }`

- [ ] **S1-3** Inferir endpoints backend
  - Detecta patrones Express/Fastify: `app.get`, `router.post`, etc.
  - Extrae: método HTTP, ruta, si requiere auth (busca middleware)
  - Retorna array de `{ method, path, protected: boolean }`

- [ ] **S1-4** Inferir estrategia de auth
  - Detecta: JWT (busca `jsonwebtoken`), session (busca `express-session`), OAuth
  - Identifica el endpoint de login
  - Retorna `{ strategy, loginEndpoint, tokenStorage }`

- [ ] **S1-5** Ensamblar y validar ProjectMap
  - Combina outputs de S1-1 a S1-4 en un `ProjectMap` completo
  - Valida con Zod antes de retornar
  - Si falta info crítica: retorna `ProjectMap` parcial con `warnings[]`

---

## Sprint 2 — packages/generator
> Objetivo: dado un ProjectMap, genera .spec.ts ejecutables por Playwright.

- [ ] **S2-1** Crear prompt templates
  - `/prompts/ui-flow.md` — para flujos de usuario en frontend
  - `/prompts/api-contract.md` — para contratos de endpoints
  - `/prompts/security.md` — para checks de seguridad básica
  - `/prompts/edge-case.md` — para casos límite
  - Cada template tiene secciones: `## Context`, `## Task`, `## Output format`

- [ ] **S2-2** Integrar OpenAI API
  - Cliente con retry: máximo 2 reintentos con backoff exponencial
  - Valida que el output sea JSON puro antes de parsear
  - Maneja errores de rate limit y timeout con `recoverable: true`

- [ ] **S2-3** Generar specs de frontend
  - Input: rutas del ProjectMap + credenciales de test
  - Output: `.spec.ts` con tests Playwright por cada ruta protegida y pública
  - Prioridad asignada: `critical` para auth y core feature, `normal` para el resto

- [ ] **S2-4** Generar specs de backend
  - Input: endpoints del ProjectMap
  - Output: `.spec.ts` con Playwright API testing por cada endpoint
  - Cubre: happy path, 401/403, inputs inválidos, schema de respuesta

- [ ] **S2-5** Generar specs de security
  - Input: rutas + endpoints protegidos del ProjectMap
  - Output: `.spec.ts` con los 5 checks de seguridad básica definidos en SPEC
  - Cada check con assertion clara y mensaje de error descriptivo

- [ ] **S2-6** Escribir specs a /generated
  - Nomenclatura: `{flujo}.{tipo}.spec.ts` (ej: `auth-login.frontend.spec.ts`)
  - Prioridad embebida como comentario en la primera línea del archivo
  - Si el archivo ya existe: sobreescribir solo si el hash del ProjectMap cambió

---

## Sprint 3 — packages/runner
> Objetivo: ejecuta specs generados, produce resultados con evidencia completa.

- [ ] **S3-1** Configurar Playwright
  - `playwright.config.ts` base en el package
  - `--trace on` siempre
  - Separar proyectos: `frontend` (con browser), `backend` y `security` (sin browser)
  - Timeout por test: 30s. Timeout de conexión: 10s.

- [ ] **S3-2** Implementar ejecución por prioridad
  - Lee prioridad del comentario en cada spec
  - Corre `critical` primero, luego `normal`
  - Si un test `critical` falla: continúa pero lo marca como blocker en el reporte

- [ ] **S3-3** Implementar doble-run para flakiness
  - Si un test falla: re-ejecuta inmediatamente el mismo test
  - Guarda resultado de ambos runs
  - Retorna `{ run1: result, run2: result | null }` por cada test fallido

- [ ] **S3-4** Recolectar evidencia
  - Por cada test fallido: trace file, screenshot del momento del fallo, response diff (si es API)
  - Guarda en `/reports/{run-id}/` con estructura clara
  - Retorna paths relativos en el resultado — no base64

- [ ] **S3-5** Implementar fallback local
  - Antes de enviar a la API: guarda `run-{id}.json` en `/reports/`
  - Si la API en Railway no responde: log de warning, resultados no se pierden
  - Retry de sync: 3 intentos con backoff

- [ ] **S3-6** Ensamblar RunResult
  - Combina resultados de todos los tipos de test
  - Calcula: total, passed, failed, flaky, duration
  - Valida con Zod antes de retornar al MCP server

---

## Sprint 4 — packages/classifier
> Objetivo: clasifica cada fallo con lógica determinista según RULES.md sección 6.

- [ ] **S4-1** Implementar clasificador de `bug`
  - Condición: falla run 1 Y run 2
  - Extrae: archivo más probable del stack trace de Playwright
  - Retorna failure con `type: "bug"`

- [ ] **S4-2** Implementar clasificador de `flaky`
  - Condición: falla run 1, pasa run 2
  - Prohibido clasificar sin run 2 ejecutado — lanza error si run2 es null
  - Retorna failure con `type: "flaky"` — no pasa al fixer

- [ ] **S4-3** Implementar clasificador de `env`
  - Condiciones: timeout de conexión, variable de entorno faltante, DB no responde
  - Si hay fallo `env`: detiene el loop inmediatamente
  - Retorna failure con `type: "env"` y `recoverable: false`

- [ ] **S4-4** Implementar clasificador de `security`
  - Lee el nombre del spec para identificar tests de security
  - Cualquier fallo en spec de security → `type: "security"` independiente del doble-run
  - Los fallos de security siempre pasan al fixer

- [ ] **S4-5** Ensamblar ClassificationResult
  - Agrupa fallos por tipo
  - Calcula si el loop debe continuar o detenerse
  - Retorna `{ shouldContinue: boolean, reason?: string, failures: ClassifiedFailure[] }`

---

## Sprint 5 — packages/fixer
> Objetivo: genera fix recommendations accionables para fallos bug y security.

- [ ] **S5-1** Leer código fuente relevante
  - Dado el archivo inferido por el classifier, lee las líneas relevantes (±20 líneas del error)
  - Si el archivo no existe: `confidence: "low"`, sugerencia genérica

- [ ] **S5-2** Generar fix para bugs
  - Input: ClassifiedFailure (bug) + código fuente relevante
  - Llama OpenAI API con prompt `/prompts/fix-bug.md`
  - Output: FixRecommendation con archivo, línea, evidencia, sugerencia y confidence

- [ ] **S5-3** Generar fix para security
  - Input: ClassifiedFailure (security) + código fuente relevante
  - Llama OpenAI API con prompt `/prompts/fix-security.md`
  - Output: FixRecommendation con referencia al estándar violado (ej: OWASP A01)

- [ ] **S5-4** Asignar confidence
  - `high`: archivo y línea confirmados, valor esperado vs recibido claro
  - `medium`: archivo confirmado, línea aproximada
  - `low`: hipótesis sin evidencia directa
  - Solo `high` y `medium` se proponen al agente automáticamente
  - `low` requiere confirmación del usuario antes de aplicar

- [ ] **S5-5** Ensamblar FixReport
  - Array de FixRecommendation ordenado por confidence (high primero)
  - Incluye `iteration` para tracking del loop
  - Valida con Zod antes de retornar

---

## Sprint 6 — packages/mcp
> Objetivo: MCP server funcionando con los 5 tools, instalable via npm.

- [ ] **S6-1** Inicializar MCP server
  - Usa `@modelcontextprotocol/sdk`
  - Configura servidor con nombre `kairo` y versión desde `package.json`
  - Entry point: `src/index.ts`, binary: `kairo-mcp`

- [ ] **S6-2** Implementar tool `analyze_project`
  - Input schema Zod: `{ projectPath: string }`
  - Llama `packages/analyzer`
  - Retorna ProjectMap o error con shape estándar

- [ ] **S6-3** Implementar tool `generate_tests`
  - Input schema Zod: `{ projectMap: ProjectMap, types: TestType[] }`
  - Llama `packages/generator`
  - Retorna lista de archivos generados

- [ ] **S6-4** Implementar tool `run_tests`
  - Input schema Zod: `{ type: "frontend" | "backend" | "security" | "all" }`
  - Llama `packages/runner`
  - Retorna RunResult

- [ ] **S6-5** Implementar tool `classify_failures`
  - Input schema Zod: `{ runResult: RunResult }`
  - Llama `packages/classifier`
  - Retorna ClassificationResult con flag `shouldContinue`

- [ ] **S6-6** Implementar tool `get_fixes`
  - Input schema Zod: `{ failures: ClassifiedFailure[] }`
  - Llama `packages/fixer`
  - Retorna FixReport

- [ ] **S6-7** Implementar orquestación del loop
  - El MCP server controla el loop: run → classify → fix → rerun
  - Respeta exit conditions del SPEC
  - Contador de iteraciones: máximo 3
  - Al terminar: envía RunReport a `apps/api`

- [ ] **S6-8** Publicar como npm package
  - `package.json` con `bin`, `main`, `files`
  - README con instrucciones de instalación para Claude Code y Cursor
  - Test de instalación limpia: `npx @kairo/mcp`

---

## Sprint 7 — apps/api
> Objetivo: Express server con 3 endpoints, SQLite, deployable en Railway.

- [ ] **S7-1** Setup Express + SQLite
  - Express con TypeScript
  - `better-sqlite3` con schema inicial: tablas `runs`, `tests`, `failures`, `fixes`
  - Migraciones con `better-sqlite3` directo (sin ORM en v1)

- [ ] **S7-2** Implementar `POST /runs`
  - Recibe RunReport completo
  - Valida con Zod
  - Persiste en SQLite
  - Retorna `{ id, createdAt }`

- [ ] **S7-3** Implementar `GET /runs`
  - Retorna historial paginado (20 por página)
  - Incluye: id, fecha, totales (passed/failed), duración
  - Ordenado por fecha descendente

- [ ] **S7-4** Implementar `GET /runs/:id`
  - Retorna run completo con tests, failures y fixes
  - Incluye paths a traces y screenshots
  - 404 con mensaje claro si no existe

- [ ] **S7-5** Configurar para Railway
  - `Dockerfile` o `railway.toml`
  - Volumen persistente para SQLite en `/data/kairo.db`
  - Variables de entorno documentadas en `.env.example`
  - Health check endpoint: `GET /health`

---

## Sprint 8 — apps/dashboard
> Objetivo: dashboard React accesible, con replay y fix recommendations.

- [ ] **S8-1** Setup React + Vite + Tailwind
  - Vite con TypeScript
  - Tailwind configurado
  - React Router para navegación entre vistas
  - Cliente HTTP para consumir `apps/api` (fetch nativo, sin axios)

- [ ] **S8-2** Vista `/` — Historial de runs
  - Lista de runs con: fecha, estado (passed/failed), totales por categoría
  - Badge de color por estado: verde/rojo/amarillo
  - Link a detalle de cada run

- [ ] **S8-3** Vista `/runs/:id` — Detalle del run
  - Tests agrupados por categoría: frontend, backend, security
  - Resultado por test con ícono de estado
  - Link a replay (si hay trace) y a fixes (si hay recommendations)

- [ ] **S8-4** Vista `/runs/:id/replay` — Trace viewer
  - Embeber Playwright Trace Viewer
  - Si no hay trace disponible: mensaje claro con instrucciones
  - Navegación entre steps con screenshots

- [ ] **S8-5** Vista `/runs/:id/fixes` — Fix recommendations
  - Lista de fixes ordenada por confidence (high primero)
  - Por cada fix: archivo, línea, evidencia, sugerencia
  - Estado: pendiente / aplicado / descartado (persistido en localStorage v1)
  - Badge de confidence con color: verde (high), amarillo (medium), rojo (low)

- [ ] **S8-6** Configurar para Railway
  - Build estático servido por Express (mismo Railway service que la API)
  - O servido como static site en Railway separado
  - Variables de entorno: `VITE_API_URL`

---

## Sprint 9 — Integración y deploy
> Objetivo: todo funcionando end-to-end, deployado en Railway.

- [ ] **S9-1** Test de integración end-to-end
  - Proyecto de prueba: React + Express simple con un bug intencional y un header faltante
  - Correr el loop completo desde Claude Code
  - Verificar: tests generados → ejecutados → bug detectado → fix propuesto → dashboard actualizado

- [ ] **S9-2** Deploy en Railway
  - Crear proyecto en Railway
  - Deploy `apps/api` con volumen SQLite
  - Deploy `apps/dashboard`
  - Configurar variables de entorno en Railway

- [ ] **S9-3** Test de humo post-deploy
  - MCP server local apunta a Railway en producción
  - Loop completo con proyecto de prueba
  - Verificar que el dashboard en Railway muestra los resultados

- [ ] **S9-4** Documentación de instalación
  - `README.md` en raíz con: instalación, configuración en Claude Code y Cursor, primer run
  - Tiempo estimado de setup: < 10 minutos

---

## Backlog v2 (no tocar hasta cerrar v1)

- [ ] OWASP ZAP integration
- [ ] Multi-tenant con auth en dashboard
- [ ] Migración a Postgres
- [ ] npm audit automatizado
- [ ] GitHub Actions nativo
- [ ] Soporte staging URL (no solo localhost)
- [ ] Mobile web (Playwright mobile viewport)
