"use client";

import { useOptimistic, useTransition } from "react";
import { deleteBookNote } from "@/lib/actions/bookNotes";
import type { BookNoteDisplay } from "@/lib/types/reading";

interface NotesListProps {
  notes: BookNoteDisplay[];
}

type OptimisticAction = { type: "remove"; id: string };

function notesReducer(
  state: BookNoteDisplay[],
  action: OptimisticAction
): BookNoteDisplay[] {
  if (action.type === "remove") {
    return state.filter((note) => note.id !== action.id);
  }
  return state;
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${day}  ${months[d.getMonth()]}`;
}

export function NotesList({ notes }: NotesListProps) {
  const [optimisticNotes, dispatch] = useOptimistic(notes, notesReducer);
  const [, startTransition] = useTransition();

  const handleDelete = async (noteId: string) => {
    const confirmed = window.confirm("Excluir esta nota?");
    if (!confirmed) return;

    startTransition(() => {
      dispatch({ type: "remove", id: noteId });
    });

    await deleteBookNote({ noteId });
  };

  if (optimisticNotes.length === 0) {
    return null;
  }

  return (
    <div className="notes-list">
      {optimisticNotes.map((note) => (
        <div key={note.id} className="note-item">
          <span className="note-item__date">{formatNoteDate(note.createdAt)}</span>
          <span className="note-item__content">{note.content}</span>
          <button
            className="note-item__delete-btn"
            onClick={() => handleDelete(note.id)}
            aria-label="Excluir nota"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
