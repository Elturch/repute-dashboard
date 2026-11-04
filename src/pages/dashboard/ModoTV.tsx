import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tv, ArrowUp, ArrowDown, Save, Check } from "lucide-react";
import { useTvMode } from "@/hooks/useTvMode";

type Panel = { id: number; path: string; titulo: string; orden: number; activo: boolean };

export default function ModoTV() {
  const tv = useTvMode();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { cargar(); }, []);
  async function cargar() {
    setLoading(true);
    const { data } = await externalSupabase.from("tv_paneles").select("*").order("orden");
    setPanels(((data as Panel[]) ?? []));
    setLoading(false);
  }
  function toggle(id: number) { setPanels(ps => ps.map(p => p.id === id ? { ...p, activo: !p.activo } : p)); setSaved(false); }
  function mover(i: number, dir: -1 | 1) {
    setPanels(ps => { const a = [...ps]; const j = i + dir; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
    setSaved(false);
  }
  async function guardar() {
    setSaving(true);
    const updates = panels.map((p, i) => ({ id: p.id, path: p.path, titulo: p.titulo, orden: i + 1, activo: p.activo }));
    await externalSupabase.from("tv_paneles").upsert(updates, { onConflict: "id" });
    setSaving(false); setSaved(true); cargar();
  }

  const activos = panels.filter(p => p.activo).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tv className="h-6 w-6 text-primary" /> Modo TV · Gestión de paneles</h1>
          <p className="text-sm text-muted-foreground">Elige y ordena los paneles que rotan en la proyección. Se guarda para todos.</p>
        </div>
        <Button onClick={tv.start} className="gap-2 shrink-0"><Tv className="h-4 w-4" /> Iniciar modo TV</Button>
      </div>

      <Card className="p-4">
        <div className="mb-3 text-sm text-muted-foreground">{activos} paneles activos de {panels.length}</div>
        {loading ? <div className="text-sm text-muted-foreground">Cargando…</div> : (
          <ul className="space-y-2">
            {panels.map((p, i) => (
              <li key={p.id} className={`flex items-center gap-3 rounded-lg border p-3 ${p.activo ? "border-primary/40 bg-primary/5" : "border-border opacity-60"}`}>
                <input type="checkbox" checked={p.activo} onChange={() => toggle(p.id)} className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.titulo}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.path}</div>
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}</span>
                <div className="flex flex-col">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === panels.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Button onClick={guardar} disabled={saving} className="gap-2">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />} {saving ? "Guardando…" : saved ? "Guardado" : "Guardar cambios"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
