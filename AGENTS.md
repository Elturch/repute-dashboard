# Architecture rules

- All dashboard radars render through `RadarDimensiones` (one design); with a comparison set of 3+ entities each axis is scaled to their range via `radarAxisPos` (domain 0–100, no tick numbers, real score in tooltip), otherwise it falls back to the shared `radarDomain` helper on plotted values. Why: one consistent look, decimal differences visible, honest scores.