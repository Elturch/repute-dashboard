## Opción A — Migrar KPIs a `v_kpi_canal_30d` (vista materializada)

Dejas `v_canal_*` solo para listas (con `limit(50)` paginado), y mueves todas las **agregaciones** (totales, % QS, nota media, perfiles, riesgo) a una sola query contra `v_kpi_canal_30d`. Esto elimina el bug del cap de 1.000 filas y deja un único hit ligero por sesión.

### 1. Nuevo hook `src/hooks/useKpiCanal.ts`

Una sola query global (todas las filas de la vista agregada — son pocas, una por combinación canal × titularidad × grupo × gestion). Cachea 30 min. Filtros se aplican client-side sobre el array.

```ts
export type KpiRow = {
  canal: 'medios'|'instagram'|'tiktok'|'facebook'|'linkedin'|'twitter'|'mybusiness';
  titularidad: string | null;
  grupo_hospitalario: string | null;
  gestion_hospitalaria: string | null;
  menciones: number;
  nota_media: number | null;
  preocupacion: number | null; rechazo: number | null; descredito: number | null;
  afinidad: number | null; fiabilidad: number | null; admiracion: number | null;
  impacto: number | null; influencia: number | null;
  peligro_bajo: number; peligro_medio_bajo: number; peligro_medio: number;
  peligro_medio_alto: number; peligro_alto: number; peligro_critico: number;
  peligro_real: number;            // ALTO + CRÍTICO + MEDIO_ALTO
  peligro_no_procede: number;
  fecha_max: string | null;
};

useKpiCanalGlobal()  // useQuery key=['kpi_canal_global'], devuelve KpiRow[]
```

Helpers exportados:
- `aggregateKpi(rows: KpiRow[])` → suma `menciones`, pondera `nota_media` por menciones, suma todos los buckets de peligro, devuelve `fechaMax`.
- `filterByCanal(rows, canal)`, `filterByTitularidad`, `filterByGestionLike(rows, 'SERMAS%')`, `filterByGestionExacta`, `filterByGrupo`. Composables.

### 2. Refactor páginas Resumen (totales correctos, una sola query)

- **`PrivadosResumen.tsx`**: filtra `titularidad === 'Privado'` agrupando por `grupo_hospitalario` para el ranking 8-grupos. Mantiene la UI tal cual.
- **`SermasResumen.tsx`**: filtra `gestion_hospitalaria` ILIKE `SERMAS%` y separa Total / Gestión QS / Sin QS / FJD client-side.
- **`CatsalutResumen.tsx`**: ILIKE `CATSALUT%` + separación Total / Concierto QS / Sin QS.

Cada página deja de hacer 7 queries paralelas a `v_canal_*` para totales — todo sale de la misma `KpiRow[]` global.

### 3. Refactor páginas Channel (segmentos + perfil + riesgo)

- **`PrivadosChannelPage.tsx`**, **`SermasChannelPage.tsx`**, **`CatsalutChannelPage.tsx`**, **`FJDPage.tsx`**:
  - **KPIs y perfil reputacional** salen de `useKpiCanalGlobal()` filtrado por `canal` + segmento.
  - **Listas (`MencionesRecientes`)** se mantienen exactamente como están: leen tablas rápidas con `id DESC` y `limit(50)` — esa parte ya no agrega.
  - Se elimina el bloque `fetchChannelStats` que leía 5.000 filas de `v_canal_*` para luego sumar; pasa a `aggregateKpi(filterByCanal(filterByGestionLike(rows, 'SERMAS%'), cfg.canal))`.

- **Nuevo KPI `% riesgo real`** en cada Channel: `peligro_real / menciones`. Card discreta junto a Nota IA.

### 4. `useCanalData` — restringir a listas paginadas

Cambiar default `limit(2000)` → `limit(50)`, exponer parámetro `limit` opcional y un `count` con `select('*', { count: 'exact', head: false })` para mostrar "mostrando 50 de N" (N viene realmente del KPI, pero el count exacto es backup). Marcar el hook como **solo para listas**, no para totales.

### 5. Validación

Comparar contra los números de referencia que diste:
```
PrivadosNoticias → Total: 33.933 (sumando los 8 grupos)
SermasTikTok    → SERMAS Total: 18.578 | Gestión QS: 3.101 | FJD: 1.385
CatsalutMedios  → CATSALUT Total: 215 | Concierto QS: 17
```
Si algo no cuadra, log de la `KpiRow[]` global en consola para debugging.

### Archivos tocados

Crear:
- `src/hooks/useKpiCanal.ts`

Editar:
- `src/pages/dashboard/privados/PrivadosResumen.tsx`
- `src/pages/dashboard/privados/PrivadosChannelPage.tsx`
- `src/pages/dashboard/sermas/SermasResumen.tsx`
- `src/pages/dashboard/sermas/SermasChannelPage.tsx`
- `src/pages/dashboard/catsalut/CatsalutResumen.tsx`
- `src/pages/dashboard/catsalut/CatsalutChannelPage.tsx`
- `src/pages/dashboard/fjd/FJDPage.tsx`
- `src/hooks/useCanalData.ts` (limit a 50, marcar solo-listas)

### Pre-requisito (tú, en Supabase)

`v_kpi_canal_30d` tiene que ser **MATERIALIZED VIEW** con índices en `(canal, titularidad)`, `(canal, gestion_hospitalaria)`, `(canal, grupo_hospitalario)` y un cron de refresh (cada 30-60 min basta — los datos del dashboard son a 30 días). Sin esto la query global timeoutea igual.

**Confírmame que la vista materializada está creada** y procedo con el refactor.
