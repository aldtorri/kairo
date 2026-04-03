# kairo — DESIGN.md
> Versión: 1.1 — Light mode
> Última actualización: 2026-04-02

---

## Identidad visual

Kairo es una herramienta de precisión para developers.
El dashboard debe transmitir: **claridad, control y confianza técnica.**

**Dirección estética: Clean precision light**
Inspiración: Linear, Vercel dashboard, Resend — interfaces técnicas que se ven premium en light mode.
Blanco limpio con acentos de color precisos. Sin gradientes de marketing. Sin sombras dramáticas.

---

## UI Library

**HeroUI v3** — no instalar shadcn, MUI, ni ninguna otra librería de componentes.
HeroUI trae Tailwind v4 y Framer Motion incluidos.

```bash
npx heroui-cli@latest init
```

**Tema base: light.** Default del sistema.

---

## Tokens de diseño

### Colores
```
Background base:    #ffffff  (blanco puro)
Background surface: #f8fafc  (slate-50 — cards, panels)
Background elevated:#f1f5f9  (slate-100 — hover states, inputs)
Border:             #e2e8f0  (slate-200 — sutil)

Accent primario:    #6366f1  (indigo-500 — identidad de Kairo)
Accent success:     #16a34a  (green-600 — tests pasando)
Accent danger:      #dc2626  (red-600 — bugs, fallos)
Accent warning:     #d97706  (amber-600 — flaky, warnings)
Accent security:    #7c3aed  (violet-600 — security findings)

Texto primario:     #0f172a  (slate-900)
Texto secundario:   #475569  (slate-600)
Texto muted:        #94a3b8  (slate-400)
```

### Tipografía
```
Font display:  "Geist Mono" o "JetBrains Mono" — métricas, IDs, código, paths
Font body:     "Inter" — prose, descripciones, labels de UI
Font size base: 14px — densidad informativa
```

### Espaciado y densidad
- Padding de cards: `p-4` (16px)
- Gap entre elementos: `gap-3` (12px)
- Sidebar width: `240px` fija
- Información densa pero con aire — sin padding excesivo

---

## Componentes HeroUI por vista

### Vista `/` — Historial de runs
- `Table` de HeroUI con filas clicables y hover state en slate-50
- `Chip` para estado: success / danger / warning / default
- `Pagination` en footer
- Header con título "Runs" + contador total

### Vista `/runs/:id` — Detalle del run
- `Tabs` HeroUI: Frontend / Backend / Security
- Fila de 4 `Card` compactas con métricas: Total / Passed / Failed / Duration
- `Chip` por test con estado
- `Progress` para porcentaje global

### Vista `/runs/:id/replay` — Trace viewer
- `iframe` con Playwright Trace Viewer
- `Breadcrumb` de navegación arriba
- Sin decoración — el viewer es el contenido

### Vista `/runs/:id/fixes` — Fix recommendations
- Lista de `Card` por fix, ordenadas por confidence
- `Chip` de confidence: indigo (high) / amarillo (medium) / rojo (low)
- `Chip` de tipo: bug / security
- Componente `Code` de HeroUI para archivo + línea
- Botones: "Marcar aplicado" / "Descartar" — estado en localStorage v1

---

## Animaciones

- Entrada de tabla y cards: fade-in sutil 0.15s
- Cambio de tabs: transición suave
- Chips: sin animación — instantáneos
- **Prohibido:** loaders infinitos, skeleton excesivo, bounce, parallax

---

## Layout general

```
┌──────────────────────────────────────────────────────┐
│  sidebar (240px)   │  contenido principal             │
│  bg: #f8fafc       │  bg: #ffffff                     │
│  border-r: #e2e8f0 │                                  │
│                    │  Header: título + acción          │
│  Logo Kairo        │  border-b: #e2e8f0                │
│  ──────────────    │  ──────────────────────────────── │
│  Runs              │                                  │
│  Settings (v2)     │  Contenido de la vista           │
│                    │                                  │
└──────────────────────────────────────────────────────┘
```

- Sidebar fija, fondo slate-50, borde derecho slate-200
- Contenido principal fondo blanco
- Header por vista con borde inferior

---

## Lo que NO hacer

- ❌ Dark mode como default — light es el tema principal
- ❌ Gradientes de color en backgrounds
- ❌ Sombras dramáticas — usar bordes slate-200
- ❌ Cards con border-radius > 8px
- ❌ Iconos emoji — usar `@heroui/icons` o Lucide
- ❌ Font size > 15px para texto de interfaz
- ❌ Colores saturados en backgrounds — solo en acentos y chips
- ❌ Mezclar HeroUI con otro sistema de componentes

---

## Skills a instalar antes de S8-1

```bash
/plugin marketplace add heroui-inc/heroui
/plugin marketplace add anthropics/claude-code  # seleccionar frontend-design
```

---

## Referencia visual

- **Linear** — el mejor ejemplo de light mode técnico y premium
- **Vercel dashboard** — limpieza, tipografía precisa, datos al frente
- **Resend** — minimalismo funcional, sin ruido visual

**No** como: Notion (demasiado editorial), Material UI default (demasiado colorido), Grafana (demasiado denso).
