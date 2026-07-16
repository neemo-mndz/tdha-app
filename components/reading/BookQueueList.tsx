"use client";

import { useOptimistic, useTransition } from "react";
import {
  startReadingFromQueue,
  removeBookFromQueue,
} from "@/lib/actions/books";
import type { QueuedBookDisplay } from "@/lib/types/reading";

interface BookQueueListProps {
  queue: QueuedBookDisplay[];
  hasCurrentBook: boolean;
}

type OptimisticAction =
  | { type: "remove"; id: string }
  | { type: "start"; id: string };

function queueReducer(
  state: QueuedBookDisplay[],
  action: OptimisticAction
): QueuedBookDisplay[] {
  switch (action.type) {
    case "remove":
      return state.filter((book) => book.id !== action.id);
    case "start":
      return state.filter((book) => book.id !== action.id);
    default:
      return state;
  }
}

export function BookQueueList({ queue, hasCurrentBook }: BookQueueListProps) {
  const [optimisticQueue, dispatch] = useOptimistic(queue, queueReducer);
  const [, startTransition] = useTransition();

  const handleStartReading = async (bookId: string) => {
    if (hasCurrentBook) {
      const confirmed = window.confirm(
        "O livro atual voltará para a fila. Deseja continuar?"
      );
      if (!confirmed) return;
    }

    startTransition(() => {
      dispatch({ type: "start", id: bookId });
    });

    await startReadingFromQueue({ bookId });
  };

  const handleRemove = async (bookId: string) => {
    const confirmed = window.confirm("Remover este livro da fila?");
    if (!confirmed) return;

    startTransition(() => {
      dispatch({ type: "remove", id: bookId });
    });

    await removeBookFromQueue({ bookId });
  };

  if (optimisticQueue.length === 0) {
    return (
      <p className="book-queue__empty">
        Nenhum livro na fila. Adicione livros para ler depois.
      </p>
    );
  }

  return (
    <div className="book-queue">
      {optimisticQueue.map((book) => (
        <div key={book.id} className="book-queue__item">
          <div className="book-queue__info">
            <span className="book-queue__title">{book.title}</span>
            {book.author && (
              <span className="book-queue__author">{book.author}</span>
            )}
          </div>
          <div className="book-queue__actions">
            <button
              className="book-queue__start-btn"
              onClick={() => handleStartReading(book.id)}
            >
              Começar a ler
            </button>
            <button
              className="book-queue__remove-btn"
              onClick={() => handleRemove(book.id)}
            >
              Remover
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
