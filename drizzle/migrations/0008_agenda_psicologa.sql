ALTER TABLE "agenda_entries" DROP CONSTRAINT "agenda_entries_tags_check";
--> statement-breakpoint
ALTER TABLE "agenda_entries" ADD CONSTRAINT "agenda_entries_tags_check" CHECK ("tags" <@ ARRAY['trabalho','casal','pessoal','psicologa']::text[] AND cardinality("tags") between 1 and 4 AND array_position("tags", NULL) IS NULL);
