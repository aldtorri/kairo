# kairo — RULES.md
> Versión: 0.1
> Última actualización: 2026-04-02

Estas reglas son no negociables para cualquier agente o desarrollador que trabaje en kairo.
Su propósito es mantener coherencia entre sesiones y evitar los errores más comunes
en proyectos de este tipo.

---

## 1. TypeScript

- **Strict mode siempre.** `"strict": true` en todos los `tsconfig.json`. Sin excepciones.
- **Prohibido `any`.** Si no sabes el tipo, usa `unknown` y nárrowea explícitamente.
- **Prohibido `// @ts-ignore` y `// @ts-expect-error`** salvo en tests internos con comentario que explique por qué.
- **Tipos compartidos viven en `packages/mcp/src/types.ts`** — es la fuente de verdad. Todos los packages la importan. Nadie la duplica.
- **Interfaces para shapes de datos. Types para unions y aliases.**

---

## 2. Arquitectura de packages — fronteras estrictas

Cada package tiene una responsabilidad única. Ninguno cruza su frontera.

| Package | Puede importar | NO puede importar |
|---|---|---|
| `analyzer` | tipos compartidos, fs, path | generator, runner, classifier, fixer |
| `generator` | tipos compartidos, OpenAI API | runner, classifier, fixer, analyzer |
| `runner` | tipos compartidos, Playwright | generator, classifier, fixer |
| `classifier` | tipos compartidos | generator, runner, fixer |
| `fixer` | tipos compartidos, OpenAI API | runner, classifier, analyzer |
| `mcp` | todos los packages | apps/api, apps/dashboard |

**Regla:** si necesitas lógica de otro package, pasa los datos como parámetro. No importes el package.

---

## 3. MCP Tools — contratos

- Cada tool debe tener un schema Zod para validar input y output.
- Cada tool debe retornar siempre el mismo shape, incluso en error:
```typescript
// Siempre este shape
{
  success: boolean,
  data?: T,
  error?: { code: string, message: string, recoverable: boolean }
}
```
- **Prohibido** que un tool llame a otro tool directamente — el MCP server orquesta, los tools ejecutan.
- Los nombres de tools son `snake_case` y descriptivos: `analyze_project`, no `analyze` ni `doAnalysis`.

---

## 4. OpenAI API — prompts

- **Todos los prompts viven en `/prompts/*.md`** — nunca inline en el código.
- Cada prompt tiene una sección `## Context`, `## Task` y `## Output format`.
- El output format siempre pide JSON puro — sin markdown fences, sin texto adicional.
- **Prohibido** construir prompts con template literals en runtime sin validar el resultado con Zod.
- Si OpenAI API retorna un error, se retryea máximo 2 veces con backoff exponencial. Al tercer fallo se reporta como error de ambiente (`env`).

---

## 5. Playwright

- **`--trace on` siempre** en todos los runs — nunca desactivar.
- Los selectores deben seguir este orden de preferencia:
  1. `getByRole` (accesibilidad)
  2. `getByTestId` (atributo `data-testid`)
  3. `getByText` (solo para texto estático)
  4. CSS selector (último recurso — documentar por qué)
- **Prohibido** usar `page.waitForTimeout()` — usar `page.waitForSelector()` o `expect().toBeVisible()`.
- Cada test es independiente: setup y teardown propios. Nunca depende del estado de otro test.
- Los tests de API no abren browser: `request` fixture de Playwright, no `page`.

---

## 6. Classifier — reglas de clasificación

Estas reglas son deterministas. No se cambian sin actualizar este archivo primero.

| Condición | Clasificación |
|---|---|
| Falla en run 1, pasa en run 2 sin cambios | `flaky` |
| Falla en run 1 Y run 2 | `bug` |
| App no responde (timeout de conexión) | `env` |
| Variable de entorno requerida no encontrada | `env` |
| Ruta protegida accesible sin auth | `security` |
| Header de seguridad faltante | `security` |
| Status code incorrecto con respuesta válida | `bug` |

- **Prohibido** clasificar como `flaky` sin haber ejecutado el segundo run.
- Un fallo de tipo `env` detiene el loop inmediatamente — no se generan fixes para fallos de ambiente.

---

## 7. Fix recommendations

- `confidence: "high"` — solo cuando el fallo tiene evidencia directa (archivo, línea, valor esperado vs recibido).
- `confidence: "medium"` — cuando hay evidencia indirecta (pattern conocido pero línea no confirmada).
- `confidence: "low"` — cuando es una hipótesis. El agente debe preguntar al usuario antes de aplicar.
- **Prohibido** generar fixes para fallos `flaky` o `env`.
- **Prohibido** sugerir fixes que modifiquen archivos fuera del proyecto objetivo.

---

## 8. Error handling

- **Nunca `throw` sin capturar** — todos los errores se convierten al shape estándar del tool.
- **Nunca silenciar errores** con `catch(e) {}` vacío.
- Los errores recuperables (`recoverable: true`) permiten al agente reintentar.
- Los errores no recuperables (`recoverable: false`) detienen el loop y reportan al dashboard.

```typescript
// Patrón correcto
try {
  const result = await someOperation()
  return { success: true, data: result }
} catch (error) {
  return {
    success: false,
    error: {
      code: 'ANALYSIS_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
      recoverable: false
    }
  }
}
```

---

## 9. Estructura de archivos generados

- Los `.spec.ts` generados **siempre** van a `/generated` — nunca a `/src` ni al proyecto objetivo.
- El nombre del archivo refleja el tipo y flujo: `auth-login.frontend.spec.ts`, `users-api.backend.spec.ts`, `headers.security.spec.ts`.
- Los traces y screenshots van a `/reports/{run-id}/` — nunca en la raíz del proyecto.
- `/generated` y `/reports` están en `.gitignore`.

---

## 10. Qué el agente NUNCA debe hacer

- ❌ Modificar archivos del proyecto objetivo fuera de aplicar los fixes aprobados.
- ❌ Commitear cambios al proyecto objetivo — solo kairo propone, el usuario decide.
- ❌ Guardar credenciales o API keys en ningún archivo — solo variables de entorno.
- ❌ Generar tests que dependan de datos de producción.
- ❌ Continuar el loop si el classifier retorna solo fallos `env` — no hay código que corregir.
- ❌ Crear nuevos packages sin actualizar este archivo y el SPEC.md primero.
- ❌ Cambiar la lógica del classifier sin actualizar la tabla de la sección 6.

---

## 11. Convenciones de naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case` | `analyze-project.ts` |
| Clases | `PascalCase` | `ProjectAnalyzer` |
| Funciones y variables | `camelCase` | `analyzeProject()` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_ITERATIONS` |
| MCP Tools | `snake_case` | `analyze_project` |
| Tipos e interfaces | `PascalCase` | `FixRecommendation` |
| Archivos de test internos | `*.test.ts` | `classifier.test.ts` |
| Archivos generados para usuario | `*.spec.ts` | `auth-login.frontend.spec.ts` |

---

## 12. Commits

Formato: `type(scope): descripción corta`

| Type | Cuándo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio que no agrega ni corrige |
| `docs` | SPEC, RULES, TASKS, README |
| `test` | Tests internos de kairo |
| `chore` | Config, deps, tooling |

Ejemplos:
```
feat(mcp): add classify_failures tool
fix(runner): prevent loop on connection timeout
docs(spec): add security v2 roadmap
```

---

## 13. Cuándo actualizar este archivo

- Antes de agregar un nuevo package.
- Antes de cambiar la lógica del classifier.
- Antes de cambiar el contrato de cualquier MCP tool.
- Si se descubre un patrón de error recurrente — documentarlo en la sección que corresponda.
