import { z } from "zod";
import { thoughtDateSchema } from "./dayThought.schema";
import { AGENDA_TAGS, PERIODS, periodForTime } from "@/lib/agenda/model";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.").nullable().optional();
export const agendaEntrySchema = z.object({
  title: z.string().trim().min(1, "Dê um título à tarefa ou compromisso.").max(160, "Use até 160 caracteres no título."),
  notes: z.string().trim().max(2000, "Use até 2000 caracteres nas observações.").default(""),
  date: thoughtDateSchema,
  tags: z.array(z.enum(AGENDA_TAGS)).min(1, "Selecione pelo menos um assunto.").max(3).transform(tags => [...new Set(tags)]),
  period: z.enum(PERIODS).default("anytime"),
  completed: z.boolean().optional(),
  startTime: time,
  endTime: time,
}).superRefine((data, context) => {
  if (data.endTime && (!data.startTime || data.endTime <= data.startTime)) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "O horário final deve ser depois do início, no mesmo dia." });
  }
}).transform(data => ({ ...data, startTime: data.startTime ?? null, endTime: data.endTime ?? null,
  period: data.startTime ? periodForTime(data.startTime) : data.period }));
export const agendaIdSchema = z.string().uuid("Compromisso inválido.");
export type AgendaInput = z.output<typeof agendaEntrySchema>;
