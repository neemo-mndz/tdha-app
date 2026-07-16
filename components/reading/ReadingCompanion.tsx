"use client";

import { useState } from "react";
import type {
  CurrentBookDisplay,
  QueuedBookDisplay,
  FinishedBookDisplay,
  BookNoteDisplay,
} from "@/lib/types/reading";
import { CurrentBookCard } from "@/components/reading/CurrentBookCard";
import { ReadingButton } from "@/components/reading/ReadingButton";
import { MiniWeekCalendar } from "@/components/reading/MiniWeekCalendar";
import { NoteForm } from "@/components/reading/NoteForm";
import { NotesList } from "@/components/reading/NotesList";
import { FinishBookModal } from "@/components/reading/FinishBookModal";
import { BookQueueList } from "@/components/reading/BookQueueList";
import { AddBookModal } from "@/components/reading/AddBookModal";
import { FinishedBooksList } from "@/components/reading/FinishedBooksList";

export interface ReadingCompanionProps {
  currentBook: CurrentBookDisplay | null;
  weekReadingDays: string[];
  notes: BookNoteDisplay[];
  finishedBooks: FinishedBookDisplay[];
  queue: QueuedBookDisplay[];
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  // getDay(): 0=Sun, 1=Mon ... 6=Sat → offset to Monday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTodayDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ReadingCompanion({
  currentBook,
  weekReadingDays,
  notes,
  finishedBooks,
  queue,
}: ReadingCompanionProps) {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [addBookMode, setAddBookMode] = useState<"current" | "queue">("queue");

  const todayMarked = weekReadingDays.includes(getTodayDate());
  const weekStart = getWeekStart();

  const handleOpenAddBook = (mode: "current" | "queue") => {
    setAddBookMode(mode);
    setShowAddBookModal(true);
  };

  return (
    <div className="stack">
      <h1>Leitura</h1>

      {currentBook ? (
        <>
          <CurrentBookCard
            book={currentBook}
            onFinish={() => setShowFinishModal(true)}
          />

          <ReadingButton bookId={currentBook.id} todayMarked={todayMarked} />

          <MiniWeekCalendar
            bookId={currentBook.id}
            weekStart={weekStart}
            readDays={weekReadingDays}
          />

          <div className="panel">
            <h2 className="panel__title">Notas</h2>
            <NoteForm bookId={currentBook.id} />
            <NotesList notes={notes} />
          </div>
        </>
      ) : (
        <div className="panel">
          <p>Nenhum livro atual.</p>
          <p>Escolha um livro da fila ou adicione um novo para começar a ler.</p>
          <button
            className="save-btn"
            onClick={() => handleOpenAddBook("current")}
          >
            Adicionar livro
          </button>
        </div>
      )}

      <div className="panel">
        <h2 className="panel__title">Fila de livros</h2>
        <BookQueueList queue={queue} hasCurrentBook={currentBook !== null} />
        <button
          className="save-btn"
          style={{ marginTop: "8px" }}
          onClick={() => handleOpenAddBook("queue")}
        >
          Adicionar à fila
        </button>
      </div>

      <div className="panel">
        <h2 className="panel__title">Livros concluídos</h2>
        <FinishedBooksList books={finishedBooks} />
      </div>

      {showFinishModal && currentBook && (
        <FinishBookModal
          bookId={currentBook.id}
          bookTitle={currentBook.title}
          onClose={() => setShowFinishModal(false)}
        />
      )}

      {showAddBookModal && (
        <AddBookModal
          mode={addBookMode}
          hasCurrentBook={currentBook !== null}
          onClose={() => setShowAddBookModal(false)}
        />
      )}
    </div>
  );
}
