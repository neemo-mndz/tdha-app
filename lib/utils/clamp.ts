/**
 * Restringe um valor numérico ao intervalo [min, max].
 *
 * Usado para garantir que quantidades (defaultQty, goal) permaneçam
 * dentro dos limites válidos (ex.: 1–99).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
