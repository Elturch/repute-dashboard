import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TV_SLIDES, useTVSlideData, TVSlideConfig, TVGroupAgg } from "@/hooks/useTVData";
import { useRelatoAcumulado } from "@/hooks/useDashboardData";
import { Monitor, Play, Pause, ChevronLeft, ChevronRight, X, Settings } from "lucide-react";

/* ── constants ── */
const QS_COLOR = "hsl(217, 91%, 60%)";
const NEUTRAL_COLOR = "hsl(215, 15%, 45%)";
const DEFAULT_INTERVAL = 15;

/* ── helpers ── */
function notaColor(n: number): string {
  if (n < 3) return "hsl(142, 71%, 45%)";
  if (n < 5) return "hsl(48, 96%, 53%)";
  if (n < 7) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

/* ── Gauge for TV — large ── */
function TVGauge({ value, label, size = 200 }: { value: number; label: string; size?: number }) {
  const pct = Math.min(value / 10, 1);
  const angle = pct * 180;
  const color = notaColor(value);
  const r = size / 2 - 20;
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size / 2 }} className="relative">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <path d="M 15 90 A 85 85 0 0 1 185 90" fill="none" stroke="hsl(217, 33%, 22%)" strokeWidth="14" strokeLinecap="round" />
          <path d="M 15 90 A 85 85 0 0 1 185 90" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${angle * (Math.PI * 85) / 180} 999`} />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span className="font-bold text-white" style={{ fontSize: size * 0.22 }}>{value.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-white/60 mt-2" style={{ fontSize: Math.max(16, size * 0.09) }}>{label}</span>
    </div>
  );
}

/* ── Score Row for TV ── */
function TVScoreRow({ groups, metric, label, lowerIsBetter }: {
  groups: TVGroupAgg[]; metric: keyof TVGroupAgg; label: string; lowerIsBetter?: boolean;
}) {
  const sorted = [...groups].sort((a, b) => {
    const va = Number(a[metric]) || 0;
    const vb = Number(b[metric]) || 0;
    return lowerIsBetter ? va - vb : vb - va;
  });
  return (
    <div className="space-y-3">
      <h3 className="text-white/50 text-lg uppercase tracking-widest">{label}</h3>
      {sorted.map((g, i) => {
        const val = Number(g[metric]) || 0;
        const pct = Math.min((val / 10) * 100, 100);
        const color = g.primary ? QS_COLOR : NEUTRAL_COLOR;
        return (
          <div key={g.key} className="flex items-center gap-4">
            <span className="text-white/40 font-mono text-xl w-10 text-right">#{i + 1}</span>
            <span className={`text-xl w-56 truncate ${g.primary ? 'text-[hsl(217,91%,60%)] font-bold' : 'text-white/80'}`}>
              {g.label}
            </span>
            <div className="flex-1 h-8 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="text-white font-mono text-2xl font-bold w-20 text-right">{val.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Slide Content ── */
function SlideContent({ slide }: { slide: TVSlideConfig }) {
  const { data: groups, isLoading } = useTVSlideData(slide);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(217,91%,60%)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/40 text-2xl">Sin datos disponibles</p>
      </div>
    );
  }

  const qs = groups.find(g => g.primary);
  const qsLeads = qs && groups.every(g => g.primary || g.fortaleza <= qs.fortaleza);

  return (
    <div className="flex-1 flex flex-col px-16 py-10 overflow-hidden">
      {/* Slide header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white">{slide.title}</h2>
        <p className="text-xl text-white/50 mt-1">{slide.subtitle}</p>
        {qs && (
          <div className="mt-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[hsl(217,91%,60%)]" />
            <span className="text-[hsl(217,91%,60%)] text-xl font-semibold">
              {qsLeads ? `${qs.label} lidera` : `${qs.label}: ${qs.nota.toFixed(1)}/10`}
            </span>
          </div>
        )}
      </div>

      {/* Gauges */}
      <div className="flex justify-center gap-12 mb-10">
        {groups.map(g => (
          <TVGauge key={g.key} value={g.nota} label={g.label} size={180} />
        ))}
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 gap-8 flex-1">
        <TVScoreRow groups={groups} metric="fortaleza" label="Fortaleza Reputacional" />
        <TVScoreRow groups={groups} metric="riesgo" label="Riesgo Reputacional" lowerIsBetter />
      </div>
    </div>
  );
}

/* ── Cover Slide ── */
function CoverSlide({ onStart }: { onStart: () => void }) {
  const [time, setTime] = useState(new Date());
  const relato = useRelatoAcumulado();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const riesgo = String(relato.data?.riesgo_agregado ?? "").toLowerCase();
  const statusColor = riesgo.includes("bajo") ? "hsl(142, 71%, 45%)" :
    riesgo.includes("medio") ? "hsl(48, 96%, 53%)" :
    riesgo.includes("alto") ? "hsl(25, 95%, 53%)" : "hsl(215, 15%, 50%)";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-16">
      {/* Logo / Branding */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-2xl bg-[hsl(217,91%,60%)] flex items-center justify-center">
          <Monitor className="w-10 h-10 text-white" />
        </div>
      </div>
      <h1 className="text-6xl font-bold text-white tracking-tight">Quirónsalud</h1>
      <p className="text-2xl text-white/40 mt-2 tracking-widest uppercase">Modo TV Premium</p>

      {/* Clock */}
      <div className="mt-12 text-center">
        <p className="text-7xl font-mono font-light text-white/90 tracking-wider">
          {time.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xl text-white/40 mt-2">
          {time.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* System status */}
      <div className="mt-12 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
        <span className="text-lg text-white/60">
          Estado del sistema: {relato.data?.riesgo_agregado ?? "Cargando..."}
        </span>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="mt-16 flex items-center gap-4 px-10 py-5 rounded-2xl bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,65%)] transition-colors text-white text-2xl font-semibold"
      >
        <Play className="w-8 h-8" />
        Iniciar Rotación
      </button>
    </div>
  );
}

/* ── Closing Slide ── */
function ClosingSlide() {
  const relato = useRelatoAcumulado();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-16 text-center">
      <div className="w-16 h-16 rounded-xl bg-[hsl(217,91%,60%)] flex items-center justify-center mb-8">
        <Monitor className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-5xl font-bold text-white">Quirónsalud</h2>
      <p className="text-2xl text-white/40 mt-3 tracking-widest uppercase">Resumen de Posición</p>
      {relato.data && (
        <div className="mt-12 max-w-2xl">
          <p className="text-3xl text-[hsl(217,91%,60%)] font-semibold">{relato.data.recomendacion_accion ?? ""}</p>
          {relato.data.resumen_narrativo && (
            <p className="text-xl text-white/50 mt-6 leading-relaxed">{relato.data.resumen_narrativo}</p>
          )}
        </div>
      )}
      <p className="text-white/20 text-lg mt-16">La rotación continuará automáticamente</p>
    </div>
  );
}

/* ── Main TV Mode Component ── */
const ModoTV = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'cover' | 'slides' | 'closing'>('cover');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [interval, setIntervalTime] = useState(DEFAULT_INTERVAL);
  const [showSettings, setShowSettings] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const totalSlides = TV_SLIDES.length;

  // Fullscreen management
  useEffect(() => {
    try { document.documentElement.requestFullscreen?.(); } catch {}
    return () => { try { document.exitFullscreen?.(); } catch {} };
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (!playing || phase !== 'slides') return;
    timerRef.current = setTimeout(() => {
      goNext();
    }, interval * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, currentSlide, phase, interval]);

  const transition = useCallback((cb: () => void) => {
    setTransitioning(true);
    setTimeout(() => {
      cb();
      setTimeout(() => setTransitioning(false), 50);
    }, 300);
  }, []);

  const goNext = useCallback(() => {
    transition(() => {
      if (currentSlide >= totalSlides - 1) {
        setPhase('closing');
        setCurrentSlide(0);
        setTimeout(() => {
          transition(() => {
            setPhase('slides');
            setCurrentSlide(0);
          });
        }, interval * 1000);
      } else {
        setCurrentSlide(prev => prev + 1);
      }
    });
  }, [currentSlide, totalSlides, interval, transition]);

  const goPrev = useCallback(() => {
    transition(() => {
      if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
    });
  }, [currentSlide, transition]);

  const handleStart = () => {
    transition(() => {
      setPhase('slides');
      setCurrentSlide(0);
      setPlaying(true);
    });
  };

  const handleExit = () => {
    try { document.exitFullscreen?.(); } catch {}
    navigate("/dashboard");
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleExit();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'p' || e.key === 'P') setPlaying(p => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, handleExit]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[hsl(222,47%,8%)] flex flex-col overflow-hidden select-none">
      {/* Content with transition */}
      <div className={`flex-1 flex flex-col transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {phase === 'cover' && <CoverSlide onStart={handleStart} />}
        {phase === 'slides' && <SlideContent slide={TV_SLIDES[currentSlide]} />}
        {phase === 'closing' && <ClosingSlide />}
      </div>

      {/* Bottom controls */}
      <div className="h-16 flex items-center justify-between px-8 bg-white/5">
        <button onClick={handleExit} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <X className="w-4 h-4" />
          Salir
        </button>

        {phase === 'slides' && (
          <div className="flex items-center gap-6">
            <button onClick={goPrev} disabled={currentSlide === 0} className="text-white/40 hover:text-white disabled:text-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setPlaying(p => !p)} className="text-white/60 hover:text-white transition-colors">
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button onClick={goNext} className="text-white/40 hover:text-white transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Progress dots */}
            <div className="flex gap-2 ml-4">
              {TV_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => transition(() => setCurrentSlide(i))}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-[hsl(217,91%,60%)] scale-125' : 'bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {phase === 'slides' && (
            <span className="text-white/30 text-sm font-mono">
              {currentSlide + 1}/{totalSlides}
            </span>
          )}
          <button onClick={() => setShowSettings(s => !s)} className="text-white/30 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings overlay */}
      {showSettings && (
        <div className="absolute bottom-20 right-8 bg-[hsl(222,47%,12%)] border border-white/10 rounded-xl p-6 w-72 space-y-4 shadow-2xl">
          <h3 className="text-white text-sm font-semibold">Configuración TV</h3>
          <div>
            <label className="text-white/50 text-xs">Segundos por pantalla</label>
            <input
              type="range"
              min={5}
              max={60}
              value={interval}
              onChange={e => setIntervalTime(Number(e.target.value))}
              className="w-full mt-1 accent-[hsl(217,91%,60%)]"
            />
            <span className="text-white/60 text-sm">{interval}s</span>
          </div>
          <button onClick={() => setShowSettings(false)} className="text-white/40 text-xs hover:text-white">Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default ModoTV;
