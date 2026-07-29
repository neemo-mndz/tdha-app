"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createTag, addTagToLog, removeTagFromLog } from "@/lib/actions/tags";

interface Tag {
  id: string;
  name: string;
}

interface TagEditorProps {
  logId: string;
  currentTags: Tag[];
  allUserTags: Tag[];
  date: string;
}

export function TagEditor({
  logId,
  currentTags,
  allUserTags,
  date,
}: TagEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [localCurrentTags, setLocalCurrentTags] = useState<Tag[]>(currentTags);
  const [localAllTags, setLocalAllTags] = useState<Tag[]>(allUserTags);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmedInput = inputValue.trim();

  // Tags not yet associated with this log
  const currentTagIds = new Set(localCurrentTags.map((t) => t.id));

  // Suggestions: existing user tags that match the input (case-insensitive) and are not already added
  const suggestions =
    trimmedInput.length > 0
      ? localAllTags.filter(
          (t) =>
            !currentTagIds.has(t.id) &&
            t.name.toLowerCase().includes(trimmedInput.toLowerCase())
        )
      : localAllTags.filter((t) => !currentTagIds.has(t.id));

  // Check if the input exactly matches an existing tag (case-insensitive)
  const exactMatch = localAllTags.find(
    (t) => t.name.toLowerCase() === trimmedInput.toLowerCase()
  );

  // Whether the input value is a new tag (no exact match in all user tags)
  const isNewTag =
    trimmedInput.length > 0 &&
    !exactMatch;

  const handleAddTag = (tag: Tag) => {
    if (currentTagIds.has(tag.id)) return;
    setError(null);
    startTransition(async () => {
      const result = await addTagToLog({ logId, tagId: tag.id, date });
      if (result.success) {
        setLocalCurrentTags((prev) => [...prev, tag]);
        setInputValue("");
      } else {
        setError(result.error ?? "Erro ao adicionar tag");
      }
    });
  };

  const handleRemoveTag = (tag: Tag) => {
    setError(null);
    startTransition(async () => {
      const result = await removeTagFromLog({ logId, tagId: tag.id, date });
      if (result.success) {
        setLocalCurrentTags((prev) => prev.filter((t) => t.id !== tag.id));
      } else {
        setError(result.error ?? "Erro ao remover tag");
      }
    });
  };

  const handleCreateAndAdd = () => {
    if (!trimmedInput) return;
    setError(null);
    startTransition(async () => {
      const createResult = await createTag({ name: trimmedInput });
      if (!createResult.success) {
        // If tag already exists (race condition), try to find it and add
        if (createResult.error === "Tag já existe") {
          const existing = localAllTags.find(
            (t) => t.name.toLowerCase() === trimmedInput.toLowerCase()
          );
          if (existing) {
            handleAddTag(existing);
            return;
          }
        }
        setError(createResult.error ?? "Erro ao criar tag");
        return;
      }
      const newTag = createResult.tag!;
      setLocalAllTags((prev) => [...prev, newTag]);
      const addResult = await addTagToLog({ logId, tagId: newTag.id, date });
      if (addResult.success) {
        setLocalCurrentTags((prev) => [...prev, newTag]);
        setInputValue("");
      } else {
        setError(addResult.error ?? "Erro ao adicionar tag");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (exactMatch && !currentTagIds.has(exactMatch.id)) {
        handleAddTag(exactMatch);
      } else if (isNewTag) {
        handleCreateAndAdd();
      }
    } else if (e.key === "Escape") {
      setInputValue("");
    }
  };

  return (
    <div className="tag-editor" aria-label="Editar tags do registro">
      {/* Current tags with remove buttons */}
      {localCurrentTags.length > 0 && (
        <div
          className="tag-editor__current"
          role="group"
          aria-label="Tags atuais"
        >
          {localCurrentTags.map((tag) => (
            <span key={tag.id} className="tag-editor__chip">
              {tag.name}
              <button
                type="button"
                className="tag-editor__chip-remove"
                aria-label={`Remover tag ${tag.name}`}
                onClick={() => handleRemoveTag(tag)}
                disabled={isPending}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Text input with autocomplete */}
      <div className="tag-editor__input-row">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar tag..."
          maxLength={30}
          aria-label="Nome da tag"
          className="tag-editor__input"
          disabled={isPending}
          autoComplete="off"
        />
        {isNewTag && (
          <button
            type="button"
            className="tag-editor__create-btn"
            onClick={handleCreateAndAdd}
            disabled={isPending}
            aria-label={`Criar tag "${trimmedInput}"`}
          >
            + Criar &ldquo;{trimmedInput}&rdquo;
          </button>
        )}
      </div>

      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <div
          className="tag-editor__suggestions"
          role="group"
          aria-label="Sugestões de tags"
        >
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-chip tag-chip--sm"
              onClick={() => handleAddTag(tag)}
              disabled={isPending}
              aria-label={`Adicionar tag ${tag.name}`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="log-form__error">
          {error}
        </p>
      )}
    </div>
  );
}
