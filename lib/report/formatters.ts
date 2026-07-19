/**
 * Funções de formatação para relatórios semanais.
 */

/**
 * Gera o nome do arquivo de relatório semanal.
 *
 * @param userName - Nome do usuário (ou null/vazio para fallback "usuario")
 * @param startDate - Data de início no formato yyyy-MM-dd
 * @param endDate - Data de fim no formato yyyy-MM-dd
 * @param ext - Extensão do arquivo: "pdf" ou "xlsx"
 * @returns Nome do arquivo no formato: semana_[slug]_[DD-MM-YYYY]_[DD-MM-YYYY].[ext]
 */
export function generateFilename(
  userName: string | null,
  startDate: string,
  endDate: string,
  ext: "pdf" | "xlsx"
): string {
  const slug =
    userName && userName.trim().length > 0
      ? userName.trim().toLowerCase().replace(/\s+/g, "-")
      : "usuario";

  const startFormatted = formatDateToBR(startDate);
  const endFormatted = formatDateToBR(endDate);

  return `semana_${slug}_${startFormatted}_${endFormatted}.${ext}`;
}

/**
 * Converte uma data no formato yyyy-MM-dd para DD-MM-YYYY.
 */
function formatDateToBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
}
