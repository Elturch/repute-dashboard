import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export const TV_PLAYLIST = [
  "/dashboard/privados",
  "/dashboard/privados/noticias",
  "/dashboard/privados/instagram",
  "/dashboard/privados/tiktok",
  "/dashboard/privados/twitter",
  "/dashboard/privados/mybusiness",
  "/dashboard/sermas",
  "/dashboard/catsalut",
  "/dashboard/fjd",
] as const;

const SLIDE_MS = 30_000;
const STORAGE_KEY = "qs_tv_mode_active";

export function useTvMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<boolean>(() => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1");
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playlist, setPlaylist] = useState<string[]>(() => [...TV_PLAYLIST]);

  // Playlist compartida desde la BD (activos, por orden). Si falla o está vacía, usa el default.
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data, error } = await externalSupabase
          .from("tv_paneles").select("path,orden,activo").eq("activo", true).order("orden");
        if (!cancel && !error && data && data.length) setPlaylist(data.map((r: any) => r.path));
      } catch { /* default */ }
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (active) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
    // Sincroniza todas las instancias del hook (p. ej. página de gestión ↔ layout)
    window.dispatchEvent(new CustomEvent("qs-tv-mode", { detail: active }));
  }, [active]);

  useEffect(() => {
    const onSync = (e: Event) => setActive((e as CustomEvent<boolean>).detail);
    window.addEventListener("qs-tv-mode", onSync);
    return () => window.removeEventListener("qs-tv-mode", onSync);
  }, []);

  const idx = playlist.findIndex(p => p === location.pathname);
  const currentIndex = idx >= 0 ? idx : 0;

  const start = useCallback(() => {
    setProgress(0); setPaused(false); setActive(true);
    window.dispatchEvent(new CustomEvent("qs-tv-mode", { detail: true }));
    navigate(playlist[0] ?? TV_PLAYLIST[0], { replace: true });
  }, [navigate, playlist]);

  const stop = useCallback(() => setActive(false), []);

  const next = useCallback(() => {
    if (!playlist.length) return;
    const n = (currentIndex + 1) % playlist.length;
    navigate(playlist[n], { replace: true }); setProgress(0);
  }, [currentIndex, navigate, playlist]);

  const prev = useCallback(() => {
    if (!playlist.length) return;
    const p = (currentIndex - 1 + playlist.length) % playlist.length;
    navigate(playlist[p], { replace: true }); setProgress(0);
  }, [currentIndex, navigate, playlist]);

  const togglePause = useCallback(() => setPaused(p => !p), []);

  // Auto-rotación (se detiene en pausa)
  useEffect(() => {
    if (!active || paused || playlist.length === 0) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(100, (elapsed / SLIDE_MS) * 100));
      if (elapsed >= SLIDE_MS) {
        const n = (currentIndex + 1) % playlist.length;
        navigate(playlist[n], { replace: true });
        setProgress(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [active, paused, currentIndex, navigate, playlist]);

  useEffect(() => {
    if (!active) return;
    queryClient.invalidateQueries({ queryKey: ['kpi_canal_global'] });
    queryClient.invalidateQueries({ queryKey: ['kpi-canal-global'] });
  }, [active, currentIndex, queryClient]);

  useEffect(() => {
    if (active) document.body.classList.add('tv-mode-active');
    else document.body.classList.remove('tv-mode-active');
    return () => { document.body.classList.remove('tv-mode-active'); };
  }, [active]);

  // Teclado: Esc sale, flechas navegan, espacio pausa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active) return;
      if (e.key === "Escape") setActive(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") { e.preventDefault(); togglePause(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, prev, togglePause]);

  return {
    active, paused, currentIndex, progress,
    currentPath: playlist[currentIndex], total: playlist.length,
    start, stop, next, prev, togglePause,
  };
}

export function useHideCursor(active: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!active) { setHidden(false); return; }
    let t: ReturnType<typeof setTimeout>;
    const show = () => { setHidden(false); clearTimeout(t); t = setTimeout(() => setHidden(true), 3000); };
    show();
    window.addEventListener("mousemove", show);
    return () => { window.removeEventListener("mousemove", show); clearTimeout(t); };
  }, [active]);
  useEffect(() => {
    document.body.style.cursor = hidden ? "none" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hidden]);
}
