# Architecture rules

- Mention lists must query `canal_items` through the shared clean query helper with the same segment and global period as their `kpi_canal` totals; no raw-view fallback. Why: avoid irrelevant mentions and count mismatches.

- All dashboard radars render through `RadarDimensiones` (one design); with a comparison set of 3+ entities each axis is scaled to their range via `radarAxisPos` (domain 0–100, no tick numbers, real score in tooltip), otherwise it falls back to the shared `radarDomain` helper on plotted values. Why: one consistent look, decimal differences visible, honest scores.- Hospital pages (/dashboard/fjd and /dashboard/sermas/:nivel/:slug) all render `HospitalDashboard`, configured from `NIVELES` in sermasNiveles.ts and fed by kpi_canal + canal_items for the global period. Why: one rich, period-aware hospital view.
