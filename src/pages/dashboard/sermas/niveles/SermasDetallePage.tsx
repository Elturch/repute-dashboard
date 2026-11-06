import { useMemo, useState } from 'react';
import InfoTip from '@/components/InfoTip';
import { infoForLabel, INFO } from '@/lib/infoTexts';
import { Navigate, useParams } from 'react-router-dom';
import PerfilReputacionalIA from '@/components/PerfilReputacionalIA';
import MencionesRecientes, { type MencionesConfig } from '@/components/MencionesRecientes';
import RiesgoRealInfo from '@/components/RiesgoRealInfo';
import { usePeriod } from '@/contexts/PeriodContext';
import { useKpiCanalGlobal, filterByCanal, aggregateKpi, toPerfilBucket } from '@/hooks/useKpiCanal';
import type { Canal } from '@/hooks/useCanalData';
import { NIVELES, isNivelId, rowsNivel, hospitalesOrdenados } from '@/lib/sermasNiveles';
import { fmtNotaIA, fmtPctRiesgo, pctRiesgoReal } from '@/lib/metricas';
import { CANALES } from './canales';
import HospitalDashboard from '@/components/HospitalDashboard';

const fmt = (n: number) => (n ?? 0).toLocaleString('es-ES');

/** Config mínima: canal_items devuelve columnas normalizadas; solo indica si hay título/imagen. */
function cfgLista(canal: Canal, segmento: MencionesConfig['segmento']): MencionesConfig {
  const conImagen = canal === 'medios' || canal === 'instagram' || canal === 'tiktok' || canal === 'facebook';
  return {
    tabla: `canal_items:${canal}`, campoFecha: 'fecha', campoSnippet: 'texto', campoMedio: 'fuente', campoUrl: 'url', campoPeligro: 'peligro',
    campoTitulo: canal === 'medios' ? 'titulo' : undefined, campoImagen: conImagen ? 'imagen' : undefined,
    canal, segmento,
  };
}

export default function SermasDetallePage() {
  const { nivel: n, slug: s } = useParams();
  if (isNivelId(n) && s && s !== 'conjunto' && NIVELES[n].destacados.some(d => d.slug === s)) {
    return <HospitalDashboard key={`${n}-${s}`} nivelId={n} slug={s} />;
  }
  return <ConjuntoPage />;
}

function ConjuntoPage() {
  const { nivel: nivelId, slug } = useParams();
  const { desde, hasta } = usePeriod();
  const { data: kpiRows, isLoading } = useKpiCanalGlobal();
  const [canal, setCanal] = useState<Canal>('medios');
  const nivel = isNivelId(nivelId) ? NIVELES[nivelId] : null;
  const hospital = nivel?.destacados.find(d => d.slug === slug) ?? null;
  const esConjunto = slug === 'conjunto';

  const objetivo = hospital ? [hospital.nombre] : nivel?.destacados.map(d => d.nombre) ?? [];
  const etiqueta = hospital ? hospital.short : 'Gestión QS';

  const stats = useMemo(() => {
    if (!kpiRows || !nivel) return null;
    const rows = filterByCanal(rowsNivel(kpiRows, nivel), canal);
    const set = new Set(objetivo);
    const target = rows.filter(r => r.grupo_hospitalario && set.has(r.grupo_hospitalario));
    const resto = rows.filter(r => !r.grupo_hospitalario || !set.has(r.grupo_hospitalario));
    const aggT = aggregateKpi(target), aggN = aggregateKpi(rows), aggR = aggregateKpi(resto);
    const grupos = hospitalesOrdenados(rows, objetivo);
    const comparables = grupos.filter(g => !set.has(g))
      .map(g => toPerfilBucket(g, aggregateKpi(rows.filter(r => r.grupo_hospitalario === g))))
      .filter(b => b.menciones > 0);
    return {
      aggT, aggN, aggR, comparables, nHosp: grupos.length,
      rank: hospital ? grupos.indexOf(hospital.nombre) + 1 : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpiRows, nivel, canal, slug]);

  if (!nivel || (!hospital && !esConjunto)) return <Navigate to="/dashboard/sermas/alta" replace />;

  const titulo = hospital ? hospital.nombre : nivel.label;
  const canalCfg = CANALES.find(c => c.key === canal)!;
  const vacio = !!stats && stats.aggT.menciones === 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          SERMAS · {nivel.label}{hospital ? ` · ${hospital.short}` : ' · conjunto'} · {desde} → {hasta}
        </p>
        <h1 className="text-2xl font-bold text-foreground">{titulo}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {hospital
            ? `Hospital de ${nivel.label.toLowerCase()} gestionado por Quirónsalud, frente al resto de hospitales del nivel.`
            : `Todos los hospitales de ${nivel.label.toLowerCase()}; destacados los de gestión Quirónsalud (${nivel.destacados.map(d => d.short).join(', ')}).`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Canal">
        {CANALES.map(c => (
          <button key={c.key} role="tab" aria-selected={canal === c.key} onClick={() => setCanal(c.key)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${canal === c.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            <c.Icon className="h-3.5 w-3.5" />{c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={`Menciones · ${etiqueta}`} value={stats ? fmt(stats.aggT.menciones) : '—'} sub={stats ? `de ${fmt(stats.aggN.menciones)} en ${nivel.label.toLowerCase()}` : undefined} highlight />
        <Kpi label={`Nota IA · ${etiqueta}`} value={stats ? fmtNotaIA(stats.aggT.notaMedia) : '—'} sub={stats ? `Media ${nivel.label.toLowerCase()}: ${fmtNotaIA(stats.aggN.notaMedia)}` : undefined} />
        <Kpi label={`Riesgo real · ${etiqueta}`} info value={stats && stats.aggT.menciones ? fmtPctRiesgo(pctRiesgoReal(stats.aggT.peligroReal, stats.aggT.menciones)) : '—'}
          sub={stats ? `Nivel: ${fmtPctRiesgo(pctRiesgoReal(stats.aggN.peligroReal, stats.aggN.menciones))}` : undefined} />
        {hospital
          ? <Kpi label="Posición" value={stats && stats.aggT.menciones ? `#${stats.rank}` : '—'} sub={stats ? `de ${stats.nHosp} hospitales` : undefined} />
          : <Kpi label="Cuota Gestión QS" value={stats && stats.aggN.menciones ? `${(stats.aggT.menciones / stats.aggN.menciones * 100).toFixed(1)}%` : '—'} sub="del nivel" />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {vacio && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Sin datos en el periodo para {etiqueta} en {canalCfg.label}.</div>
      )}

      {stats && !vacio && (
        <PerfilReputacionalIA
          contextLabel={`${etiqueta} · ${canalCfg.label}`}
          highlightLabel={etiqueta}
          total={toPerfilBucket(nivel.label, stats.aggN)}
          highlight={toPerfilBucket(etiqueta, stats.aggT)}
          resto={toPerfilBucket(`Resto ${nivel.label.toLowerCase()}`, stats.aggR)}
          highlightColor="#10b981"
          comparables={stats.comparables}
          conjuntoLabel={`Resto ${nivel.label.toLowerCase()}`}
        />
      )}

      <MencionesRecientes
        key={`${slug}-${canal}`}
        cfg={cfgLista(canal, { titularidad: nivel.titularidad, grupos: hospital ? hospital.aliases : undefined })}
        contextLabel={`${hospital ? hospital.short : nivel.label} · ${canalCfg.label}`}
      />

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        Fuente: base de datos · kpi_canal / canal_items ({desde} → {hasta}) · titularidad = {nivel.titularidad}{hospital ? ` · hospital = ${hospital.nombre}` : ''} · canal = {canal}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, highlight, info }: { label: string; value: string; sub?: string; highlight?: boolean; info?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">{label}<InfoTip text={infoForLabel(label)} /></p>
      <p className={`mt-2 text-3xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
