import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home, BarChart3, ShieldAlert, FileText, Hospital, Bell, Monitor, BookOpen
} from "lucide-react";

const ONBOARDING_KEY = "mr_onboarding_done";

const tourSteps = [
  { icon: Home, title: "Resumen Global", desc: "Tu punto de partida: KPIs principales, alertas activas y relato semanal en un vistazo." },
  { icon: BarChart3, title: "Benchmarking", desc: "Compara Quirónsalud con otros grupos hospitalarios por nota IA, fortaleza y riesgo." },
  { icon: ShieldAlert, title: "Riesgo y Alertas", desc: "Monitoriza cascadas activas y niveles de peligro reputacional en tiempo real." },
  { icon: FileText, title: "Relato IA", desc: "Timeline narrativo semanal con análisis de tono, ángulos y recomendaciones." },
  { icon: Hospital, title: "Fund. Jiménez Díaz", desc: "Espacio dedicado al activo estratégico FJD: canales, alertas y comparativas." },
  { icon: Bell, title: "Notificaciones", desc: "Recibe alertas push cuando se detectan cascadas de riesgo alto o crítico." },
  { icon: Monitor, title: "Modo TV Premium", desc: "Presentación fullscreen para pantalla vertical de 65\" con rotación automática." },
  { icon: BookOpen, title: "Documentación", desc: "Mapa de navegación, glosario, changelog y FAQ completos del sistema." },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_KEY) !== "true") {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const isWelcome = step === 0;
  const isTour = step > 0;
  const tourIndex = step - 1;
  const current = isTour ? tourSteps[tourIndex] : null;
  const totalSteps = tourSteps.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        {isWelcome ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Bienvenido a Quirónsalud 4.0</DialogTitle>
              <DialogDescription className="text-sm mt-2">
                Monitor Reputacional — Tu plataforma centralizada para monitorizar, analizar y proteger
                la reputación de Quirónsalud en todos los canales digitales.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge variant="secondary">10 módulos</Badge>
              <Badge variant="secondary">23+ vistas de datos</Badge>
              <Badge variant="secondary">Alertas en tiempo real</Badge>
              <Badge variant="secondary">Modo TV</Badge>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setStep(1)} className="flex-1">Tour guiado</Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">Empezar ya</Button>
            </div>
          </>
        ) : current ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <current.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base">{current.title}</DialogTitle>
                  <p className="text-[10px] text-muted-foreground">
                    Paso {tourIndex + 1} de {totalSteps}
                  </p>
                </div>
              </div>
              <DialogDescription className="text-sm">
                {current.desc}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-1">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === tourIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {tourIndex > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>Anterior</Button>
                )}
                {tourIndex < totalSteps - 1 ? (
                  <Button size="sm" onClick={() => setStep(step + 1)}>Siguiente</Button>
                ) : (
                  <Button size="sm" onClick={handleClose}>Empezar</Button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
