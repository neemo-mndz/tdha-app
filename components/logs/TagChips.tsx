"use client";

interface TagChipsProps {
  tags: { id: string; name: string }[];
  selectedTagIds: Set<string>;
  onToggle: (tagId: string) => void;
  size?: "sm" | "md";
}

export function TagChips({ tags, selectedTagIds, onToggle, size = "md" }: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <div
      className={`tag-chips tag-chips--${size}`}
      role="group"
      aria-label="Filtrar por tags"
    >
      {tags.map((tag) => {
        const selected = selectedTagIds.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            className={`tag-chip tag-chip--${size}${selected ? " active" : ""}`}
            aria-pressed={selected}
            onClick={() => onToggle(tag.id)}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
