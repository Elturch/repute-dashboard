import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTvMode, useHideCursor, TV_PANELS } from "@/hooks/useTvMode";
import { TvCanalPanel } from "@/components/tv/TvCanalPanel";
import { TvBloquePanel } from "@/components/tv/TvBloquePanel";

const ModoTV = () => {
  const navigate = useNavigate();
  const { active, currentIndex, progress, total, start, stop } = useTvMode();
  useHideCursor(true);

  const [fadeOut, setFadeOut] = useState(false);

  // Si llegamos directo a /dashboard/tv sin haber iniciado, arrancamos
  useEffect(() => {
    if (!active) start();
  }, [active, start]);

  // Marca body para escalado portrait
  useEffect(() => {
    document.body.classList.add('tv-mode');
    return () => { document.body.classList.remove('tv-mode'); };
  }, []);

  // Fade entre paneles
  useEffect(() => {
    setFadeOut(true);
    const t = setTimeout(() => setFadeOut(false), 300);
    return () => clearTimeout(t);
  }, [currentIndex]);

  // ESC ya gestionado en useTvMode → asegura volver
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stop(); navigate('/dashboard'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stop, navigate]);

  const panel = TV_PANELS[currentIndex];

  return (
    <div className={`fixed inset-0 z-[9999] bg-background overflow-hidden transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {panel.type === 'canal' ? (
        <TvCanalPanel
          canal={panel.canal}
          titulo={panel.titulo}
          currentIndex={currentIndex}
          total={total}
          progress={progress}
        />
      ) : (
        <TvBloquePanel
          bloque={panel.bloque}
          titulo={panel.titulo}
          currentIndex={currentIndex}
          total={total}
          progress={progress}
        />
      )}
    </div>
  );
};

export default ModoTV;
