import { Bell, Check, CheckCheck, Settings2, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, soundEnabled, toggleSound } =
    useNotifications();
  const navigate = useNavigate();
  const recent = notifications.slice(0, 15);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold">Notificaciones</h4>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleSound} title={soundEnabled ? "Silenciar" : "Activar sonido"}>
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
                <CheckCheck className="h-3.5 w-3.5" /> Leer todas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin notificaciones</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50",
                    !n.read && "bg-accent/20"
                  )}
                  onClick={() => {
                    markAsRead(n.id);
                    navigate("/dashboard/notificaciones");
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", severityColors[n.severity])}>
                        {severityLabels[n.severity]}
                      </Badge>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 mt-1"
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/dashboard/notificaciones")}>
            Ver todas las notificaciones
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
