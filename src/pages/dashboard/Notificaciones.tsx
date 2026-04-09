import { useState } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell, CheckCheck, Trash2, Settings2, Search, Volume2, VolumeX,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const severityColors: Record<Notification["severity"], string> = {
  critico: "bg-red-500/20 text-red-400 border-red-500/30",
  alto: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medio: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  bajo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const severityLabels: Record<Notification["severity"], string> = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

const Notificaciones = () => {
  const {
    notifications, loading, unreadCount, markAsRead, markAllAsRead, clearOld,
    soundEnabled, toggleSound, minSeverity, updateMinSeverity,
  } = useNotifications();

  const [filterSeverity, setFilterSeverity] = useState<string>("todos");
  const [filterRead, setFilterRead] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const filtered = notifications.filter((n) => {
    if (filterSeverity !== "todos" && n.severity !== filterSeverity) return false;
    if (filterRead === "no_leidas" && n.read) return false;
    if (filterRead === "leidas" && !n.read) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount} sin leer de {notifications.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-3.5 w-3.5" /> Preferencias
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todas leídas
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => clearOld(30)}>
            <Trash2 className="h-3.5 w-3.5" /> Limpiar antiguas
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferencias de notificación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Severidad mínima</Label>
              <Select value={minSeverity} onValueChange={(v) => updateMinSeverity(v as Notification["severity"])}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <Label className="text-sm">Sonido alertas críticas</Label>
              <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="medio">Medio</SelectItem>
            <SelectItem value="bajo">Bajo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRead} onValueChange={setFilterRead}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="no_leidas">No leídas</SelectItem>
            <SelectItem value="leidas">Leídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No hay notificaciones que coincidan con los filtros</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "bg-card border-border transition-colors cursor-pointer hover:bg-accent/30",
                !n.read && "border-l-2 border-l-primary"
              )}
              onClick={() => markAsRead(n.id)}
            >
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", severityColors[n.severity])}>
                      {severityLabels[n.severity]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {n.type}
                    </Badge>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: es })}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {format(new Date(n.timestamp), "dd/MM/yy HH:mm")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
