/**
 * Etiquetas permanentes de tarta (modo TV sin ratón): "Nombre valor · %" fuera de la porción con línea guía.
 * Solo se etiquetan las `maxLabels` porciones mayores con al menos `minPct` %; el resto queda en el listado/tooltip.
 */
const RAD = Math.PI / 180;

export function makePieLabel(data: { value: number }[], opts: { maxLabels?: number; minPct?: number; maxChars?: number } = {}) {
  const { maxLabels = 5, minPct = 3, maxChars = 18 } = opts;
  const total = data.reduce((t, d) => t + (Number(d.value) || 0), 0);
  const allowed = new Set(
    data.map((d, i) => ({ i, v: Number(d.value) || 0 }))
      .filter(x => total && (x.v / total) * 100 >= minPct)
      .sort((a, b) => b.v - a.v).slice(0, maxLabels).map(x => x.i),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Label = (p: any) => {
    if (!allowed.has(p.index)) return null;
    const ang = -p.midAngle * RAD;
    const r = p.outerRadius;
    const sx = p.cx + r * Math.cos(ang), sy = p.cy + r * Math.sin(ang);
    const mx = p.cx + (r + 10) * Math.cos(ang), my = p.cy + (r + 10) * Math.sin(ang);
    const right = Math.cos(ang) >= 0;
    const ex = mx + (right ? 12 : -12);
    const name = String(p.name ?? '');
    const short = name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;
    const pct = total ? Math.round((p.value / total) * 100) : 0;
    return (
      <g>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${my}`} stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1} />
        <text x={ex + (right ? 4 : -4)} y={my} textAnchor={right ? 'start' : 'end'} dominantBaseline="central"
          fill="hsl(var(--foreground))" fontSize={11}>
          <tspan fontWeight={600}>{short}</tspan>
          <tspan fill="hsl(var(--muted-foreground))">{` ${Number(p.value).toLocaleString('es-ES')} · ${pct}%`}</tspan>
        </text>
      </g>
    );
  };
  return Label;
}
