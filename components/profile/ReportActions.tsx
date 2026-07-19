"use client";

import { useState } from "react";
import { getWeekReportData } from "@/lib/actions/report";
import { generatePdfReport } from "@/lib/report/pdf";
import { generateXlsReport } from "@/lib/report/xls";
import { generateFilename } from "@/lib/report/formatters";
import type { WeekReportData } from "@/lib/types/report";

interface ReportActionsProps {
  userName: string | null;
  selectedDays: string[];
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

export function ReportActions({ userName, selectedDays }: ReportActionsProps) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXls, setLoadingXls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = selectedDays.length === 0;

  async function handleExportPdf() {
    setError(null);
    setLoadingPdf(true);

    try {
      const result = await getWeekReportData({ dates: selectedDays });

      if ("success" in result && result.success === false) {
        setError("Erro ao gerar PDF. Tente novamente.");
        return;
      }

      const data = result as WeekReportData;
      const blob = await generatePdfReport(data);
      const filename = generateFilename(
        userName,
        data.dateRange.start,
        data.dateRange.end,
        "pdf"
      );
      downloadBlob(blob, filename);
    } catch {
      setError("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setLoadingPdf(false);
    }
  }

  async function handleExportXls() {
    setError(null);
    setLoadingXls(true);

    try {
      const result = await getWeekReportData({ dates: selectedDays });

      if ("success" in result && result.success === false) {
        setError("Erro ao gerar planilha. Tente novamente.");
        return;
      }

      const data = result as WeekReportData;
      const blob = await generateXlsReport(data);
      const filename = generateFilename(
        userName,
        data.dateRange.start,
        data.dateRange.end,
        "xlsx"
      );
      downloadBlob(blob, filename);
    } catch {
      setError("Erro ao gerar planilha. Tente novamente.");
    } finally {
      setLoadingXls(false);
    }
  }

  return (
    <div className="report-actions">
      <div className="report-actions__buttons">
        <button
          type="button"
          className="report-actions__btn report-actions__btn--pdf"
          onClick={handleExportPdf}
          disabled={isDisabled || loadingPdf || loadingXls}
          aria-busy={loadingPdf}
        >
          {loadingPdf ? "Gerando PDF…" : "Exportar PDF"}
        </button>
        <button
          type="button"
          className="report-actions__btn report-actions__btn--xls"
          onClick={handleExportXls}
          disabled={isDisabled || loadingPdf || loadingXls}
          aria-busy={loadingXls}
        >
          {loadingXls ? "Gerando planilha…" : "Exportar Planilha"}
        </button>
      </div>
      {error && (
        <p className="report-actions__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
