import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function safeFormat(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return format(d, fmt, { locale: es });
  } catch {
    return "—";
  }
}

export function safeFormatISO(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return "—";
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return "—";
    return format(d, fmt, { locale: es });
  } catch {
    return "—";
  }
}

export function safeFormatDistance(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return formatDistanceToNow(d, { locale: es, addSuffix: true });
  } catch {
    return "—";
  }
}

export function safeLocaleString(dateStr: string | null | undefined, locale = "es-ES", opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(locale, opts);
  } catch {
    return "—";
  }
}
