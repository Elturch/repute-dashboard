import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const TV_PLAYLIST: { path: string; titulo: string }[] = [
  { path: "/dashboard/privados",            titulo: "Privados — Resumen 30d" },
  { path: "/dashboard/privados/noticias",   titulo: "Privados — Medios" },
  { path: "/dashboard/privados/instagram",  titulo: "Privados — Instagram" },
  { path: "/dashboard/privados/tiktok",     titulo: "Privados — TikTok" },
  { path: "/dashboard/privados/twitter",    titulo: "Privados — X (Twitter)" },
  { path: "/dashboard/privados/facebook",   titulo: "Privados — Facebook" },
  { path: "/dashboard/privados/linkedin",   titulo: "Privados — LinkedIn" },
  { path: "/dashboard/privados/mybusiness", titulo: "Privados — Reseñas Google" },

  { path: "/dashboard/sermas",              titulo: "SERMAS — Resumen 30d" },
  { path: "/dashboard/sermas/medios",       titulo: "SERMAS — Medios" },
  { path: "/dashboard/sermas/instagram",    titulo: "SERMAS — Instagram" },
  { path: "/dashboard/sermas/tiktok",       titulo: "SERMAS — TikTok" },
  { path: "/dashboard/sermas/twitter",      titulo: "SERMAS — X (Twitter)" },
  { path: "/dashboard/sermas/facebook",     titulo: "SERMAS — Facebook" },
  { path: "/dashboard/sermas/linkedin",     titulo: "SERMAS — LinkedIn" },
  { path: "/dashboard/sermas/mybusiness",   titulo: "SERMAS — Reseñas Google" },

  { path: "/dashboard/catsalut",            titulo: "CATSALUT — Resumen 30d" },
  { path: "/dashboard/catsalut/medios",     titulo: "CATSALUT — Medios" },
  { path: "/dashboard/catsalut/instagram",  titulo: "CATSALUT — Instagram" },
  { path: "/dashboard/catsalut/tiktok",     titulo: "CATSALUT — TikTok" },
  { path: "/dashboard/catsalut/twitter",    titulo: "CATSALUT — X (Twitter)" },
  { path: "/dashboard/catsalut/facebook",   titulo: "CATSALUT — Facebook" },
  { path: "/dashboard/catsalut/linkedin",   titulo: "CATSALUT — LinkedIn" },
  { path: "/dashboard/catsalut/mybusiness", titulo: "CATSALUT — Reseñas Google" },

  { path: "/dashboard/fjd",                 titulo: "Fundación Jiménez Díaz" },
];

const SLIDE_DURATION_MS = 30_000;
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

  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(pct);
      if (elapsed >= SLIDE_DURATION_MS) {
        setCurrentIndex(i => (i + 1) % TV_PLAYLIST.length);
        setProgress(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [active, currentIndex]);

  useEffect(() => {
    if (!active) return;
    const target = TV_PLAYLIST[currentIndex];
    navigate(target.path, { replace: true });
    // Refrescar datos al entrar en cada panel
    queryClient.invalidateQueries({ queryKey: ["kpi_canal_global"] });
  }, [active, currentIndex, navigate, queryClient]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) setActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const start = useCallback(() => {
    setCurrentIndex(0);
    setProgress(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => setActive(false), []);

  const next = useCallback(() => {
    setCurrentIndex(i => (i + 1) % TV_PLAYLIST.length);
    setProgress(0);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex(i => (i - 1 + TV_PLAYLIST.length) % TV_PLAYLIST.length);
    setProgress(0);
  }, []);

  return {
    active, currentIndex, progress,
    current: TV_PLAYLIST[currentIndex],
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