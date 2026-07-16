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
import { AddBookInline } from "@/components/reading/AddBookInline";
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

  const todayMarked = weekReadingDays.includes(getTodayDate());
  const weekStart = getWeekStart();

  return (
    <div className="reading-page">
      <div className="reading-page__header">
        <h1 className="reading-page__title">Companheiro de leitura</h1>
        <p className="reading-page__subtitle">
          Um livro por vez. Marcar que leu não exige dizer quanto.
        </p>
      </div>

      {/* Livro Atual */}
      <div className="panel">
        <h2 className="panel__title">Livro atual</h2>

        {currentBook ? (
          <>
            <CurrentBookCard
              book={currentBook}
              onFinish={() => setShowFinishModal(true)}
            />

            <ReadingButton
              bookId={currentBook.id}
              todayMarked={todayMarked}
              onFinish={() => setShowFinishModal(true)}
            />

            <MiniWeekCalendar
              bookId={currentBook.id}
              weekStart={weekStart}
              readDays={weekReadingDays}
            />

            <NoteForm bookId={currentBook.id} />
            <NotesList notes={notes} />
          </>
        ) : (
          <div className="reading-empty">
            <p>Nenhum livro selecionado.</p>
            <p>Adicione um livro na fila abaixo e comece a ler.</p>
          </div>
        )}
      </div>

      {/* Próximos da fila */}
      <div className="panel">
        <h2 className="panel__title">Próximos da fila</h2>
        <p className="panel__subtitle">Sem pressão pra começar — só uma lista de intenção</p>
        <BookQueueList queue={queue} hasCurrentBook={currentBook !== null} />
        <AddBookInline hasCurrentBook={currentBook !== null} />
      </div>

      {/* Concluídos */}
      {finishedBooks.length > 0 && (
        <div className="panel">
          <h2 className="panel__title">Concluídos</h2>
          <p className="panel__subtitle">Livros finalizados, com a resenha que você escreveu ao terminar</p>
          <FinishedBooksList books={finishedBooks} />
        </div>
      )}

      {showFinishModal && currentBook && (
        <FinishBookModal
          bookId={currentBook.id}
          bookTitle={currentBook.title}
          onClose={() => setShowFinishModal(false)}
        />
      )}
    </div>
  );
}
