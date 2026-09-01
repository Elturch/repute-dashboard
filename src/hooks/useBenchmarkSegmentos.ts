import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import type { GroupAggregated } from '@/hooks/useBenchmarkData';

interface SegmentoRow {
  seg_key: string;
  label: string;
  primary: boolean | null;
  n: number | null;
  nota_media: number | null;
  preocupacion: number | null;
  rechazo: number | null;
  descredito: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  impacto: number | null;
  influencia: number | null;
  peligro_real: number | null;
  peligro_alto_pct: number | null;
}

const num = (v: unknown) => (v == null ? 0 : Number(v) || 0);

export interface SegmentoAggregated extends GroupAggregated {
  peligro_real: number;
}

function mapRow(r: SegmentoRow): SegmentoAggregated {
  return {
    key: r.seg_key,
    label: r.label,
    primary: !!r.primary,
    count: num(r.n),
    nota_media: num(r.nota_media),
    preocupacion: num(r.preocupacion),
    rechazo: num(r.rechazo),
    descredito: num(r.descredito),
    afinidad: num(r.afinidad),
    fiabilidad: num(r.fiabilidad),
    admiracion: num(r.admiracion),
    impacto: num(r.impacto),
    influencia: num(r.influencia),
    peligro_alto_pct: num(r.peligro_alto_pct),
    peligro_real: num(r.peligro_real),
  };
}

export function useBenchmarkSegmentos() {
  return useQuery({
    queryKey: ['v_benchmark_segmentos'],
    queryFn: async (): Promise<SegmentoAggregated[]> => {
      const { data, error } = await externalSupabase
        .from('v_benchmark_segmentos')
        .select('*');
      if (error) throw error;
      return ((data ?? []) as SegmentoRow[]).map(mapRow);
    },
    staleTime: 5 * 60 * 1000,
  });
}
