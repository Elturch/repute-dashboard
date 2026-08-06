## Verificar y arreglar MyBusiness en Privados (HM, HLA, Ribera)

### Estado según la base de datos
La vista `v_kpi_canal_30d` (canal=mybusiness, titularidad=Privado) **sí contiene** los 8 grupos privados:

| Grupo            | Menciones |
|------------------|-----------|
| HLA Hospitales   | 867       |
| Quirónsalud      | 330       |
| Vithas           | 316       |
| HM Hospitales    | 233       |
| Viamed           | 79        |
| Hospiten         | 33        |
| Sanitas          | 21        |
| Ribera Salud     | 18        |

El código de `PrivadosChannelPage.tsx` filtra por `titularidad='Privado'` + `canal='mybusiness'` y recorre `NOMBRES_GRUPOS_PRIVADOS` (que incluye HM/HLA/Ribera). En teoría debería pintar esas cifras.

### Pasos en build mode

1. **Verificación en vivo** — abrir `/dashboard/privados/mybusiness` con Playwright headless y capturar la tabla "Grupo hospitalario". Comparar con la tabla de arriba.

2. **Si las cifras coinciden con la BD** (HLA 867, HM 233, Ribera 18) → no hay bug. Cierro el ticket con un screenshot mostrando que sí salen.

3. **Si alguna sale a 0** → debuggear la cadena de filtros:
   - Confirmar que `kpiRows` trae las 8 filas de mybusiness/Privado (log del array filtrado).
   - Verificar que `NOMBRES_GRUPOS_PRIVADOS` en `src/lib/grupos-privados.ts` coincide exactamente con los strings de la BD (`HLA Hospitales`, `HM Hospitales`, `Ribera Salud` — case-sensitive, con tildes).
   - Si hay desfase de strings, normalizar la lista canónica.

4. **Recordatorio para LinkedIn**: dejar una nota (no UI) en el plan: HM / HLA / Ribera no aparecen porque el scraper de Tasklet no captura sus páginas de LinkedIn. No tocamos el dashboard por eso — lo arreglará Tasklet añadiendo esos 3 perfiles al job.

### Sin cambios fuera de alcance
No toco la lógica de agregación, ni los hooks, ni el panel de LinkedIn. Solo verifico y, si procede, corrijo el bug puntual de MyBusiness.
