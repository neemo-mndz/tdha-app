import type { FinishedBookDisplay } from "@/lib/types/reading";

interface FinishedBooksListProps {
  books: FinishedBookDisplay[];
}

export function FinishedBooksList({ books }: FinishedBooksListProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="finished-books-list">
      {books.map((book) => (
        <div key={book.id} className="finished-book-item">
          <strong>{book.title}</strong>
          {book.author && (
            <span className="finished-book-author">{book.author}</span>
          )}
          {book.review && <p className="finished-book-review">{book.review}</p>}
        </div>
      ))}
    </div>
  );
}
