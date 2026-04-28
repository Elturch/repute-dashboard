import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Canal } from "./useCanalData";

export type TvPanel =
  | { type: 'canal';  canal: Canal;  titulo: string }
  | { type: 'bloque'; bloque: 'sermas' | 'catsalut' | 'fjd'; titulo: string };

export const TV_PANELS: readonly TvPanel[] = [
  { type: 'canal',  canal: 'medios',     titulo: 'MEDIOS' },
  { type: 'canal',  canal: 'instagram',  titulo: 'INSTAGRAM' },
  { type: 'canal',  canal: 'twitter',    titulo: 'X (TWITTER)' },
  { type: 'canal',  canal: 'tiktok',     titulo: 'TIKTOK' },
  { type: 'canal',  canal: 'mybusiness', titulo: 'RESEÑAS GOOGLE' },
  { type: 'bloque', bloque: 'sermas',    titulo: 'SERMAS' },
  { type: 'bloque', bloque: 'catsalut',  titulo: 'CATSALUT' },
  { type: 'bloque', bloque: 'fjd',       titulo: 'FUNDACIÓN JIMÉNEZ DÍAZ' },
] as const;

const SLIDE_DURATION_MS = 45_000;
const STORAGE_KEY = "qs_tv_mode_active";

export function useTvMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<boolean>(() => {
    return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (active) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  }, [active]);

  // Auto-rotación
  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(pct);
      if (elapsed >= SLIDE_DURATION_MS) {
        setCurrentIndex(i => (i + 1) % TV_PANELS.length);
        setProgress(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [active, currentIndex]);

  // Refrescar datos al cambiar de panel
  useEffect(() => {
    if (!active) return;
    queryClient.invalidateQueries({ queryKey: ['kpi_canal_global'] });
    queryClient.invalidateQueries({ queryKey: ['tv-canal-raw'] });
  }, [active, currentIndex, queryClient]);

  // ESC sale
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) {
        setActive(false);
        navigate('/dashboard');
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, navigate]);

  const start = useCallback(() => {
    setCurrentIndex(0);
    setProgress(0);
    setActive(true);
    navigate('/dashboard/tv');
  }, [navigate]);

  const stop = useCallback(() => {
    setActive(false);
    navigate('/dashboard');
  }, [navigate]);

  const next = useCallback(() => {
    setCurrentIndex(i => (i + 1) % TV_PANELS.length);
    setProgress(0);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex(i => (i - 1 + TV_PANELS.length) % TV_PANELS.length);
    setProgress(0);
  }, []);

  return {
    active, currentIndex, progress,
    current: TV_PANELS[currentIndex],
    total: TV_PANELS.length,
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
