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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Error inline */}
      {error && (
        <p
          role="alert"
          className="quick-capture-modal__error"
          style={{ marginBottom: 8 }}
        >
          {error}
        </p>
      )}

      {tags.length === 0 ? (
        <p className="task-empty">Nenhuma tag criada ainda.</p>
      ) : (
        tags.map((tag) => (
          <div key={tag.id} className="task-row" style={{ gap: 8, alignItems: "flex-start", flexDirection: "column" }}>
            {/* Tag name + count row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <span style={{ flex: 1, fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
                {tag.name}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  fontFamily: "IBM Plex Mono, monospace",
                  flexShrink: 0,
                }}
              >
                {tag.logCount} {tag.logCount === 1 ? "registro" : "registros"}
              </span>

              {/* Delete button — first click */}
              {confirmingDelete !== tag.id && (
                <button
                  type="button"
                  onClick={() => handleRequestDelete(tag.id)}
                  disabled={isPending}
                  aria-label={`Excluir tag ${tag.name}`}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 6,
                    flexShrink: 0,
                    transition: "color 0.12s ease",
                  }}
                >
                  Excluir
                </button>
              )}
            </div>

            {/* Inline warning + confirmation — second click */}
            {confirmingDelete === tag.id && (
              <div
                role="alert"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(198, 104, 90, 0.08)",
                  border: "1px solid rgba(198, 104, 90, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--ink)",
                    lineHeight: 1.45,
                  }}
                >
                  Esta tag será removida de{" "}
                  <strong>{tag.logCount}</strong>{" "}
                  {tag.logCount === 1 ? "registro" : "registros"}. Confirmar?
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(tag.id)}
                    disabled={isPending}
                    aria-label={`Confirmar exclusão da tag ${tag.name}`}
                    style={{
                      background: "#C6685A",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "opacity 0.12s ease",
                    }}
                  >
                    Confirmar exclusão
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={isPending}
                    aria-label="Cancelar exclusão"
                    style={{
                      background: "var(--bg)",
                      color: "var(--ink)",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
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
