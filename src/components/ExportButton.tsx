import { Download, FileSpreadsheet, Image, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useExportReport, ExportFormat } from "@/hooks/useExportReport";
import { toast } from "sonner";
import { useEffect } from "react";

interface ExportButtonProps {
  data?: Record<string, unknown>[] | null;
  columns?: string[];
  filename?: string;
  chartId?: string;
  size?: "sm" | "icon";
  formats?: ExportFormat[];
}

export function ExportButton({
  data,
  columns,
  filename,
  chartId,
  size = "icon",
  formats = ["csv", "png"],
}: ExportButtonProps) {
  const { exportReport, exporting, error } = useExportReport();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleExport = async (format: ExportFormat) => {
    await exportReport({ format, data, columns, filename, elementId: chartId });
    if (!error) toast.success(`Exportado como ${format.toUpperCase()}`);
  };

  const icons: Record<ExportFormat, typeof Download> = {
    csv: FileSpreadsheet,
    png: Image,
    pdf: FileText,
  };

  if (formats.length === 1) {
    const Icon = icons[formats[0]];
    return (
      <Button
        variant="ghost"
        size={size}
        disabled={exporting}
        onClick={() => handleExport(formats[0])}
        title={`Exportar ${formats[0].toUpperCase()}`}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} disabled={exporting} title="Exportar">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((f) => {
          const Icon = icons[f];
          return (
            <DropdownMenuItem key={f} onClick={() => handleExport(f)}>
              <Icon className="mr-2 h-4 w-4" />
              {f.toUpperCase()}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
