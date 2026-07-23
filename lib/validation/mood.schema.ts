import { z } from "zod";

export const MOOD_VALUES = ['great', 'good', 'neutral', 'bad', 'awful'] as const;
export type MoodValue = typeof MOOD_VALUES[number];

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato yyyy-MM-dd");

const moodValueSchema = z.enum(MOOD_VALUES);

export const saveMoodSchema = z.object({
  date: dateSchema,
  mood: moodValueSchema.nullable(),
});

export const saveMoodNoteSchema = z.object({
  date: dateSchema,
  note: z
    .string()
    .max(80, "A nota deve ter no máximo 80 caracteres")
    .nullable()
    .transform((val) => {
      if (val === null) return null;
      const trimmed = val.trim();
      return trimmed.length === 0 ? null : trimmed;
    }),
});

export type SaveMoodInput = z.infer<typeof saveMoodSchema>;
export type SaveMoodNoteInput = z.infer<typeof saveMoodNoteSchema>;
