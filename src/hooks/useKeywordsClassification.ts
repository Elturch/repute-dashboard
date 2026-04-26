// src/hooks/useKeywordsClassification.ts
// Hook que carga public.keywords desde el Supabase externo y devuelve:
// - el array crudo
// - una función `clasificar(texto)` que detecta a qué clasificación pertenece un termino/Tema/header.
// La tabla `keywords` la mantiene Tasklet, así que esto se mantiene siempre fresco sin tocar código.

import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import {
  type Clasificacion,
  type Titularidad,
  type GestionHospitalaria,
  bloqueDashboardFromGestion,
  NOMBRES_GRUPOS_PRIVADOS,
  type GrupoPrivado,
} from '@/lib/clasificacion';

interface KeywordRow {
  termino: string | null;
  titularidad: string | null;
  grupo_hospitalario: string | null;
  gestion_hospitalaria: string | null;
  gh_agrupado: string | null;
  ccaa: string | null;
  localidad: string | null;
}

/** Quita comillas dobles externas, baja a minúsculas y recorta espacios. */
function normalizar(t: string): string {
  return t
    .toLowerCase()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface KeywordsIndex {
  rows: KeywordRow[];
  /** Lista ordenada (más larga primero) de patrones para hacer matching por substring. */
  patterns: { pattern: string; row: KeywordRow }[];
}

function buildIndex(rows: KeywordRow[]): KeywordsIndex {
  const patterns = rows
    .filter((r): r is KeywordRow & { termino: string } => !!r.termino)
    .map(r => ({ pattern: normalizar(r.termino), row: r }))
    .sort((a, b) => b.pattern.length - a.pattern.length); // más específicos primero
  return { rows, patterns };
}

function rowToClasificacion(row: KeywordRow): Clasificacion {
  const gestion = (row.gestion_hospitalaria as GestionHospitalaria) ?? null;
  return {
    termino: row.termino ?? '',
    titularidad: (row.titularidad as Titularidad) ?? null,
    grupoHospitalario: row.grupo_hospitalario ?? null,
    gestionHospitalaria: gestion,
    ghAgrupado: row.gh_agrupado === 'si',
    ccaa: row.ccaa ?? null,
    localidad: row.localidad ?? null,
    bloque: bloqueDashboardFromGestion(gestion),
  };
}

export function useKeywordsClassification() {
  return useQuery({
    queryKey: ['keywords_classification'],
    staleTime: 30 * 60 * 1000, // 30 min — la tabla cambia poco
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('keywords')
        .select('termino, titularidad, grupo_hospitalario, gestion_hospitalaria, gh_agrupado, ccaa, localidad');

      if (error) {
        console.error('[useKeywordsClassification] error cargando keywords:', error);
        return {
          rows: [] as KeywordRow[],
          clasificar: (_: string | null | undefined) => null as Clasificacion | null,
        };
      }

      const index = buildIndex((data ?? []) as KeywordRow[]);

      function clasificar(texto: string | null | undefined): Clasificacion | null {
        if (!texto) return null;
        const t = normalizar(texto);
        for (const { pattern, row } of index.patterns) {
          if (t.includes(pattern)) return rowToClasificacion(row);
        }
        return null;
      }

      const patternsByGrupo: Record<GrupoPrivado, string[]> = {} as Record<GrupoPrivado, string[]>;
      for (const grupo of NOMBRES_GRUPOS_PRIVADOS) patternsByGrupo[grupo] = [];

      for (const row of (data ?? []) as KeywordRow[]) {
        if (!row.termino) continue;
        const gestion = (row.gestion_hospitalaria as GestionHospitalaria) ?? null;
        const bloque = bloqueDashboardFromGestion(gestion);
        if (bloque !== 'privados') continue;
        const grupo = row.grupo_hospitalario;
        if (!grupo || !(NOMBRES_GRUPOS_PRIVADOS as string[]).includes(grupo)) continue;
        patternsByGrupo[grupo as GrupoPrivado].push(normalizar(row.termino));
      }

      return { rows: index.rows, clasificar, patternsByGrupo };
    },
  });
}