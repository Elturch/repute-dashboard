import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** Icono "i" único de la app: abre una explicación (fórmula y fuente) al pasar el ratón o pulsar. */
export default function InfoTip({ text, label = 'Cómo se calcula' }: { text?: string | null; label?: string }) {
  if (!text) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} title={text}
          className="inline-flex align-middle shrink-0 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full">
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs w-auto text-xs normal-case tracking-normal font-normal leading-relaxed p-3">{text}</PopoverContent>
    </Popover>
  );
}
