import { useTvMode, useHideCursor } from "@/hooks/useTvMode";
import { X } from "lucide-react";

export function TvModeOverlay() {
  const { active, current, currentIndex, total, progress, stop } = useTvMode();
  useHideCursor(active);
  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none">
      <div className="h-10 flex items-center justify-between px-6 bg-[hsl(222,47%,8%)]/95 backdrop-blur border-b border-border pointer-events-auto">
        <span className="text-xs font-bold tracking-widest text-primary">QUIRÓNSALUD 4.0</span>
        <span className="text-sm font-semibold text-foreground truncate">{current.titulo}</span>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground">{currentIndex + 1} / {total}</span>
          <button
            onClick={stop}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Salir TV (Esc)
          </button>
        </div>
      </div>
      <div className="h-[3px] w-full bg-border">
        <div
          className="h-full bg-primary transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}