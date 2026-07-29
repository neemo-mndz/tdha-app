import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato yyyy-MM-dd");

export const searchLogsSchema = z.object({
  text: z.string().max(200).optional().default(""),
  tagIds: z.array(z.string().uuid()).optional().default([]),
  weekStart: dateSchema.nullable().optional().default(null),
});

export type SearchLogsInput = z.infer<typeof searchLogsSchema>;
