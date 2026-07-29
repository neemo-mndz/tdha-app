"use client";

import { useState, useTransition } from "react";
import { deleteTag } from "@/lib/actions/tags";

interface TagManagerProps {
  tags: { id: string; name: string; logCount: number }[];
  onDelete: (tagId: string) => void;
}

export function TagManager({ tags, onDelete }: TagManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestDelete = (tagId: string) => {
    setError(null);
    setConfirmingDelete(tagId);
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };

  const handleConfirmDelete = (tagId: string) => {
    setError(null);
    setConfirmingDelete(null);

    startTransition(async () => {
      const result = await deleteTag({ tagId });
      if (!result.success) {
        setError(result.error ?? "Não foi possível remover. Tente novamente.");
      } else {
        onDelete(tagId);
      }
    });
  };

  return (
    <div className="tag-manager__list">
      {/* Error inline */}
      {error && (
        <p
          role="alert"
          className="quick-capture-modal__error"
        >
          {error}
        </p>
      )}

      {tags.length === 0 ? (
        <p className="task-empty">Nenhuma tag criada ainda.</p>
      ) : (
        tags.map((tag) => (
          <div key={tag.id}>
            <div className="tag-manager__item">
              <span className="tag-manager__name">
                {tag.name}
              </span>
              <span className="tag-manager__count">
                {tag.logCount} {tag.logCount === 1 ? "registro" : "registros"}
              </span>

              {/* Delete button — first click */}
              {confirmingDelete !== tag.id && (
                <button
                  type="button"
                  onClick={() => handleRequestDelete(tag.id)}
                  disabled={isPending}
                  className="tag-manager__delete-btn"
                  aria-label={`Excluir tag ${tag.name}`}
                >
                  Excluir
                </button>
              )}
            </div>

            {/* Inline warning + confirmation — second click */}
            {confirmingDelete === tag.id && (
              <div role="alert" className="tag-manager__confirm-box">
                <p className="tag-manager__confirm-text">
                  Esta tag será removida de{" "}
                  <strong>{tag.logCount}</strong>{" "}
                  {tag.logCount === 1 ? "registro" : "registros"}. Confirmar?
                </p>
                <div className="tag-manager__confirm-actions">
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(tag.id)}
                    disabled={isPending}
                    className="tag-manager__confirm-yes"
                    aria-label={`Confirmar exclusão da tag ${tag.name}`}
                  >
                    Confirmar exclusão
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={isPending}
                    className="tag-manager__confirm-no"
                    aria-label="Cancelar exclusão"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
