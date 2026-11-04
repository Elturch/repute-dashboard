import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Loader2 } from "lucide-react";

const EDGE_URL = "https://pbzojbamztzdhlvxwhyw.supabase.co/functions/v1/analista";

const STARTERS = [
  "¿Quién lidera en volumen de menciones y reputación?",
  "¿Cómo queda Quirón frente a la privada (HM, Vithas, Sanitas)?",
  "En alta complejidad, ¿gestiona Quirón mejor que la pública pura?",
  "¿En qué canal se amplifica más Quirón?",
  "¿Cómo va Quirón en Cataluña frente a CATSALUT?",
  "Fundación Jiménez Díaz frente a la media del SERMAS",
];

type Msg = { role: "user" | "analista"; texto: string; dato?: string | null };

function renderRich(t: string) {
  const parts = t.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="text-primary">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

export function AnalistaFlotante() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [sugs, setSugs] = useState<string[]>(STARTERS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [msgs, loading]);

  async function preguntar(q: string) {
    const pregunta = q.trim();
    if (!pregunta || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", texto: pregunta }]);
    setSugs([]);
    setLoading(true);
    try {
      const r = await fetch(EDGE_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: pregunta }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "analista", texto: d.respuesta || "Sin respuesta.", dato: d.dato_destacado }]);
      setSugs(Array.isArray(d.sugerencias) ? d.sugerencias.slice(0, 3) : []);
    } catch {
      setMsgs((m) => [...m, { role: "analista", texto: "No he podido conectar. Inténtalo de nuevo." }]);
      setSugs(STARTERS.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:opacity-90 transition"
        title="Analista Quirónsalud"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold hidden sm:inline">Analista</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[90vw] max-w-[400px] flex-col rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Analista Quirónsalud</div>
            <div className="text-[11px] text-muted-foreground">War room · pregúntame lo que quieras</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Soy tu analista del panel. Pregúntame por menciones, reputación, canales, regiones o competencia — comparo Quirónsalud con la privada y con la pública.
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-foreground"
              }
            >
              {m.role === "analista" && m.dato && (
                <div className="mb-1 text-xs font-semibold text-primary">{renderRich(m.dato)}</div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{renderRich(m.texto)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analizando los datos…
          </div>
        )}
        {!loading && sugs.length > 0 && (
          <div className="flex flex-col gap-2 pt-1">
            {sugs.map((s, i) => (
              <button
                key={i}
                onClick={() => preguntar(s)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-left text-xs text-foreground hover:border-primary hover:text-primary transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") preguntar(input); }}
          placeholder="Escribe tu pregunta…"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => preguntar(input)}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default AnalistaFlotante;
