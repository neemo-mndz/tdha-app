import { jsPDF } from "jspdf";
import type { WeekReportData } from "@/lib/types/report";

export function generatePdfReport(data: WeekReportData): Blob {
  const doc = new jsPDF("p", "mm", "a4");
  const margin = 20;
  let y = margin;

  // Helper: add new page if needed
  function checkPageBreak(neededSpace: number) {
    if (y + neededSpace > 277) {
      // 297 - 20mm bottom margin
      doc.addPage();
      y = margin;
    }
  }

  // Title: "Relatório Semanal"
  doc.setFontSize(18);
  doc.text("Relatório Semanal", margin, y);
  y += 10;

  // User name
  doc.setFontSize(12);
  doc.text(data.userName ?? "Usuário", margin, y);
  y += 6;

  // Date range (format DD/MM/YYYY - DD/MM/YYYY)
  const startFormatted = formatDateBR(data.dateRange.start);
  const endFormatted = formatDateBR(data.dateRange.end);
  doc.setFontSize(10);
  doc.text(`Período: ${startFormatted} a ${endFormatted}`, margin, y);
  y += 12;

  // Check if all days are empty
  const hasAnyData = data.days.some(
    (d) => d.logs.length > 0 || d.taskProgress.length > 0 || d.readingActivity
  );

  if (!hasAnyData) {
    doc.setFontSize(11);
    doc.text(
      "Nenhum registro encontrado para o período selecionado",
      margin,
      y
    );
    return doc.output("blob");
  }

  // For each day
  for (const day of data.days) {
    checkPageBreak(20);

    // Day header
    doc.setFontSize(13);
    doc.text(formatDateBR(day.date), margin, y);
    y += 8;

    const dayHasData =
      day.logs.length > 0 || day.taskProgress.length > 0 || day.readingActivity;

    if (!dayHasData) {
      doc.setFontSize(10);
      doc.text("Sem registros neste dia", margin, y);
      y += 8;
      continue;
    }

    // Logs
    if (day.logs.length > 0) {
      doc.setFontSize(10);
      for (const log of day.logs) {
        checkPageBreak(8);
        const time = formatTime(log.createdAt);
        doc.text(`${time} — ${log.content}`, margin + 4, y);
        y += 6;
      }
      y += 4;
    }

    // Task progress
    if (day.taskProgress.length > 0) {
      checkPageBreak(10);
      doc.setFontSize(10);
      doc.text("Tarefas:", margin, y);
      y += 6;
      for (const task of day.taskProgress) {
        checkPageBreak(6);
        doc.text(`• ${task.name}: ${task.done}/${task.goal}`, margin + 4, y);
        y += 5;
      }
      y += 4;
    }

    // Reading activity
    if (day.readingActivity) {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.text(`Leitura: ${day.readingActivity.bookTitle}`, margin, y);
      y += 8;
    }

    y += 4; // spacing between days
  }

  return doc.output("blob");
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
