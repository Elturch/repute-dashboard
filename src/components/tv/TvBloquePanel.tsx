import { useMemo } from "react";
import { useKpiCanalGlobal, filterByGestionLike, filterByGrupo, aggregateKpi, filterByCanal, type KpiRow } from "@/hooks/useKpiCanal";
import { ALL_CANALES } from "@/hooks/useCanalData";
import {
  TvPanelLayout, BigKpi, SubKpiBand, TopHospitalesTable,
  PeligroDistribucion, CanalMosaic,
} from "./TvParts";

type Bloque = 'sermas' | 'catsalut' | 'fjd';

export function TvBloquePanel({
  bloque, titulo, currentIndex, total, progress,
}: {
  bloque: Bloque; titulo: string; currentIndex: number; total: number; progress: number;
}) {
  const { data: kpiRows } = useKpiCanalGlobal();

  const cfg = useMemo(() => {
    if (bloque === 'sermas') {
      return {
        accent: 'text-sky-400',
        filtro: (r: KpiRow) => r.gestion_hospitalaria?.startsWith('SERMAS') ?? false,
      };
    }
    if (bloque === 'catsalut') {
      return {
        accent: 'text-violet-400',
        filtro: (r: KpiRow) => r.gestion_hospitalaria?.startsWith('CATSALUT') ?? false,
      };
    }
    return {
      accent: 'text-amber-400',
      filtro: (r: KpiRow) => r.grupo_hospitalario === 'Hospital Fundación Jiménez Díaz',
    };
  }, [bloque]);

  const filas = (kpiRows ?? []).filter(cfg.filtro);
  const tot = aggregateKpi(filas);

  // Mosaico de 7 canales
  const porCanal = ALL_CANALES.map(c => ({
    canal: c,
    total: aggregateKpi(filterByCanal(filas, c)).menciones,
  }));

  // Sub-KPIs por bloque
  let subKpis: Array<{ label: string; value: number; accentClass?: string }> = [];
  if (bloque === 'sermas') {
    const qs  = aggregateKpi(filas.filter(r => r.gestion_hospitalaria === 'SERMAS - Quirónsalud (gestión)'));
    const sin = aggregateKpi(filas.filter(r => r.gestion_hospitalaria === 'SERMAS'));
    const fjd = aggregateKpi(filterByGrupo(filas, 'Hospital Fundación Jiménez Díaz'));
    subKpis = [
      { label: 'Total',      value: tot.menciones,  accentClass: 'text-sky-400' },
      { label: 'Gestión QS', value: qs.menciones,   accentClass: 'text-primary' },
      { label: 'Sin QS',     value: sin.menciones },
      { label: 'FJD',        value: fjd.menciones,  accentClass: 'text-amber-400' },
    ];
  } else if (bloque === 'catsalut') {
    const qs  = aggregateKpi(filas.filter(r => r.gestion_hospitalaria === 'CATSALUT - Quirónsalud (concierto)'));
    const sin = aggregateKpi(filas.filter(r => r.gestion_hospitalaria === 'CATSALUT'));
    subKpis = [
      { label: 'Total',        value: tot.menciones, accentClass: 'text-violet-400' },
      { label: 'Concierto QS', value: qs.menciones,  accentClass: 'text-primary' },
      { label: 'Sin QS',       value: sin.menciones },
    ];
  } else {
    subKpis = [
      { label: 'Menciones', value: tot.menciones, accentClass: 'text-amber-400' },
      { label: '% Riesgo real', value: Math.round(tot.pctRiesgoReal), accentClass: 'text-orange-400' },
      { label: 'Nota media',    value: tot.notaMedia ? Math.round(tot.notaMedia * 10) / 10 : 0 },
    ];
  }

  // Top hospitales (sólo bloques con varios grupos)
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

  return (
    <TvPanelLayout titulo={titulo} accentClass={cfg.accent} currentIndex={currentIndex} total={total} progress={progress}>
      <BigKpi value={tot.menciones} label="Menciones totales" sub="últimos 30 días" />
      <SubKpiBand items={subKpis} />
      <CanalMosaic items={porCanal} />
      {bloque !== 'fjd' && <TopHospitalesTable rows={porHospital} max={bloque === 'catsalut' ? 3 : 8} />}
      <PeligroDistribucion data={peligro} />
    </TvPanelLayout>
  );
}
