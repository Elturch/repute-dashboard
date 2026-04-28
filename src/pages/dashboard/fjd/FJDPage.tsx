import { useMemo, useState } from "react";
import { Star, ExternalLink, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, Cell,
} from "recharts";
import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from "react-icons/si";
import { FaXTwitter, FaLinkedin } from "react-icons/fa6";
import { Newspaper } from "lucide-react";
import { useFJDMenciones, type FJDMencion, type FJDCanal } from "@/hooks/useFJDMenciones";
import PerfilReputacionalIA, { type PerfilBucket } from "@/components/PerfilReputacionalIA";
import { useKpiCanalGlobal, filterByGrupo, aggregateKpi } from "@/hooks/useKpiCanal";

const CANAL_ORDER: FJDCanal[] = [
  "tiktok", "mybusiness", "medios", "instagram", "twitter", "facebook", "linkedin",
];

const CANAL_LABEL: Record<FJDCanal, string> = {
  medios: "Medios",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  mybusiness: "MyBusiness",
};

const CANAL_COLOR: Record<FJDCanal, string> = {
  medios: "#6b7280",
  instagram: "#ec4899",
  tiktok: "#06b6d4",
  facebook: "#3b82f6",
  linkedin: "#0a66c2",
  twitter: "#e5e7eb",
  mybusiness: "#22c55e",
};

function CanalIcon({ canal, className }: { canal: FJDCanal; className?: string }) {
  const cls = className ?? "h-4 w-4";
  switch (canal) {
    case "medios": return <Newspaper className={cls} />;
    case "instagram": return <SiInstagram className={cls} />;
    case "tiktok": return <SiTiktok className={cls} />;
    case "facebook": return <SiFacebook className={cls} />;
    case "linkedin": return <FaLinkedin className={cls} />;
    case "twitter": return <FaXTwitter className={cls} />;
    case "mybusiness": return <SiGoogle className={cls} />;
  }
}

const PELIGRO_LEVELS = ["BAJO", "MEDIO", "ALTO", "CRÍTICO"] as const;
type PeligroLevel = typeof PELIGRO_LEVELS[number];

function peligroBadgeColor(p: string | null): string {
  switch ((p ?? "").toUpperCase()) {
    case "CRÍTICO": case "CRITICO": return "bg-red-500/15 text-red-400 border-red-500/30";
    case "ALTO": return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "MEDIO": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case "BAJO": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    default: return "bg-white/5 text-white/40 border-white/10";
  }
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) {
    const hours = Math.floor(diffMs / 3600000);
    if (hours <= 0) return "hace un momento";
    return `hace ${hours} h`;
  }
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

function avg(nums: (number | null | undefined)[]): number | null {
  const xs = nums.filter((n): n is number => typeof n === "number" && !isNaN(n));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

const EMPTY_PROMEDIOS: PerfilBucket["promedios"] = {
  influencia: null, fiabilidad: null, afinidad: null, admiracion: null,
  impacto: null, rechazo: null, preocupacion: null, descredito: null,
};

export default function FJDPage() {
  const { data, isLoading, error } = useFJDMenciones();
  const menciones = data ?? [];

  // KPIs agregados para FJD desde la vista materializada (191 filas, sin riesgo de cap).
  const { data: kpiRows } = useKpiCanalGlobal();
  const fjdKpi = useMemo(() => {
    if (!kpiRows) return null;
    const fjdRows = filterByGrupo(kpiRows, ['Hospital Fundación Jiménez Díaz', 'Fundación Jiménez Díaz']);
    return aggregateKpi(fjdRows);
  }, [kpiRows]);

  const [filtroCanal, setFiltroCanal] = useState<"all" | FJDCanal>("all");
  const [filtroRiesgo, setFiltroRiesgo] = useState<"all" | PeligroLevel>("all");
  const [busqueda, setBusqueda] = useState("");

  // KPIs
  const stats = useMemo(() => {
    // Total y % riesgo vienen de la vista materializada (números reales, no capados).
    const total = fjdKpi?.menciones ?? menciones.length;
    const notaIaMedia = fjdKpi?.notaMedia ?? avg(menciones.map(m => m.nota_media));
    const pctAlto = fjdKpi?.pctRiesgoReal ?? 0;
    const mb = menciones.filter(m => m.canal === "mybusiness");
    const mbCount = mb.length;
    const mbRating = avg(mb.map(m => m.rating ?? m.nota_media));
    return { total, notaIaMedia, pctAlto, mbCount, mbRating };
  }, [menciones, fjdKpi]);

  // Distribución por canal
  const distribucion = useMemo(() => {
    const counts: Record<FJDCanal, number> = {
      medios: 0, instagram: 0, tiktok: 0, facebook: 0, linkedin: 0, twitter: 0, mybusiness: 0,
    };
    menciones.forEach(m => { if (counts[m.canal] != null) counts[m.canal]++; });
    return CANAL_ORDER
      .map(c => ({ canal: c, label: CANAL_LABEL[c], count: counts[c], color: CANAL_COLOR[c] }))
      .sort((a, b) => b.count - a.count);
  }, [menciones]);

  // Evolución temporal pivoteada
  const evolucion = useMemo(() => {
    const byDay: Record<string, Record<string, number>> = {};
    menciones.forEach(m => {
      const day = m.fecha.slice(0, 10);
      if (!byDay[day]) byDay[day] = {};
      byDay[day][m.canal] = (byDay[day][m.canal] ?? 0) + 1;
    });
    return Object.keys(byDay)
      .sort()
      .map(day => ({ fecha: day, ...byDay[day] }));
  }, [menciones]);

  // Perfil IA
  const perfilHighlight: PerfilBucket = useMemo(() => ({
    label: "Fundación Jiménez Díaz",
    menciones: menciones.length,
    promedios: {
      influencia: avg(menciones.map(m => m.influencia)),
      fiabilidad: avg(menciones.map(m => m.fiabilidad)),
      afinidad: avg(menciones.map(m => m.afinidad)),
      admiracion: avg(menciones.map(m => m.admiracion)),
      impacto: avg(menciones.map(m => m.impacto)),
      rechazo: avg(menciones.map(m => m.rechazo)),
      preocupacion: avg(menciones.map(m => m.preocupacion)),
      descredito: avg(menciones.map(m => m.descredito)),
    },
  }), [menciones]);

  const perfilEmpty: PerfilBucket = { label: "—", menciones: 0, promedios: EMPTY_PROMEDIOS };

  // Top menciones filtradas
  const filteredMenciones = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return menciones.filter(m => {
      if (filtroCanal !== "all" && m.canal !== filtroCanal) return false;
      if (filtroRiesgo !== "all") {
        const p = (m.peligro ?? "").toUpperCase().replace("CRITICO", "CRÍTICO");
        if (p !== filtroRiesgo) return false;
      }
      if (q) {
        const blob = `${m.titulo ?? ""} ${m.texto ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    }).slice(0, 30);
  }, [menciones, filtroCanal, filtroRiesgo, busqueda]);

  return (
    <div className="p-6 space-y-8 text-white">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Star className="h-7 w-7 text-amber-500 fill-amber-500/30" />
          <h1 className="text-3xl font-bold tracking-tight">Fundación Jiménez Díaz</h1>
        </div>
        <p className="text-sm text-amber-600">
          Hospital público gestionado por Quirónsalud · SERMAS
        </p>
      </header>

      {/* Loading / error */}
      {isLoading && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
          Cargando menciones de FJD…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Error cargando datos: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Menciones totales" value={stats.total.toLocaleString()} accent="amber" />
            <KpiCard
              label="Nota IA media"
              value={stats.notaIaMedia != null ? stats.notaIaMedia.toFixed(2) : "—"}
              accent="emerald"
            />
            <KpiCard
              label="Riesgo alto + crítico"
              value={`${stats.pctAlto.toFixed(1)}%`}
              accent={stats.pctAlto >= 15 ? "red" : stats.pctAlto >= 5 ? "orange" : "emerald"}
            />
            <KpiCard
              label="Reseñas Google"
              value={
                stats.mbRating != null
                  ? `${stats.mbCount} · ★ ${stats.mbRating.toFixed(1)}`
                  : `${stats.mbCount}`
              }
              accent="blue"
            />
          </section>

          {/* Distribución por canal */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm uppercase tracking-[0.2em] text-white/60 font-medium">
                Distribución por canal · 30 días
              </h2>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribucion} layout="vertical" margin={{ left: 30, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} />
                  <YAxis type="category" dataKey="label" stroke="#9ca3af" fontSize={12} width={90} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6 }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {distribucion.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {distribucion.find(d => d.canal === "linkedin" && d.count === 0) && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                LinkedIn 0 · pendiente de arreglar identificador en el slug
              </div>
            )}
          </section>

          {/* Evolución */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-white/60 font-medium mb-4">
              Evolución temporal · 30 días
            </h2>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="fecha" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {CANAL_ORDER.map(c => (
                    <Line
                      key={c}
                      type="monotone"
                      dataKey={c}
                      stroke={CANAL_COLOR[c]}
                      strokeWidth={1.6}
                      dot={false}
                      name={CANAL_LABEL[c]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Perfil reputacional IA */}
          <PerfilReputacionalIA
            contextLabel="FJD · 30 días"
            highlightLabel="Fundación Jiménez Díaz"
            total={perfilEmpty}
            highlight={perfilHighlight}
            resto={perfilEmpty}
            highlightColor="#f59e0b"
          />

          {/* Top menciones */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-white/60 font-medium">
                Menciones recientes
              </h2>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filtroCanal}
                  onChange={(e) => setFiltroCanal(e.target.value as "all" | FJDCanal)}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="all">Todos los canales</option>
                  {CANAL_ORDER.map(c => (
                    <option key={c} value={c}>{CANAL_LABEL[c]}</option>
                  ))}
                </select>
                <select
                  value={filtroRiesgo}
                  onChange={(e) => setFiltroRiesgo(e.target.value as "all" | PeligroLevel)}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="all">Todos los riesgos</option>
                  {PELIGRO_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar…"
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-2">
              {filteredMenciones.length === 0 && (
                <div className="text-sm text-white/40 py-8 text-center">
                  No hay menciones con esos filtros.
                </div>
              )}
              {filteredMenciones.map(m => (
                <MencionCard key={`${m.canal}-${m.id}`} m={m} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label, value, accent,
}: {
  label: string;
  value: string;
  accent: "amber" | "emerald" | "blue" | "red" | "orange";
}) {
  const accentMap: Record<string, string> = {
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    red: "border-red-500/30 bg-red-500/5 text-red-400",
    orange: "border-orange-500/30 bg-orange-500/5 text-orange-400",
  };
  return (
    <div className={`rounded-xl border ${accentMap[accent]} p-5`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2">{label}</p>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MencionCard({ m }: { m: FJDMencion }) {
  const showImage = m.imagen && (m.canal === "medios" || m.canal === "instagram" || m.canal === "facebook");
  return (
    <a
      href={m.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition p-4"
    >
      <div className="flex gap-4">
        {showImage && (
          <img
            src={m.imagen!}
            alt=""
            className="w-24 h-24 object-cover rounded border border-white/10 flex-shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-white/50">
            <CanalIcon canal={m.canal} className="h-3.5 w-3.5" />
            <span>{CANAL_LABEL[m.canal]}</span>
            {m.fuente && <><span>·</span><span className="truncate">{m.fuente}</span></>}
            <span>·</span>
            <span>{relativeDate(m.fecha)}</span>
            {m.peligro && (
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border ${peligroBadgeColor(m.peligro)}`}>
                {m.peligro}
              </span>
            )}
          </div>
          {m.titulo && (
            <h3 className="text-sm font-semibold text-white/90 mb-1 line-clamp-2">{m.titulo}</h3>
          )}
          {m.texto && (
            <p className="text-xs text-white/60 line-clamp-2">
              {m.texto.length > 200 ? m.texto.slice(0, 200) + "…" : m.texto}
            </p>
          )}
          {m.url && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-white/40">
              <ExternalLink className="h-3 w-3" /> Abrir
            </div>
          )}
        </div>
      </div>
    </a>
  );
}