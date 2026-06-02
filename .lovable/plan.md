
## Problema

En `/dashboard/fjd` el componente `PerfilReputacionalIA` se está alimentando con `perfilEmpty` tanto en `total` como en `resto`, así que no hay comparación real. Visualmente FJD aparece sola y, en otros indicadores, queda contrastada implícitamente contra "el total del mercado" (privados + SERMAS + CATSALUT), lo cual no es justo: la FJD es un hospital del SERMAS gestionado por QS, y la comparativa relevante es **FJD vs resto de hospitales SERMAS**, donde históricamente FJD sale líder.

## Cambio

En `src/pages/dashboard/fjd/FJDPage.tsx`, dentro del `useMemo` que prepara los buckets del perfil:

1. Filtrar `kpiRows` por `filterByGestionLike(rows, 'SERMAS%')` → todas las filas SERMAS (gestión QS y no QS).
2. Construir tres buckets vía `aggregateKpi` + `toPerfilBucket`:
   - **`highlight`**: solo filas de la FJD (ya se hace con `filterByGrupo`).
   - **`resto`**: SERMAS excluyendo FJD → etiqueta `"Resto SERMAS"`.
   - **`total`**: SERMAS completo (incluida FJD) → etiqueta `"Total SERMAS"`.
3. Pasar al componente:
   ```text
   contextLabel="FJD vs hospitales SERMAS · 30 días"
   highlightLabel="FJD"
   highlightColor="#f59e0b"
   ```

Con esto el radar mostrará FJD vs Resto SERMAS y la tabla de métricas comparará correctamente; el subtítulo dejará claro que la base es SERMAS, no el mercado entero.

## Detalles técnicos

- Los promedios (`influencia`, `fiabilidad`, etc.) ya están ponderados por menciones en `aggregateKpi`, así que la comparación es consistente.
- Mantener `menciones` del `highlight` desde el agregado de la vista (no desde `menciones.length` del hook de menciones recientes, que está capado).
- El resto de la página (KPIs superiores, distribución por canal, evolución, lista de menciones recientes) **no se toca** — siguen siendo vistas FJD-only correctas.
- No hace falta migración ni cambios en hooks; todo se resuelve con los helpers ya existentes (`filterByGestionLike`, `filterByGrupo`, `aggregateKpi`, `toPerfilBucket`).

## Verificación

1. Cargar `/dashboard/fjd` → el bloque "Perfil reputacional IA" muestra dos series (FJD ámbar y Resto SERMAS), no una sola línea.
2. El contador "X dimensiones lidera" debe ser alto (FJD sale ganadora en la mayoría de métricas positivas frente al SERMAS no-QS).
3. El contextLabel debe leer "FJD vs hospitales SERMAS · 30 días".
