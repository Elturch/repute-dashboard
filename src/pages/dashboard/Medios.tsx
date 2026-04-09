import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Search, Check, Minus, ExternalLink, Building, FileText, Star, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MediaProfile {
  id: number;
  medio: string;
  linea_editorial: string;
  tono_dominante: string;
  n_articulos: number;
  primera_cobertura: string;
  ultima_cobertura: string;
  firmantes_clave: string[] | null;
  es_fuente_primaria: boolean;
  notas: string | null;
}

const TONO_COLORS: Record<string, string> = {
  critico: "hsl(0, 84%, 60%)",
  negativo: "hsl(25, 95%, 53%)",
  neutro: "hsl(var(--muted-foreground))",
  positivo: "hsl(142, 71%, 45%)",
};

function tonoBadge(tono: string) {
  const t = (tono ?? "").toLowerCase();
  if (t.includes("critico") || t.includes("crítico"))
    return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Crítico</Badge>;
  if (t.includes("negativo"))
    return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">Negativo</Badge>;
  if (t.includes("positivo"))
    return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Positivo</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs">Neutro</Badge>;
}

function riesgoBadge(r: string) {
  const rl = (r ?? "").toLowerCase();
  if (rl.includes("alto")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Alto</Badge>;
  if (rl.includes("medio")) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Medio</Badge>;
  if (rl.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Bajo</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs">Info</Badge>;
}

function formatDate(d: string) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return format(date, "dd/MM/yyyy");
  } catch { return "—"; }
}

function tonoBarColor(tono: string): string {
  const t = (tono ?? "").toLowerCase();
  if (t.includes("critico") || t.includes("crítico")) return TONO_COLORS.critico;
  if (t.includes("negativo")) return TONO_COLORS.negativo;
  if (t.includes("positivo")) return TONO_COLORS.positivo;
  return TONO_COLORS.neutro;
}

type SortKey = "medio" | "n_articulos" | "tono_dominante" | "primera_cobertura" | "ultima_cobertura";

const Medios = () => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("n_articulos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedMedio, setSelectedMedio] = useState<MediaProfile | null>(null);

  const { data: medios = [], isLoading } = useQuery({
    queryKey: ["media_profiles"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("media_profiles")
        .select("*")
        .eq("scenario_id", "quironsalud_ayuso")
        .order("n_articulos", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaProfile[];
    },
  });

  const totalMedios = medios.length;
  const totalArticulos = medios.reduce((s, m) => s + (m.n_articulos ?? 0), 0);
  const fuentesPrimarias = medios.filter((m) => m.es_fuente_primaria).length;

  const filtered = useMemo(() => {
    let result = [...medios];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((m) => (m.medio ?? "").toLowerCase().includes(s));
    }
    result.sort((a, b) => {
      let va: any = a[sortKey];
      let vb: any = b[sortKey];
      if (typeof va === "string") { va = va.toLowerCase(); vb = (vb ?? "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [medios, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const chartData = useMemo(() =>
    [...medios]
      .filter((m) => m.medio != null)
      .sort((a, b) => (a.n_articulos ?? 0) - (b.n_articulos ?? 0))
      .map((m) => ({
        medio: m.medio ?? "Desconocido",
        articulos: m.n_articulos ?? 0,
        tono: m.tono_dominante ?? "",
      })),
  [medios]);

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        {sortKey === k && <span className="text-primary text-[10px]">{sortDir === "desc" ? "↓" : "↑"}</span>}
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Medios</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Medios</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : totalMedios}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Artículos</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : totalArticulos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Fuentes Primarias</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : fuentesPrimarias}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      {isLoading ? <Skeleton className="h-96 w-full" /> : (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base">Artículos por Medio</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 32)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis type="category" dataKey="medio" width={140} tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [value, "Artículos"]}
                />
                <Bar dataKey="articulos" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={tonoBarColor(entry.tono)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: TONO_COLORS.critico }} /> Crítico</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: TONO_COLORS.negativo }} /> Negativo</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: TONO_COLORS.neutro }} /> Neutro</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: TONO_COLORS.positivo }} /> Positivo</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar medio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader label="Medio" k="medio" />
                  <TableHead className="text-xs">Línea Editorial</TableHead>
                  <SortHeader label="Tono" k="tono_dominante" />
                  <SortHeader label="Artículos" k="n_articulos" />
                  <SortHeader label="Primera Cob." k="primera_cobertura" />
                  <SortHeader label="Última Cob." k="ultima_cobertura" />
                  <TableHead className="text-xs text-center">F. Primaria</TableHead>
                  <TableHead className="text-xs">Firmantes Clave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Sin resultados</TableCell></TableRow>
                ) : filtered.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => setSelectedMedio(m)}>
                    <TableCell className="font-medium text-sm">{m.medio}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.linea_editorial}</Badge></TableCell>
                    <TableCell>{tonoBadge(m.tono_dominante)}</TableCell>
                    <TableCell className="text-sm font-mono">{m.n_articulos}</TableCell>
                    <TableCell className="text-xs">{formatDate(m.primera_cobertura)}</TableCell>
                    <TableCell className="text-xs">{formatDate(m.ultima_cobertura)}</TableCell>
                    <TableCell className="text-center">
                      {m.es_fuente_primaria ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(m.firmantes_clave ?? []).map((f, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Detail Sheet */}
      <MedioDetailSheet medio={selectedMedio} onClose={() => setSelectedMedio(null)} />
    </div>
  );
};

function MedioDetailSheet({ medio, onClose }: { medio: MediaProfile | null; onClose: () => void }) {
  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["medio_eventos", medio?.medio],
    queryFn: async () => {
      if (!medio) return [];
      const { data, error } = await externalSupabase
        .from("monitor_reputacional_events")
        .select("fecha, titular_o_texto, riesgo_reputacional, m_nota_ponderada, url")
        .eq("medio_plataforma", medio.medio)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!medio,
  });

  if (!medio) return null;

  return (
    <Sheet open={!!medio} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-border">
        <SheetHeader>
          <SheetTitle className="text-left text-lg">{medio.medio}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          <div className="flex flex-wrap gap-2">
            {tonoBadge(medio.tono_dominante)}
            <Badge variant="outline" className="text-xs">{medio.linea_editorial}</Badge>
            {medio.es_fuente_primaria && <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Fuente Primaria</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Artículos</p><p className="text-foreground font-bold text-xl">{medio.n_articulos}</p></div>
            <div><p className="text-muted-foreground text-xs">Cobertura</p><p className="text-foreground">{formatDate(medio.primera_cobertura)} — {formatDate(medio.ultima_cobertura)}</p></div>
          </div>

          {medio.notas && (
            <div><p className="text-xs text-muted-foreground mb-1">Notas</p><p className="text-sm text-foreground leading-relaxed">{medio.notas}</p></div>
          )}

          {(medio.firmantes_clave ?? []).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Firmantes Clave</p>
              <div className="flex flex-wrap gap-1.5">
                {medio.firmantes_clave!.map((f, i) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Eventos ({eventos.length})</p>
            {isLoading ? <Skeleton className="h-32 w-full" /> : eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {eventos.map((ev: any, i: number) => (
                  <div key={i} className="rounded border border-border/50 bg-accent/20 p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {ev.url ? (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-start gap-1">
                            {ev.titular_o_texto}
                            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          </a>
                        ) : <p className="text-sm text-foreground">{ev.titular_o_texto}</p>}
                      </div>
                      {riesgoBadge(ev.riesgo_reputacional)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{(() => { if (!ev.fecha) return "—"; try { const d = new Date(ev.fecha); return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy HH:mm", { locale: es }); } catch { return "—"; } })()}</span>
                      {ev.m_nota_ponderada != null && <span className="font-mono">Nota: {ev.m_nota_ponderada.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Medios;
