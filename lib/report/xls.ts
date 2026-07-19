import { Workbook } from "exceljs";
import type { WeekReportData } from "@/lib/types/report";

/**
 * Gera relatório semanal em formato XLSX (.xlsx).
 *
 * Estrutura:
 * - Se não há dados: sheet única "Relatório" com mensagem informativa
 * - Se há dados: 3 sheets — "Registros", "Tarefas", "Leitura"
 *
 * Cada sheet inclui header com nome do usuário e range de datas.
 * Todo texto em pt-BR.
 */
export async function generateXlsReport(
  data: WeekReportData
): Promise<Blob> {
  const workbook = new Workbook();

  const userName = data.userName ?? "Usuário";
  const startFormatted = formatDateBR(data.dateRange.start);
  const endFormatted = formatDateBR(data.dateRange.end);
  const headerText = `${userName} — ${startFormatted} a ${endFormatted}`;

  // Check if all days are empty
  const hasAnyData = data.days.some(
    (d) => d.logs.length > 0 || d.taskProgress.length > 0 || d.readingActivity
  );

  if (!hasAnyData) {
    const sheet = workbook.addWorksheet("Relatório");
    sheet.addRow([headerText]);
    sheet.addRow([
      "Nenhum registro encontrado para o período selecionado",
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  // Sheet 1: Registros (Logs)
  const registrosSheet = workbook.addWorksheet("Registros");
  registrosSheet.addRow([headerText]);
  registrosSheet.addRow(["Data", "Hora", "Conteúdo"]);

  for (const day of data.days) {
    for (const log of day.logs) {
      const time = formatTime(log.createdAt);
      registrosSheet.addRow([formatDateBR(day.date), time, log.content]);
    }
  }

  // Sheet 2: Tarefas (Tasks)
  const tarefasSheet = workbook.addWorksheet("Tarefas");
  tarefasSheet.addRow([headerText]);
  tarefasSheet.addRow(["Tarefa", "Feito", "Meta"]);

  // Task progress is per-week, so take from first day that has data
  const taskProgress =
    data.days.find((d) => d.taskProgress.length > 0)?.taskProgress ?? [];
  for (const task of taskProgress) {
    tarefasSheet.addRow([task.name, task.done, task.goal]);
  }

  // Sheet 3: Leitura (Reading)
  const leituraSheet = workbook.addWorksheet("Leitura");
  leituraSheet.addRow([headerText]);
  leituraSheet.addRow(["Data", "Livro"]);

  for (const day of data.days) {
    if (day.readingActivity) {
      leituraSheet.addRow([
        formatDateBR(day.date),
        day.readingActivity.bookTitle,
      ]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Converte data yyyy-MM-dd para formato DD/MM/YYYY (pt-BR).
 */
function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Extrai hora HH:mm de um timestamp ISO.
 */
function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
