import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import {
  Search, X, CalendarIcon, Bell, ExternalLink, ChevronLeft, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Evento {
  id: number;
  fecha: string;
  medio_plataforma: string;
  cuenta: string | null;
  titular_o_texto: string;
  url: string;
  resumen: string;
  categoria_tema: string;
  tipo_fuente: string;
  tipo_contenido: string;
  riesgo_reputacional: string;
  nuevo_vs_recurrente: string;
  es_warning: boolean;
  m_nota_ponderada: number | null;
  m_preocupacion: number | null;
  m_rechazo: number | null;
  m_descredito: number | null;
  m_afinidad: number | null;
  m_fiabilidad: number | null;
  m_admiracion: number | null;
  m_compromiso: number | null;
  m_impacto: number | null;
  m_influencia: number | null;
  fuentes_clave: any;
  amplificacion_redes: any;
}

const PAGE_SIZE = 25;

function riesgoBadge(r: string) {
  const rl = (r ?? "").toLowerCase();
  if (rl.includes("alto")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Alto</Badge>;
  if (rl.includes("medio")) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Medio</Badge>;
  if (rl.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Bajo</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs">Informativo</Badge>;
}

function nuevoRecurrenteBadge(v: string) {
  if ((v ?? "").toLowerCase() === "nuevo")
    return <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Nuevo</Badge>;
  return <Badge variant="outline" className="text-xs">Recurrente</Badge>;
}

function notaColor(n: number | null) {
  if (n == null) return "text-muted-foreground";
  if (n > 7) return "text-red-400";
  if (n >= 5) return "text-orange-400";
  return "text-emerald-400";
}

function formatFecha(d: string) {
  if (!d) return "";
  return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es });
}

const Eventos = () => {
  const [search, setSearch] = useState("");
  const [riesgoFilter, setRiesgoFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [medioFilter, setMedioFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(0);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ["eventos_all"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("monitor_reputacional_events")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Evento[];
    },
  });

  const categorias = useMemo(() => [...new Set(allEvents.map((e) => e.categoria_tema).filter(Boolean))].sort(), [allEvents]);
  const medios = useMemo(() => [...new Set(allEvents.map((e) => e.medio_plataforma).filter(Boolean))].sort(), [allEvents]);
  const tipos = useMemo(() => [...new Set(allEvents.map((e) => e.tipo_fuente).filter(Boolean))].sort(), [allEvents]);

  const filtered = useMemo(() => {
    let result = [...allEvents];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((e) => (e.titular_o_texto ?? "").toLowerCase().includes(s));
    }
    if (riesgoFilter !== "all") result = result.filter((e) => e.riesgo_reputacional === riesgoFilter);
    if (categoriaFilter !== "all") result = result.filter((e) => e.categoria_tema === categoriaFilter);
    if (medioFilter !== "all") result = result.filter((e) => e.medio_plataforma === medioFilter);
    if (tipoFilter !== "all") result = result.filter((e) => e.tipo_fuente === tipoFilter);
    if (dateFrom) result = result.filter((e) => new Date(e.fecha) >= dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      result = result.filter((e) => new Date(e.fecha) <= end);
    }
    result.sort((a, b) => {
      const da = new Date(a.fecha).getTime();
      const db = new Date(b.fecha).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });
    return result;
  }, [allEvents, search, riesgoFilter, categoriaFilter, medioFilter, tipoFilter, dateFrom, dateTo, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setSearch(""); setRiesgoFilter("all"); setCategoriaFilter("all");
    setMedioFilter("all"); setTipoFilter("all");
    setDateFrom(undefined); setDateTo(undefined); setPage(0);
  };

  const hasFilters = search || riesgoFilter !== "all" || categoriaFilter !== "all" || medioFilter !== "all" || tipoFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Eventos</h1>

      <Card className="sticky top-0 z-10 border-border/50 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por titular..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          <Select value={riesgoFilter} onValueChange={(v) => { setRiesgoFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Riesgo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Alto">Alto</SelectItem>
              <SelectItem value="Medio">Medio</SelectItem>
              <SelectItem value="Bajo">Bajo</SelectItem>
              <SelectItem value="Informativo">Informativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoriaFilter} onValueChange={(v) => { setCategoriaFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={medioFilter} onValueChange={(v) => { setMedioFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Medio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {medios.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[130px] justify-start text-left text-xs", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {dateFrom ? format(dateFrom, "dd/MM/yy") : "Desde"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setPage(0); }} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[130px] justify-start text-left text-xs", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {dateTo ? format(dateTo, "dd/MM/yy") : "Hasta"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setPage(0); }} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} eventos encontrados</span>
        <Button variant="ghost" size="sm" onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")} className="text-xs">
          Fecha {sortDir === "desc" ? "↓" : "↑"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-[120px]">Fecha</TableHead>
                  <TableHead className="text-xs w-[120px]">Medio</TableHead>
                  <TableHead className="text-xs">Titular</TableHead>
                  <TableHead className="text-xs w-[110px]">Categoría</TableHead>
                  <TableHead className="text-xs w-[90px]">Riesgo</TableHead>
                  <TableHead className="text-xs w-[100px]">Estado</TableHead>
                  <TableHead className="text-xs w-[60px] text-right">Nota</TableHead>
                  <TableHead className="text-xs w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">No se encontraron eventos</TableCell>
                  </TableRow>
                ) : (
                  pageEvents.map((ev) => (
                    <TableRow
                      key={ev.id}
                      className={cn("cursor-pointer transition-colors", ev.es_warning && "border-l-2 border-l-red-500")}
                      onClick={() => setSelectedEvento(ev)}
                    >
                      <TableCell className="text-xs whitespace-nowrap">{formatFecha(ev.fecha)}</TableCell>
                      <TableCell className="text-xs">{ev.medio_plataforma}</TableCell>
                      <TableCell className="text-sm">
                        {ev.url ? (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
                            {ev.titular_o_texto}
                            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          </a>
                        ) : ev.titular_o_texto}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ev.categoria_tema}</Badge></TableCell>
                      <TableCell>{riesgoBadge(ev.riesgo_reputacional)}</TableCell>
                      <TableCell>{nuevoRecurrenteBadge(ev.nuevo_vs_recurrente)}</TableCell>
                      <TableCell className={cn("text-xs text-right font-mono", notaColor(ev.m_nota_ponderada))}>
                        {ev.m_nota_ponderada != null ? ev.m_nota_ponderada.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell>{ev.es_warning && <Bell className="h-4 w-4 text-red-400" />}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <EventoDetailSheet evento={selectedEvento} onClose={() => setSelectedEvento(null)} />
    </div>
  );
};

function EventoDetailSheet({ evento, onClose }: { evento: Evento | null; onClose: () => void }) {
  if (!evento) return null;

  const metricas = [
    { metric: "Preocupación", value: evento.m_preocupacion },
    { metric: "Rechazo", value: evento.m_rechazo },
    { metric: "Descrédito", value: evento.m_descredito },
    { metric: "Afinidad", value: evento.m_afinidad },
    { metric: "Fiabilidad", value: evento.m_fiabilidad },
    { metric: "Admiración", value: evento.m_admiracion },
    { metric: "Compromiso", value: evento.m_compromiso },
    { metric: "Impacto", value: evento.m_impacto },
    { metric: "Influencia", value: evento.m_influencia },
  ];
  const hasMetrics = metricas.some((m) => m.value != null);
  const radarData = metricas.map((m) => ({ subject: m.metric, value: m.value ?? 0, fullMark: 10 }));

  return (
    <Sheet open={!!evento} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-border">
        <SheetHeader>
          <SheetTitle className="text-left text-base leading-snug pr-6">{evento.titular_o_texto}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          <div className="flex flex-wrap gap-2">
            {riesgoBadge(evento.riesgo_reputacional)}
            {nuevoRecurrenteBadge(evento.nuevo_vs_recurrente)}
            {evento.es_warning && <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">⚠ Warning</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Medio</p><p className="text-foreground">{evento.medio_plataforma}</p></div>
            {evento.cuenta && <div><p className="text-muted-foreground text-xs">Cuenta</p><p className="text-foreground">{evento.cuenta}</p></div>}
            <div><p className="text-muted-foreground text-xs">Fecha</p><p className="text-foreground">{formatFecha(evento.fecha)}</p></div>
            <div><p className="text-muted-foreground text-xs">Categoría</p><p className="text-foreground">{evento.categoria_tema}</p></div>
            <div><p className="text-muted-foreground text-xs">Tipo contenido</p><p className="text-foreground">{evento.tipo_contenido}</p></div>
            <div><p className="text-muted-foreground text-xs">Tipo fuente</p><p className="text-foreground">{evento.tipo_fuente}</p></div>
          </div>
          {evento.url && (
            <a href={evento.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
              Ver fuente original <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {evento.resumen && (
            <div><p className="text-xs text-muted-foreground mb-1">Resumen</p><p className="text-sm text-foreground leading-relaxed">{evento.resumen}</p></div>
          )}
          {hasMetrics && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Métricas Emocionales</p>
              <div className="relative">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <Radar name="Valor" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                {evento.m_nota_ponderada != null && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", notaColor(evento.m_nota_ponderada))}>{evento.m_nota_ponderada.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Nota Ponderada</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {evento.fuentes_clave && typeof evento.fuentes_clave === "object" && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Fuentes Clave</p>
              <div className="flex flex-wrap gap-1.5">
                {evento.fuentes_clave.autores?.map((a: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                ))}
                {evento.fuentes_clave.medio && <Badge className="bg-accent text-accent-foreground text-xs">{evento.fuentes_clave.medio}</Badge>}
                {evento.fuentes_clave.relacionado_gonzalez_amador && (
                  <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">Rel. González Amador</Badge>
                )}
              </div>
            </div>
          )}
          {evento.amplificacion_redes && typeof evento.amplificacion_redes === "object" && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Amplificación en Redes</p>
              <pre className="text-xs text-foreground bg-accent/30 rounded p-3 overflow-x-auto">{JSON.stringify(evento.amplificacion_redes, null, 2)}</pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Eventos;
