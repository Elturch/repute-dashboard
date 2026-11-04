import { useState } from "react";
import { usePeriod, PRESETS } from "@/contexts/PeriodContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, Info } from "lucide-react";

export function PeriodSelector() {
  const { preset, desde, hasta, setPreset, setCustom } = usePeriod();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      {PRESETS.map((p) => {
        const btn = (
          <Button
            variant={preset === p.key ? "default" : "outline"}
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setPreset(p.key)}
          >
            {p.label}
            {p.key === "1d" && <Info className="ml-1 h-3 w-3 opacity-70" />}
          </Button>
        );
        return p.key === "1d" ? (
          <Tooltip key={p.key}>
            <TooltipTrigger asChild>{btn}</TooltipTrigger>
            <TooltipContent>Datos parciales (el día aún no ha cerrado)</TooltipContent>
          </Tooltip>
        ) : (
          <span key={p.key}>{btn}</span>
        );
      })}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant={preset === "custom" ? "default" : "outline"} size="sm" className="h-8 gap-1 px-2 text-xs">
            <CalendarIcon className="h-3.5 w-3.5" />
            {preset === "custom" ? `${desde} → ${hasta}` : "Fechas"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={new Date(desde)}
            selected={{ from: new Date(desde), to: new Date(hasta) }}
            onSelect={(r: { from?: Date; to?: Date } | undefined) => {
              if (r?.from && r?.to) {
                setCustom(r.from.toISOString().slice(0, 10), r.to.toISOString().slice(0, 10));
                setOpen(false);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
