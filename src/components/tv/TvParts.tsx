import { ReactNode, useMemo } from "react";

/* ─────────────── Layout wrapper ─────────────── */
export function TvPanelLayout({
  titulo, accentClass, currentIndex, total, progress, children,
}: {
  titulo: string;
  accentClass?: string; // e.g. 'text-sky-400'
  currentIndex: number;
  total: number;
  progress: number;
  children: ReactNode;
}) {
  return (
    <div className="tv-panel min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="h-16 px-10 flex items-center justify-between border-b border-border">
        <div className="font-extrabold tracking-[0.2em] text-primary text-2xl">QUIRÓNSALUD 4.0</div>
        <div className={`text-2xl font-semibold ${accentClass ?? 'text-foreground'}`}>{titulo}</div>
        <div className="text-xl tabular-nums text-muted-foreground">
          {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </header>
      <div className="h-[6px] w-full bg-border">
        <div
          className="h-full bg-primary transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <main className="flex-1 px-12 py-10 space-y-12 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

/* ─────────────── Big KPI ─────────────── */
function nfmt(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n);
}

export function BigKpi({ value, label, sub }: { value: number; label: string; sub?: string }) {
  return (
    <div className="text-center py-4">
      <div className="big-kpi-number text-primary tabular-nums">{nfmt(value)}</div>
      <div className="big-kpi-label text-muted-foreground mt-2 uppercase">{label}</div>
      {sub && <div className="text-2xl text-muted-foreground/70 mt-1">{sub}</div>}
    </div>
  );
}

/* ─────────────── Sub-KPI band (3-4 valores) ─────────────── */
export function SubKpiBand({
  items,
}: {
  items: Array<{ label: string; value: number; accentClass?: string }>;
}) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div
          key={it.label}
          className={`flex flex-col items-center justify-center py-6 ${i > 0 ? 'border-l border-border' : ''}`}
        >
          <div className={`sub-kpi-number tabular-nums ${it.accentClass ?? 'text-foreground'}`}>{nfmt(it.value)}</div>
          <div className="sub-kpi-label uppercase tracking-widest mt-2">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Top hospitales ─────────────── */
export function TopHospitalesTable({
  rows, max = 8, title = 'TOP HOSPITALES',
}: {
  rows: Array<{ grupo: string; n: number }>;
  max?: number;
  title?: string;
}) {
  const top = rows.slice(0, max);
  const peak = top[0]?.n ?? 1;
  return (
    <div>
      <h3 className="text-3xl font-bold tracking-wider text-muted-foreground mb-4">{title}</h3>
      <div className="space-y-1">
        {top.map((r, i) => (
          <div key={r.grupo} className="table-row flex items-center gap-6 border-b border-border/50">
            <span className="text-muted-foreground/60 font-mono w-12 text-right">{i + 1}</span>
            <span className="flex-1 truncate font-semibold">{r.grupo}</span>
            <div className="flex-[2] h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.max(2, (r.n / peak) * 100)}%` }}
              />
            </div>
            <span className="font-mono font-bold tabular-nums w-28 text-right">{nfmt(r.n)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Distribución peligro ─────────────── */
export function PeligroDistribucion({
  data,
}: {
  data: { bajo: number; medio: number; medioAlto: number; alto: number };
}) {
  const total = Math.max(1, data.bajo + data.medio + data.medioAlto + data.alto);
  const rows: Array<[string, number, string]> = [
    ['BAJO',       data.bajo,      'bg-emerald-500'],
    ['MEDIO',      data.medio,     'bg-yellow-500'],
    ['MEDIO-ALTO', data.medioAlto, 'bg-orange-500'],
    ['ALTO',       data.alto,      'bg-red-500'],
  ];
  return (
    <div>
      <h3 className="text-3xl font-bold tracking-wider text-muted-foreground mb-4">DISTRIBUCIÓN PELIGRO</h3>
      <div className="space-y-3">
        {rows.map(([label, n, cls]) => {
          const pct = (n / total) * 100;
          return (
            <div key={label} className="flex items-center gap-6">
              <span className="text-2xl font-bold w-44">{label}</span>
              <div className="flex-1 h-10 rounded-md bg-secondary overflow-hidden">
                <div className={`h-full ${cls}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-3xl font-bold tabular-nums w-28 text-right">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── Top fuentes ─────────────── */
export function TopFuentesList({
  rows, max = 5, title = 'TOP FUENTES',
}: {
  rows: Array<{ fuente: string; n: number }>;
  max?: number;
  title?: string;
}) {
  const top = rows.slice(0, max);
  return (
    <div>
      <h3 className="text-3xl font-bold tracking-wider text-muted-foreground mb-4">{title}</h3>
      <div className="space-y-2">
        {top.map((r, i) => (
          <div key={r.fuente + i} className="flex items-baseline gap-4 border-b border-border/40 py-2">
            <span className="text-muted-foreground/60 font-mono w-10 text-right">{i + 1}</span>
            <span className="flex-1 truncate text-3xl">{r.fuente}</span>
            <span className="font-mono font-bold tabular-nums text-3xl">{nfmt(r.n)}</span>
          </div>
        ))}
        {top.length === 0 && <div className="text-2xl text-muted-foreground/50 py-4">Sin datos</div>}
      </div>
    </div>
  );
}

/* ─────────────── Sparkline (SVG simple, área llena) ─────────────── */
export function EvolucionSparkline({
  data, height = 160, title = 'EVOLUCIÓN 30 DÍAS',
}: {
  data: Array<{ fecha: string; n: number }>;
  height?: number;
  title?: string;
}) {
  const path = useMemo(() => {
    if (!data.length) return { line: '', area: '', max: 0 };
    const max = Math.max(...data.map(d => d.n), 1);
    const w = 1000;
    const stepX = data.length > 1 ? w / (data.length - 1) : w;
    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = height - (d.n / max) * (height - 10) - 4;
      return [x, y] as const;
    });
    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${line} L ${(points[points.length - 1][0]).toFixed(1)} ${height} L 0 ${height} Z`;
    return { line, area, max };
  }, [data, height]);

  return (
    <div>
      <h3 className="text-3xl font-bold tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="w-full" style={{ height }}>
        <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="tv-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {data.length > 0 && (
            <>
              <path d={path.area} fill="url(#tv-spark)" />
              <path d={path.line} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />
            </>
          )}
        </svg>
      </div>
      <div className="flex justify-between text-xl text-muted-foreground/70 mt-1">
        <span>Hace 30 días</span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

/* ─────────────── Mosaico de 7 canales ─────────────── */
const CANAL_LABEL: Record<string, string> = {
  medios: 'Medios', instagram: 'Instagram', tiktok: 'TikTok',
  twitter: 'X', facebook: 'Facebook', linkedin: 'LinkedIn', mybusiness: 'Reseñas',
};

export function CanalMosaic({
  items,
}: {
  items: Array<{ canal: string; total: number }>;
}) {
  return (
    <div>
      <h3 className="text-3xl font-bold tracking-wider text-muted-foreground mb-4">CANALES</h3>
      <div className="grid grid-cols-4 gap-4">
        {items.map(it => (
          <div key={it.canal} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center">
            <div className="text-xl uppercase tracking-widest text-muted-foreground">{CANAL_LABEL[it.canal] ?? it.canal}</div>
            <div className="text-6xl font-extrabold tabular-nums mt-2">{nfmt(it.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
