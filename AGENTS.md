# Architecture rules

- CanalCard radars scale each axis to the compared entities' range via `radarAxisPos` (domain 0–100, no tick numbers, real score in tooltip); other radars with a single series use the shared `radarDomain` helper with plotted values only. Why: decimal differences must be visible while scores stay honest.