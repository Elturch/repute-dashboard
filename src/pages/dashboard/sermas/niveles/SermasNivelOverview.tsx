import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import CanalCard from '@/components/CanalCard';
import { usePeriod } from '@/contexts/PeriodContext';
import { useKpiCanalGlobal, filterByCanal } from '@/hooks/useKpiCanal';
import { NIVELES, isNivelId, rowsNivel, hospitalesOrdenados } from '@/lib/sermasNiveles';
import { CANALES } from './canales';

export default function SermasNivelOverview() {
  const { nivel: nivelId } = useParams();
  const queryClient = useQueryClient();
  const { desde, hasta } = usePeriod();
  const { data: kpiRows, isLoading, isFetching, dataUpdatedAt } = useKpiCanalGlobal();
  const nivel = isNivelId(nivelId) ? NIVELES[nivelId] : null;

  const porCanal = useMemo(() => {
    if (!kpiRows || !nivel) return null;
    const rows = rowsNivel(kpiRows, nivel);
    return CANALES.map(c => {
      const rc = filterByCanal(rows, c.key);
      return { cfg: c, rows: rc, grupos: hospitalesOrdenados(rc, nivel.destacados.map(d => d.nombre)) };
    });
  }, [kpiRows, nivel]);

  if (!nivel) return <Navigate to="/dashboard/sermas/alta" replace />;
  const [h1, h2] = nivel.destacados;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-4 md:px-8 py-6 border-b border-border flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            SERMAS · {nivel.label} · Periodo seleccionado: {desde} → {hasta}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Overview · {nivel.menu}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            Hospitales públicos de {nivel.label.toLowerCase()} de la Comunidad de Madrid. Destacado{nivel.destacados.length > 1 ? 's' : ''} (gestión Quirónsalud):{' '}
            <span className="text-foreground font-medium">{nivel.destacados.map(d => `${d.nombre} (${d.short})`).join(' y ')}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
          {isFetching ? (
            <span className="text-primary flex items-center gap-1.5 mr-4"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Actualizando</span>
          ) : (
            <span className="text-muted-foreground mr-4">Auto-refresh 10 min · última: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
          )}
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['kpi_canal_global'] })} className="text-muted-foreground hover:text-foreground">🔄 Recargar</button>
        </div>
      </header>

      <div className="px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CANALES.map((c, i) => (
          <CanalCard
            key={c.key}
            label={c.label}
            Icon={c.Icon}
            brandColor={c.brandColor}
            rows={porCanal?.[i].rows ?? []}
            grupos={porCanal?.[i].grupos ?? nivel.destacados.map(d => d.nombre)}
            highlight={h1.nombre}
            highlightShort={h1.short}
            highlight2={h2?.nombre}
            highlight2Short={h2?.short}
            conjuntoLabel={`Media ${nivel.label.toLowerCase()}`}
            isLoading={isLoading}
          />
        ))}
      </div>

      <footer className="px-4 md:px-8 py-6 border-t border-border text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between flex-wrap gap-2">
        <span>Fuente: base de datos · Función kpi_canal({desde} → {hasta})</span>
        <span>Filtrado: titularidad = {nivel.titularidad}</span>
      </footer>
    </div>
  );
}
