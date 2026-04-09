import { useState, useCallback } from "react";

export type ExportFormat = "csv" | "png" | "pdf";

interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  data?: Record<string, unknown>[] | null;
  columns?: string[];
  elementId?: string; // for PNG capture
}

export function useExportReport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCSV = useCallback((data: Record<string, unknown>[], columns: string[], filename: string) => {
    if (!data?.length) throw new Error("No hay datos para exportar");
    const header = columns.join(",");
    const rows = data.map((row) =>
      columns.map((col) => {
        const val = row[col];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filename}.csv`);
  }, []);

  const exportPNG = useCallback(async (elementId: string, filename: string) => {
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Elemento #${elementId} no encontrado`);
    // Use canvas approach for SVG-based charts
    const svgs = el.querySelectorAll("svg");
    if (svgs.length === 0) throw new Error("No se encontraron gráficos para exportar");
    
    const svg = svgs[0];
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.clientWidth * 2;
      canvas.height = svg.clientHeight * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filename}.png`);
      }, "image/png");
    };
    img.src = url;
  }, []);

  const exportReport = useCallback(async (options: ExportOptions) => {
    setExporting(true);
    setError(null);
    try {
      const filename = options.filename || `reporte_${new Date().toISOString().slice(0, 10)}`;
      switch (options.format) {
        case "csv":
          exportCSV(options.data || [], options.columns || Object.keys(options.data?.[0] || {}), filename);
          break;
        case "png":
          await exportPNG(options.elementId || "chart-container", filename);
          break;
        case "pdf":
          // PDF placeholder — generate CSV as fallback
          exportCSV(options.data || [], options.columns || Object.keys(options.data?.[0] || {}), filename + "_datos");
          break;
      }
    } catch (e: any) {
      setError(e.message || "Error al exportar");
    } finally {
      setExporting(false);
    }
  }, [exportCSV, exportPNG]);

  return { exportReport, exporting, error };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
