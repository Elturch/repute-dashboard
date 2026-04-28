import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { useKpiCanalGlobal, filterByCanal, aggregateKpi, filterByTitularidad, filterByGestionLike, filterByGrupo } from "@/hooks/useKpiCanal";
import type { Canal } from "@/hooks/useCanalData";
import {
  TvPanelLayout, BigKpi, SubKpiBand, TopHospitalesTable,
  PeligroDistribucion, TopFuentesList, EvolucionSparkline,
} from "./TvParts";

export function TvCanalPanel({
  canal, titulo, currentIndex, total, progress,
}: {
  canal: Canal; titulo: string; currentIndex: number; total: number; progress: number;
}) {
  const { data: kpiRows } = useKpiCanalGlobal();
  const { data: rawRows } = useQuery({
    queryKey: ['tv-canal-raw', canal],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from(`v_canal_${canal}`)
        .select('fuente, autor, fecha, peligro')
        .order('fecha', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filas = filterByCanal(kpiRows ?? [], canal);
  const tot = aggregateKpi(filas);

  const privados = aggregateKpi(filterByTitularidad(filas, 'Privado'));
  const sermas   = aggregateKpi(filterByGestionLike(filas, 'SERMAS%'));
  const catsalut = aggregateKpi(filterByGestionLike(filas, 'CATSALUT%'));
  const fjd      = aggregateKpi(filterByGrupo(filas, 'Hospital Fundación Jiménez Díaz'));

  const porHospital = useMemo(() => {
    const m = new Map<string, number>();
    filas.forEach(r => {
      const g = r.grupo_hospitalario ?? '—';
      m.set(g, (m.get(g) ?? 0) + (r.menciones ?? 0));
    });
    return Array.from(m, ([grupo, n]) => ({ grupo, n })).sort((a, b) => b.n - a.n);
  }, [filas]);

  const peligro = {
    bajo:      filas.reduce((a, r) => a + (r.peligro_bajo ?? 0), 0),
    medio:     filas.reduce((a, r) => a + (r.peligro_medio ?? 0) + (r.peligro_medio_bajo ?? 0), 0),
    medioAlto: filas.reduce((a, r) => a + (r.peligro_medio_alto ?? 0), 0),
    alto:      filas.reduce((a, r) => a + (r.peligro_alto ?? 0) + (r.peligro_critico ?? 0), 0),
  };

  // El campo "fuente" en socials a veces es null → caer a autor
  const fuenteKey: 'fuente' | 'autor' = canal === 'medios' ? 'fuente' : 'autor';
  const fuenteTitle = canal === 'medios' ? 'TOP FUENTES' : canal === 'mybusiness' ? 'TOP HOSPITALES (RESEÑAS)' : 'TOP CUENTAS';

  const topFuentes = useMemo(() => {
    if (!rawRows) return [];
    const m = new Map<string, number>();
    rawRows.forEach((r: any) => {
      const v: string | null = r[fuenteKey] ?? r.fuente ?? r.autor;
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    });
    return Array.from(m, ([fuente, n]) => ({ fuente, n })).sort((a, b) => b.n - a.n).slice(0, 5);
  }, [rawRows, fuenteKey]);

  const evolucion = useMemo(() => {
    if (!rawRows) return [];
    const m = new Map<string, number>();
    rawRows.forEach((r: any) => {
      const d = typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : null;
      if (d) m.set(d, (m.get(d) ?? 0) + 1);
    });
    return Array.from(m, ([fecha, n]) => ({ fecha, n })).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [rawRows]);

  return (
    <TvPanelLayout titulo={titulo} currentIndex={currentIndex} total={total} progress={progress}>
      <BigKpi value={tot.menciones} label="Menciones" sub="últimos 30 días" />
      <SubKpiBand items={[
        { label: 'Privados', value: privados.menciones },
        { label: 'SERMAS',   value: sermas.menciones,   accentClass: 'text-sky-400' },
        { label: 'CATSALUT', value: catsalut.menciones, accentClass: 'text-violet-400' },
        { label: 'FJD',      value: fjd.menciones,      accentClass: 'text-amber-400' },
      ]} />
      <TopHospitalesTable rows={porHospital} max={8} />
      <PeligroDistribucion data={peligro} />
      <TopFuentesList rows={topFuentes} title={fuenteTitle} />
      <EvolucionSparkline data={evolucion} />
    </TvPanelLayout>
  );
}
