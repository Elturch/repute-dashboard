

# Plan: Métricas reales y separación por canal

## Problema actual

1. **Métricas inventadas**: "Fortaleza", "Riesgo" y "Potencia" son composites arbitrarios que no existen en la BD. Los campos reales son las **9 métricas emocionales individuales** + `nota_media_ponderada` + `peligro_reputacional`.
2. **Sin separación por canal**: Todo se agrega en un número por grupo. No se distingue Noticias de Facebook de Instagram, etc.

## Cambios

### 1. `src/lib/data-aggregation.ts` — Eliminar métricas inventadas

Reemplazar `ChannelAgg` para exponer las 9 métricas reales individualmente:

```typescript
export interface ChannelAgg {
  channel: string;
  label: string;
  count: number;
  nota: number;           // nota_media_ponderada (real)
  preocupacion: number;   // real
  rechazo: number;        // real
  descredito: number;     // real
  afinidad: number;       // real
  fiabilidad: number;     // real
  admiracion: number;     // real
  impacto: number;        // real
  influencia: number;     // real
  compromiso: number;     // real
  peligroAltoPct: number; // % peligro alto/critico (real)
  avgRating: number|null; // solo MyBusiness
}
```

Eliminar los campos `fortaleza`, `riesgo`, `potencia` de `ChannelAgg` y `GroupAgg`. La función `aggregateChannel` devolverá cada métrica real por separado sin inventar composites.

### 2. `src/pages/dashboard/core/Ecosistema.tsx` — Métricas reales + desglose por canal

Cada grupo mostrará:
- `nota_media_ponderada` como KPI principal
- Una tabla con cada canal (Noticias, FB, IG, TikTok, X, LinkedIn, MyBusiness) mostrando: menciones, nota, y las 9 métricas emocionales reales
- `peligro_reputacional` como badge por canal
- Sin "Fortaleza", "Riesgo" ni "Potencia"

### 3. `src/pages/dashboard/core/Canales.tsx` — Desglose real por plataforma

Cada fila de canal mostrará las 9 métricas reales, no composites inventados. La comparativa entre grupos dentro de cada canal usará los campos tal cual vienen de la BD.

### 4. Actualizar `GroupAgg` en data-aggregation

Eliminar `fortaleza`, `riesgo`, `potencia` de `GroupAgg`. Agregar las 9 métricas reales como promedios ponderados por volumen.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/lib/data-aggregation.ts` | Eliminar composites, exponer 9 métricas reales |
| `src/hooks/useGroupChannels.ts` | Sin cambios (ya funciona bien) |
| `src/pages/dashboard/core/Ecosistema.tsx` | Mostrar métricas reales + desglose por canal |
| `src/pages/dashboard/core/Canales.tsx` | Métricas reales por plataforma |
| `src/pages/dashboard/core/MediosGlobal.tsx` | Actualizar a nuevos campos |
| `src/pages/dashboard/core/Riesgo.tsx` | Actualizar a nuevos campos |
| `src/pages/dashboard/core/EvolucionGlobal.tsx` | Actualizar a nuevos campos |

## Resultado
Cero métricas inventadas. Cada dashboard muestra los campos exactos de la BD (9 emocionales + nota + peligro), desglosados por canal y por grupo.

