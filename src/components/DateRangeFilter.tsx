import { useState } from "react";
import { format } from "date-fns";

import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeFilterProps {
  from: Date | undefined;
  to: Date | undefined;
  onChange: (from: Date | undefined, to: Date | undefined) => void;
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from, to });

  const handleSelect = (selected: { from?: Date; to?: Date } | undefined) => {
    const newRange = { from: selected?.from, to: selected?.to };
    setRange(newRange);
    onChange(newRange.from, newRange.to);
  };

  const clear = () => {
    setRange({ from: undefined, to: undefined });
    onChange(undefined, undefined);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal h-8 text-xs", !range.from && "text-muted-foreground")}>
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {range.from ? (
              range.to ? (
                `${format(range.from, "dd/MM/yy")} – ${format(range.to, "dd/MM/yy")}`
              ) : (
                format(range.from, "dd/MM/yy")
              )
            ) : (
              "Rango de fechas"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range.from ? { from: range.from, to: range.to } : undefined}
            onSelect={handleSelect as any}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      {range.from && (
        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clear}>
          Limpiar
        </Button>
      )}
    </div>
  );
}
