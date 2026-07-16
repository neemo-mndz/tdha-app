import type { FinishedBookDisplay } from "@/lib/types/reading";

interface FinishedBooksListProps {
  books: FinishedBookDisplay[];
}

export function FinishedBooksList({ books }: FinishedBooksListProps) {
  if (books.length === 0) {
    return (
      <p className="finished-books-list__empty">Nenhum livro concluído ainda.</p>
    );
  }

  return (
    <ul className="finished-books-list">
      {books.map((book) => (
        <li key={book.id} className="finished-book-item">
          <strong>{book.title}</strong>
          {book.author && <span> — {book.author}</span>}
          {book.rating && <span> ({book.rating}/5)</span>}
          {book.review && <p className="finished-book-review">{book.review}</p>}
        </li>
      ))}
    </ul>
  );
}
