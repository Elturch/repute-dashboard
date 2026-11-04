import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RIESGO_REAL_TOOLTIP } from '@/lib/metricas';

export default function RiesgoRealInfo() {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="Qué es el riesgo real" className="inline-flex align-middle text-muted-foreground hover:text-foreground">
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs normal-case tracking-normal">{RIESGO_REAL_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
