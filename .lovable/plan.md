

# Plan: Auditoría SQL completa de la BD externa

## Problema
No puedo ejecutar queries contra la base de datos externa (`pbzojbamztzdhlvxwhyw.supabase.co`) desde el modo actual. El tool `supabase--read_query` solo accede a la BD interna de Lovable Cloud. Necesito modo implementación para lanzar las consultas via curl o script.

## Paso 1: Extraer definiciones SQL de las 54 vistas

Ejecutar via curl contra la API REST de la BD externa (usando la anon key ya configurada) o, preferiblemente, via un script Node que use `externalSupabase.rpc()`. Sin embargo, `pg_views` y `information_schema` no están expuestos via PostgREST con anon key.

**Alternativa viable**: Crear un script temporal que haga `curl` contra el endpoint REST probando cada vista con `?select=*&limit=1` para extraer columnas reales, y luego inferir los filtros comparando columnas y datos entre vistas hermanas.

**Queries a ejecutar** (5 scripts curl en paralelo):
1. Para cada una de las 54 vistas: `GET /rest/v1/{view}?select=*&limit=3` → extraer columnas + muestra de datos
2. `GET /rest/v1/keywords?select=*&limit=100` → taxonomía completa
3. `GET /rest/v1/tipo_hospital?select=*` → mapeo hospital → grupo
4. `GET /rest/v1/dominios?select=*&limit=50` → dominios de medios
5. `GET /rest/v1/sites?select=*&limit=50` → fuentes configuradas

## Paso 2: Documentar el modelo

Con los datos extraídos, generar un documento `/mnt/documents/database_audit.md` con:
1. Qué representa cada vista
2. Qué filtros aplica (inferidos de los datos: qué `Grupo_hospitalario`, `titularidad`, keywords aparecen)
3. Campos de segmentación disponibles
4. Ambigüedades y solapes detectados (ej: CatSalut vs CatSalut_QS vs CatSalut_solo_QS)
5. Modelo de filtros globales recomendado

## Paso 3: Guardar en memoria del proyecto

Crear `mem://reference/db-schema-full` con el inventario completo para uso en todas las implementaciones posteriores.

## Archivos generados
- `/mnt/documents/database_audit.md` — Auditoría completa
- `mem://reference/db-schema-full` — Referencia persistente para el proyecto

## Limitación
`pg_views.definition` (el SQL real de cada vista) NO es accesible via PostgREST con anon key. Solo el propietario de la BD puede verlo. Si necesitas el SQL exacto de los filtros, tendrías que facilitarme la service_role key o pegar aquí el resultado de `SELECT viewname, definition FROM pg_views WHERE schemaname = 'public'`. Sin eso, inferiré la lógica de filtrado analizando los datos reales que devuelve cada vista.

