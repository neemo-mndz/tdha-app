import type { MoodValue } from "@/lib/types/calendar";

/**
 * Mapping de MoodValue para emoji correspondente.
 */
const MOOD_EMOJI_MAP: Record<MoodValue, string> = {
  awful: "😞",
  bad: "😕",
  neutral: "🙂",
  good: "😄",
  great: "🤩",
};

/**
 * Mapping de MoodValue para aria-label em PT-BR.
 */
const MOOD_ARIA_LABEL_MAP: Record<MoodValue, string> = {
  awful: "Humor: péssimo",
  bad: "Humor: ruim",
  neutral: "Humor: neutro",
  good: "Humor: bom",
  great: "Humor: ótimo",
};

/**
 * Retorna o emoji correspondente ao MoodValue.
 */
export function getMoodEmoji(mood: MoodValue): string {
  return MOOD_EMOJI_MAP[mood];
}

/**
 * Retorna o aria-label PT-BR correspondente ao MoodValue.
 */
export function getMoodAriaLabel(mood: MoodValue): string {
  return MOOD_ARIA_LABEL_MAP[mood];
}

/**
 * Array ordenado de mood options (awful → great) para uso no selector.
 */
export const MOOD_OPTIONS: readonly MoodValue[] = [
  "awful",
  "bad",
  "neutral",
  "good",
  "great",
] as const;
