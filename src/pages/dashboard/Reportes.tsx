import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useExportReport, ExportFormat } from "@/hooks/useExportReport";
import { useBenchmarkData } from "@/hooks/useBenchmarkData";
import { useRelatoTimeline } from "@/hooks/useRelatoTimeline";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon, FileText, FileSpreadsheet, Download, Clock, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  { id: "resumen", label: "Resumen ejecutivo", icon: FileText },
  { id: "benchmarking", label: "Benchmarking", icon: FileSpreadsheet },
  { id: "fjd", label: "Fund. Jiménez Díaz", icon: FileText },
  { id: "relato", label: "Relato IA", icon: FileText },
  { id: "riesgo", label: "Riesgo y alertas", icon: AlertCircle },
];

interface ReportRecord {
  id: string;
  date: string;
  modules: string[];
  format: ExportFormat;
  status: "completado" | "error";
}

const Reportes = () => {
  const [selectedModules, setSelectedModules] = useState<string[]>(["resumen", "benchmarking"]);
  const [outputFormat, setOutputFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [history, setHistory] = useState<ReportRecord[]>([]);

  const { exportReport, exporting, error } = useExportReport();
  const { data: benchData } = useBenchmarkData();
  const { data: relatoData } = useRelatoTimeline({});

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedModules.length === 0) {
      toast.error("Selecciona al menos un módulo");
      return;
    }

    // Gather data from selected modules
    const rows: Record<string, unknown>[] = [];

    if (selectedModules.includes("benchmarking") && benchData) {
      benchData.forEach((r) => {
        rows.push({
          modulo: "Benchmarking",
          grupo: r.label,
          nota_media: r.nota_media,
          afinidad: r.afinidad,
          fiabilidad: r.fiabilidad,
          admiracion: r.admiracion,
          registros: r.count,
        });
      });
    }

    if (selectedModules.includes("relato") && relatoData) {
      relatoData.forEach((r: any) => {
        rows.push({
          modulo: "Relato IA",
          fecha: r.semana_inicio ?? "",
          resumen: r.resumen_narrativo ?? "",
          riesgo: r.riesgo_agregado ?? "",
          recomendacion: r.recomendacion_accion ?? "",
        });
      });
    }

    if (rows.length === 0) {
      // Provide at least a summary row
      rows.push({
        modulo: "Resumen",
        fecha: new Date().toISOString().slice(0, 10),
        nota: "Sin datos disponibles para los módulos seleccionados",
      });
    }

    const filename = `informe_quironsalud_${new Date().toISOString().slice(0, 10)}`;
    await exportReport({ format: outputFormat, data: rows, filename });

    const record: ReportRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      modules: [...selectedModules],
      format: outputFormat,
      status: error ? "error" : "completado",
    };
    setHistory((prev) => [record, ...prev]);
    if (!error) toast.success("Informe generado correctamente");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">Genera informes personalizados de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module selector */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Módulos a incluir</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modules.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedModules.includes(m.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Checkbox
                    checked={selectedModules.includes(m.id)}
                    onCheckedChange={() => toggleModule(m.id)}
                  />
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Date range */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rango de fechas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-48 justify-start text-left", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: es }) : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-48 justify-start text-left", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd MMM yyyy", { locale: es }) : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Format + Generate */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Formato de salida</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as ExportFormat)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="png">PNG (gráficos)</SelectItem>
                  <SelectItem value="pdf">PDF (próximamente)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerate} disabled={exporting} className="gap-2">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Generar informe
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview + History */}
        <div className="space-y-6">
          {/* Preview */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vista previa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase">Informe personalizado</p>
                <p className="text-sm font-semibold">
                  {selectedModules.length} módulo{selectedModules.length !== 1 ? "s" : ""} seleccionado{selectedModules.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModules.map((id) => {
                    const m = modules.find((mod) => mod.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {m?.label}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Formato: <span className="font-medium text-foreground">{outputFormat.toUpperCase()}</span>
                </p>
                {dateFrom && (
                  <p className="text-xs text-muted-foreground">
                    Desde: {format(dateFrom, "dd/MM/yyyy")}
                    {dateTo ? ` — Hasta: ${format(dateTo, "dd/MM/yyyy")}` : ""}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin informes generados aún</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                      <div className="flex items-center gap-2">
                        {r.status === "completado" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className="text-muted-foreground">
                          {format(new Date(r.date), "dd/MM HH:mm")}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {r.format.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
