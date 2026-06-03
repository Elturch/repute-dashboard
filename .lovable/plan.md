# Desglose por canal en FJD

Hoy en `/dashboard/fjd` los KPIs son totales (menciones, nota IA media, % riesgo, reseñas Google) y el detalle por canal solo muestra **conteos** (barra horizontal) y **evolución temporal**. Falta lo importante: **cómo se comporta FJD en cada canal** (no solo cuánto se habla).

## Qué añadir

Una nueva sección **"Comportamiento por canal"** justo después de "Distribución por canal", antes de "Evolución temporal". Una tarjeta por canal con métricas clave calculadas sobre las menciones de ese canal.

### Tarjeta por canal

Grid responsive (1 / 2 / 3 / 4 columnas según viewport). Cada tarjeta:

```text
┌─────────────────────────────┐
│ [icon] TikTok      1.240    │  ← canal + total menciones
├─────────────────────────────┤
│ Nota IA          4.2 / 10   │  ← color verde/amarillo/rojo
│ Riesgo alto+crít   12.3%    │
├─────────────────────────────┤
│ Positivas (↑ mejor)         │
│  Afinidad      ▇▇▇▇░  6.1   │
│  Fiabilidad    ▇▇▇░░  5.4   │
│  Admiración    ▇▇░░░  3.8   │
│  Impacto       ▇▇▇▇░  6.0   │
│ Negativas (↓ mejor)         │
│  Preocupación  ▇▇░░░  3.2   │
│  Rechazo       ▇░░░░  1.8   │
│  Descrédito    ▇░░░░  1.5   │
└─────────────────────────────┘
```

- Barra mini con color: **verde** para positivas, **rojo/ámbar** para negativas (consistente con la convención `positive ↑ / negative ↓` ya introducida en `PerfilReputacionalIA`).
- Si el canal tiene 0 menciones, mostrar tarjeta apagada con "Sin menciones en 30 días".
- En `mybusiness` añadir además una línea extra "★ rating medio · N reseñas".

## Fuente de datos

Reutilizar `useFJDMenciones()` (ya cargado en la página) y agregar **client-side** por `canal` con la misma `avg()` que ya existe en el archivo. Métricas a promediar: `nota_media`, `afinidad`, `fiabilidad`, `admiracion`, `impacto`, `preocupacion`, `rechazo`, `descredito`. Riesgo alto/crítico = `count(peligro ∈ {ALTO, CRÍTICO}) / count`.

No hace falta tocar hooks ni la base de datos. No hace falta nuevas vistas.

## Archivos

- `src/pages/dashboard/fjd/FJDPage.tsx`: añadir `useMemo` `comportamientoCanal` y nueva `<section>` con grid de tarjetas. Subcomponente local `CanalCard`.

Sin cambios en otras páginas, hooks, ni esquema de datos.
