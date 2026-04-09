import { useState, useEffect, useCallback, useRef } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  description: string;
  severity: "critico" | "alto" | "medio" | "bajo";
  type: "alerta" | "reporte" | "sistema";
  timestamp: string;
  read: boolean;
  sourceKey?: string;
}

const SEVERITY_MAP: Record<string, Notification["severity"]> = {
  critico: "critico",
  crítico: "critico",
  alto: "alto",
  medio: "medio",
  bajo: "bajo",
};

function parseSeverity(raw: string | null): Notification["severity"] {
  if (!raw) return "bajo";
  const lower = raw.toLowerCase();
  for (const [k, v] of Object.entries(SEVERITY_MAP)) {
    if (lower.includes(k)) return v;
  }
  return "bajo";
}

function alertToNotification(row: any): Notification {
  return {
    id: row.id ?? `alert_${row.topic_key}_${row.last_alert_at}`,
    title: row.topic_description ?? row.topic_key ?? "Alerta sin título",
    description: `${row.alert_count ?? 0} alertas detectadas — Fuente: ${row.first_source ?? "desconocida"}`,
    severity: parseSeverity(row.max_riesgo),
    type: "alerta",
    timestamp: row.last_alert_at ?? new Date().toISOString(),
    read: false,
    sourceKey: row.topic_key,
  };
}

const STORAGE_KEY = "mr_notifications_read";

function getReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-500)));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("mr_notif_sound") !== "false"
  );
  const [minSeverity, setMinSeverity] = useState<Notification["severity"]>(
    () => (localStorage.getItem("mr_notif_min_severity") as any) || "alto"
  );
  const readIdsRef = useRef(getReadIds());
  const lastFetchRef = useRef<string | null>(null);

  const severityWeight = (s: Notification["severity"]) =>
    s === "critico" ? 4 : s === "alto" ? 3 : s === "medio" ? 2 : 1;

  const shouldNotify = useCallback(
    (sev: Notification["severity"]) => severityWeight(sev) >= severityWeight(minSeverity),
    [minSeverity]
  );

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await externalSupabase
        .from("alert_cascades")
        .select("id, topic_key, topic_description, alert_count, max_riesgo, last_alert_at, first_source, status")
        .order("last_alert_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const readIds = readIdsRef.current;
      const notifs = (data ?? []).map((row: any) => {
        const n = alertToNotification(row);
        n.read = readIds.has(n.id);
        return n;
      });

      setNotifications(notifs);
      if (data?.length) lastFetchRef.current = data[0].last_alert_at;
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling fallback every 30s
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Realtime subscription attempt
  useEffect(() => {
    const channel = externalSupabase
      .channel("alert_cascades_realtime")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "alert_cascades" },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          const n = alertToNotification(row);
          if (shouldNotify(n.severity)) {
            setNotifications((prev) => [n, ...prev]);
            toast.warning(`🚨 ${n.title}`, { description: n.description, duration: 8000 });
          }
        }
      )
      .subscribe();

    return () => {
      externalSupabase.removeChannel(channel);
    };
  }, [shouldNotify]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    readIdsRef.current.add(id);
    saveReadIds(readIdsRef.current);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    notifications.forEach((n) => readIdsRef.current.add(n.id));
    saveReadIds(readIdsRef.current);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  const clearOld = useCallback((daysOld = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    setNotifications((prev) => prev.filter((n) => new Date(n.timestamp) >= cutoff));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      localStorage.setItem("mr_notif_sound", String(!prev));
      return !prev;
    });
  }, []);

  const updateMinSeverity = useCallback((sev: Notification["severity"]) => {
    setMinSeverity(sev);
    localStorage.setItem("mr_notif_min_severity", sev);
  }, []);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearOld,
    soundEnabled,
    toggleSound,
    minSeverity,
    updateMinSeverity,
    refetch: fetchAlerts,
  };
}
