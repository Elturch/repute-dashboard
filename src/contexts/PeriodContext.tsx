import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type PeriodPreset = "1d" | "3d" | "7d" | "1m" | "90d" | "custom";

export const PRESETS: { key: PeriodPreset; label: string; days: number }[] = [
  { key: "1d", label: "1 día", days: 1 },
  { key: "3d", label: "3 días", days: 3 },
  { key: "7d", label: "1 semana", days: 7 },
  { key: "1m", label: "1 mes", days: 30 },
  { key: "90d", label: "90 días", days: 90 },
];

const STORAGE = "qs_period";

function fmt(d: Date) { return d.toISOString().slice(0, 10); }
function rangeForDays(days: number) {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - (days - 1)); // incluye hoy
  return { desde: fmt(desde), hasta: fmt(hasta) };
}

type PeriodValue = {
  preset: PeriodPreset;
  desde: string;
  hasta: string;
  setPreset: (p: PeriodPreset) => void;
  setCustom: (desde: string, hasta: string) => void;
};

const Ctx = createContext<PeriodValue | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE) || "null"); } catch { return null; } })();
  const [preset, setPresetState] = useState<PeriodPreset>(saved?.preset ?? "7d");
  const [custom, setCustomRange] = useState<{ desde: string; hasta: string }>(
    saved?.preset === "custom" ? { desde: saved.desde, hasta: saved.hasta } : rangeForDays(7)
  );

  const range = preset === "custom" ? custom : rangeForDays(PRESETS.find(p => p.key === preset)?.days ?? 7);

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(preset === "custom" ? { preset, ...custom } : { preset })); } catch { /* noop */ }
  }, [preset, custom]);

  const setPreset = (p: PeriodPreset) => setPresetState(p);
  const setCustom = (desde: string, hasta: string) => { setCustomRange({ desde, hasta }); setPresetState("custom"); };

  return <Ctx.Provider value={{ preset, desde: range.desde, hasta: range.hasta, setPreset, setCustom }}>{children}</Ctx.Provider>;
}

export function usePeriod() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePeriod fuera de PeriodProvider");
  return c;
}
