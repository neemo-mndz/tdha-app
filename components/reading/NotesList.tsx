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
  switch (action.type) {
    case "remove":
      return state.filter((note) => note.id !== action.id);
    default:
      return state;
  }
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

    const result = await deleteBookNote({ noteId });
    if (!result.success) {
      // Rollback happens automatically via re-render with original notes prop
    }
  };

  if (optimisticNotes.length === 0) {
    return (
      <p className="notes-list__empty">Nenhuma nota ainda.</p>
    );
  }

  return (
    <div className="notes-list">
      {optimisticNotes.map((note) => (
        <div key={note.id} className="note-item">
          <div className="note-item__content">{note.content}</div>
          <div className="note-item__footer">
            <span className="note-item__date">
              {new Date(note.createdAt).toLocaleDateString("pt-BR")}
            </span>
            <button
              className="note-item__delete-btn"
              onClick={() => handleDelete(note.id)}
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
