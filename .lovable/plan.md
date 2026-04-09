

# Plan: Implementar capa de datos + 5 dashboards con datos reales

## Bloque 1: Capa de datos compartida (3 archivos nuevos)

### `src/lib/data-aggregation.ts`
Funciones compartidas extraídas de `useFJDData.ts`: `normalize()` (maneja PascalCase/snake_case), `avg()`, `aggregateChannel()`. Reutilizables por todos los hooks.

### `src/hooks/useGroupChannels.ts`
Hook genérico que dado un grupo (`quironsalud`, `sermas`, `catsalut`, etc.) consulta TODOS sus canales (noticias + FB + IG + TikTok + X + LinkedIn + MyBusiness). Configuración por grupo:

```text
quironsalud  → 5 vistas (noticias + 4 redes)
gh_privados  → 5 vistas
sermas       → 7 vistas (+ linkedin + my_business)
gestion_qs   → 5 vistas
catsalut     → 5 vistas
catsalut_qs  → 5 vistas
fjd          → 6 vistas (ya en useFJDData, se reutiliza)
general      → 6 vistas (_general_filtradas + linkedin_gh)
alta_compl   → 1 vista (solo noticias)
```

### `src/hooks/useAuxiliaryData.ts`
Hooks para tablas auxiliares: `useCrossAmplification()`, `useMediaProfiles()`, `useKeywords()`, `useTipoHospital()`.

## Bloque 2: Refactor de `useFJDData.ts`
Importar `normalize`/`avg`/`aggregateChannel` desde `data-aggregation.ts` en lugar de definirlos inline. Sin cambio funcional.

## Bloque 3: Reescritura de 5 dashboards

### 1. Ecosistema (`Ecosistema.tsx`)
- Grid de 9 grupos con KPIs reales (nota, fortaleza, riesgo, volumen por canal)
- Quironsalud destacado como grupo primario
- Tabla comparativa con 9 metricas emocionales
- Datos de `useGroupChannels` para cada grupo

### 2. Canales (`Canales.tsx`)
- Una fila por canal (Noticias, FB, IG, TikTok, X, LinkedIn, MyBusiness)
- Volumen total sumando todos los grupos, nota media, riesgo
- Comparativa entre grupos dentro de cada canal

### 3. MediosGlobal (`MediosGlobal.tsx`)
- `noticias_general_filtradas` para panoramica de todos los medios
- Agrupacion por `Paper`/medio
- Top medios por volumen, nota media, distribucion de riesgo

### 4. EvolucionGlobal (`EvolucionGlobal.tsx`)
- `weekly_snapshots` (39 semanas) + `contadores_semanales` (4 semanas)
- Graficos de area con Recharts
- `relato_acumulado` para contexto narrativo

### 5. Riesgo (`Riesgo.tsx`)
- `alert_cascades` (12 cascadas con datos reales)
- `cross_amplification` para amplificacion entre plataformas
- Distribucion por nivel de riesgo, estado y fuente

## Archivos modificados/creados

| Archivo | Accion |
|---------|--------|
| `src/lib/data-aggregation.ts` | CREAR |
| `src/hooks/useGroupChannels.ts` | CREAR |
| `src/hooks/useAuxiliaryData.ts` | CREAR |
| `src/hooks/useFJDData.ts` | REFACTOR (importar compartidos) |
| `src/pages/dashboard/core/Ecosistema.tsx` | REESCRIBIR |
| `src/pages/dashboard/core/Canales.tsx` | REESCRIBIR |
| `src/pages/dashboard/core/MediosGlobal.tsx` | REESCRIBIR |
| `src/pages/dashboard/core/EvolucionGlobal.tsx` | REESCRIBIR |
| `src/pages/dashboard/core/Riesgo.tsx` | REESCRIBIR |

## Resultado
76 vistas consumidas. Cero placeholders. Todos los dashboards core con datos reales y universos separados.

