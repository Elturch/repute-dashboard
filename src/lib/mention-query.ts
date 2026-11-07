import { externalSupabase } from '@/integrations/external-supabase/client';
import type { Canal, SegmentoFiltro } from '@/hooks/useCanalData';

export type MentionSegment = SegmentoFiltro & { grupos?: string[] };

/** Always use the clean corpus; segment filters are additional, never a substitute. */
export function cleanMentionQuery(canal: Canal, desde: string, hasta: string, segmento: MentionSegment = {}) {
  let query = externalSupabase.rpc('canal_items', { p_canal: canal, p_desde: desde, p_hasta: hasta }).select('*', { count: 'exact' });
  if (segmento.titularidad) query = Array.isArray(segmento.titularidad)
    ? query.in('titularidad', segmento.titularidad) : query.eq('titularidad', segmento.titularidad);
  if (segmento.gestionLike) query = query.ilike('gestion_hospitalaria', segmento.gestionLike);
  if (segmento.gestionExacta) query = query.eq('gestion_hospitalaria', segmento.gestionExacta);
  if (segmento.grupoHospitalario) query = query.eq('grupo_hospitalario', segmento.grupoHospitalario);
  if (segmento.grupos?.length) query = query.in('grupo_hospitalario', segmento.grupos);
  return query;
}