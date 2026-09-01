import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

export const CANAL_LABELS: Record<string, string> = {
  medios: 'Medios',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  mybusiness: 'Reseñas Google',
};

export interface ChannelRow {
  canal: string;
  label: string;
  n: number;
  nota_media: number;
  preocupacion: number;
  rechazo: number;
  descredito: number;
  afinidad: number;
  fiabilidad: number;
  admiracion: number;
  impacto: number;
  influencia: number;
  peligro_alto_pct: number;
}

const num = (v: unknown) => (v == null ? 0 : Number(v) || 0);

export function useSegmentoCanales() {
  return useQuery({
    queryKey: ['v_benchmark_segmento_canal'],
    queryFn: async (): Promise<Record<string, ChannelRow[]>> => {
      const { data, error } = await externalSupabase
        .from('v_benchmark_segmento_canal')
        .select('*');
      if (error) throw error;

      const out: Record<string, ChannelRow[]> = {};
      for (const r of (data ?? []) as any[]) {
        const canal = String(r.canal ?? '');
        const row: ChannelRow = {
          canal,
          label: CANAL_LABELS[canal] ?? canal,
          n: num(r.n),
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
        };
        const key = String(r.seg_key ?? '');
        (out[key] ??= []).push(row);
      }
      for (const k of Object.keys(out)) out[k].sort((a, b) => b.n - a.n);
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });
}
