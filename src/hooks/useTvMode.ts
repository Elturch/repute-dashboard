import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Modo TV: rota entre páginas reales del dashboard cada SLIDE_MS.
 * No reinventa paneles: reusa Privados Resumen, canales Privados, SERMAS,
 * CATSALUT y FJD. Las menciones recientes se ocultan vía .tv-mode-active en CSS.
 */
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
  const [active, setActive] = useState<boolean>(() => {
    return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (active) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  }, [active]);

  // Índice del panel actual derivado de la URL
  const idx = TV_PLAYLIST.findIndex(p => p === location.pathname);
  const currentIndex = idx >= 0 ? idx : 0;

  // Auto-rotación: avanza navegando a la siguiente ruta
  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / SLIDE_MS) * 100);
      setProgress(pct);
      if (elapsed >= SLIDE_MS) {
        const next = (currentIndex + 1) % TV_PLAYLIST.length;
        navigate(TV_PLAYLIST[next], { replace: true });
        setProgress(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [active, currentIndex, navigate]);

  // Refrescar datos al cambiar de panel
  useEffect(() => {
    if (!active) return;
    queryClient.invalidateQueries({ queryKey: ['kpi_canal_global'] });
    queryClient.invalidateQueries({ queryKey: ['kpi-canal-global'] });
  }, [active, currentIndex, queryClient]);

  // Body class para estilos TV (oculta menciones, ajusta grids portrait)
  useEffect(() => {
    if (active) document.body.classList.add('tv-mode-active');
    else document.body.classList.remove('tv-mode-active');
    return () => { document.body.classList.remove('tv-mode-active'); };
  }, [active]);

  // ESC sale
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) {
        setActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const start = useCallback(() => {
    setProgress(0);
    setActive(true);
    navigate(TV_PLAYLIST[0], { replace: true });
  }, [navigate]);

  const stop = useCallback(() => {
    setActive(false);
  }, []);

  const next = useCallback(() => {
    const n = (currentIndex + 1) % TV_PLAYLIST.length;
    navigate(TV_PLAYLIST[n], { replace: true });
    setProgress(0);
  }, [currentIndex, navigate]);

  const prev = useCallback(() => {
    const p = (currentIndex - 1 + TV_PLAYLIST.length) % TV_PLAYLIST.length;
    navigate(TV_PLAYLIST[p], { replace: true });
    setProgress(0);
  }, [currentIndex, navigate]);

  return {
    active, currentIndex, progress,
    currentPath: TV_PLAYLIST[currentIndex],
    total: TV_PLAYLIST.length,
    start, stop, next, prev,
  };
}

export function useHideCursor(active: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!active) { setHidden(false); return; }
    let t: ReturnType<typeof setTimeout>;
    const show = () => {
      setHidden(false);
      clearTimeout(t);
      t = setTimeout(() => setHidden(true), 3000);
    };
    show();
    window.addEventListener("mousemove", show);
    return () => {
      window.removeEventListener("mousemove", show);
      clearTimeout(t);
    };
  }, [active]);

  useEffect(() => {
    document.body.style.cursor = hidden ? "none" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hidden]);
}
