

# Fase 0 — Auditoría y Estabilización

## Informe de Auditoría

### Rutas auditadas (10)
`/login`, `/dashboard` (Resumen), `/dashboard/eventos`, `/dashboard/metricas`, `/dashboard/medios`, `/dashboard/cascadas`, `/dashboard/social`, `/dashboard/hitos`, `/dashboard/evolucion`, `/dashboard/admin`

---

### Fallos encontrados por página

#### 1. Eventos.tsx — 2 bugs
- **L83**: `formatFecha` uses raw `format(new Date(d), ...)` — will crash on null/invalid dates (same pattern that crashed Cascadas)
- **L349**: `ev.titular_o_texto?.length` — missing null guard on string length access

#### 2. Metricas.tsx — 2 bugs
- **L183**: `format(new Date(day), "dd/MM")` inside `dailyData` — unsafe if `e.fecha` is null/invalid, `day` will be invalid
- **L343**: `format(new Date(ev.fecha), "dd/MM/yy")` in Top 5 table — same crash risk as Cascadas had

#### 3. Medios.tsx — 2 bugs
- **L59**: `formatDate` uses raw `format(new Date(d))` — will crash on invalid dates (already guarded with `if (!d)` but not against invalid date strings)
- **L99**: `m.medio.toLowerCase()` in search filter — will crash if `medio` is null
- **L331**: `format(new Date(ev.fecha), ...)` in MedioDetailSheet — unsafe

#### 4. Social.tsx — 3 bugs
- **L213**: `format(new Date(s.fecha), ...)` — unsafe date formatting in signals table
- **L250**: `format(new Date(a.fecha), ...)` — unsafe in amplifications cards
- **L359**: `format(new Date(signal.fecha), ...)` — unsafe in detail sheet

#### 5. Hitos.tsx — 4 bugs
- **L101**: `m.impacto.toLowerCase()` — will crash if `impacto` is null
- **L125**: `m.impacto.toLowerCase()` — same in typeSummary
- **L225**: `m.impacto.toLowerCase()` — same in timeline rendering
- **L237, 249, 314**: `format(new Date(m.fecha), ...)` — unsafe date formatting (3 locations)

#### 6. Cascadas.tsx — 1 remaining bug
- **L107-110**: `weeklyData` useMemo uses `format(weekStart, ...)` — if `first_detected_at` is null, `new Date(null)` produces invalid date, then `format()` crashes

#### 7. Evolucion.tsx — 1 bug
- **L47**: `fmtDate` uses `parseISO(d)` — if `d` is empty string (not null), `parseISO("")` returns Invalid Date and `format()` crashes

#### 8. Admin.tsx — 2 bugs
- **L295**: `formatDistanceToNow(new Date(stats.ultimoEvento))` — guarded with ternary but if `ultimoEvento` is a malformed string, `new Date()` will be invalid
- **L351**: `new Date(u.created_at).toLocaleDateString()` — unsafe if `created_at` is null
- **L409**: `new Date(s.created_at).toLocaleDateString()` — same

#### 9. Resumen.tsx — 1 bug
- **L54-56**: `formatDate` creates `new Date(d)` without validity check — can produce NaN on malformed date strings
- **L291**: `new Date(c.last_alert_at).toLocaleString()` — unsafe if null (partially guarded with ternary but not against invalid strings)

#### 10. Login.tsx — OK (no data rendering)

---

### Summary: 18 unsafe date/null access points across 8 pages

---

### Plan de Correcciones

**Single shared utility approach**: Create a `src/lib/safe-format.ts` with `safeFormat()` and `safeFormatDistance()` helpers, then update all pages to use them instead of raw `format(new Date(...))`.

#### Files to create:
1. **`src/lib/safe-format.ts`** — shared safe date utilities

#### Files to modify (8 pages):
1. **Eventos.tsx** — replace `formatFecha` with safe version, guard `titular_o_texto?.length`
2. **Metricas.tsx** — wrap 2 `format()` calls with safe version
3. **Medios.tsx** — fix `formatDate`, guard `m.medio`, fix sheet date
4. **Social.tsx** — wrap 3 `format()` calls with safe version
5. **Hitos.tsx** — guard `impacto` null access (4 locations), wrap 3 `format()` calls
6. **Cascadas.tsx** — guard `first_detected_at` null in weeklyData useMemo
7. **Evolucion.tsx** — fix `fmtDate` to handle invalid parseISO
8. **Admin.tsx** — wrap `formatDistanceToNow` and `toLocaleDateString` calls
9. **Resumen.tsx** — fix `formatDate` and cascada date display

Each fix is a small surgical change: replace raw `format(new Date(x))` with `safeFormat(x, 'pattern')` and add `?? ""` / `?? "—"` guards on nullable field access.

#### Empty states already handled:
All pages already show "Sin datos" / "Sin eventos" / "Sin resultados" messages when data arrays are empty. No new empty state work needed.

#### Pages already stable after fixes:
All 10 routes will be stable after these changes. No structural issues, no broken layouts, no missing error boundaries needed beyond the null guards.

